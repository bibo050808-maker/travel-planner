import cities from './cities.js'
import { generateFoodData, generateStayData } from './foodStayEngine.js'
import { searchRoutes } from './routeEngine.js'
import chinaOutline from './chinaOutline.js'

// ============================================================
// 旅行攻略生成引擎 (Phase 1: 富内容)
// 输出 { html, fullHtml, text }
//   html     —— 作用域片段 (<style>.tg ...</style><div class="tg-guide">...</div>)，注入页内预览安全、不污染全局
//   fullHtml —— 完整独立文档，用于下载
//   text     —— 纯文本版
// ============================================================

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

function hashStr(s) {
  var h = 0
  for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h | 0 }
  return Math.abs(h)
}

function fmtDur(min) {
  min = Math.round(min)
  var h = Math.floor(min / 60), m = min % 60
  if (h <= 0) return m + '分钟'
  return h + '小时' + (m > 0 ? m + '分' : '')
}

function fmtDurShort(min) {
  min = Math.round(min)
  var h = Math.floor(min / 60), m = min % 60
  if (h <= 0) return m + 'min'
  return h + 'h' + (m > 0 ? m : '')
}

function seasonOf(month) {
  if (month >= 3 && month <= 5) return '春'
  if (month >= 6 && month <= 8) return '夏'
  if (month >= 9 && month <= 11) return '秋'
  return '冬'
}

// ---------------- 城市排序 ----------------
function orderCities(tripCities, tripRoutes) {
  var ordered = [], added = {}
  if (tripRoutes && tripRoutes.length > 0) {
    tripRoutes.forEach(function (r) {
      var fc = tripCities.find(function (c) { return c.id === r.fromId })
      var tc = tripCities.find(function (c) { return c.id === r.toId })
      if (fc && !added[fc.id]) { ordered.push(fc); added[fc.id] = true }
      if (tc && !added[tc.id]) { ordered.push(tc); added[tc.id] = true }
    })
  }
  tripCities.forEach(function (c) { if (!added[c.id]) { ordered.push(c); added[c.id] = true } })
  return ordered
}

// ---------------- 城际交通 ----------------
function legInfo(fromCity, toCity) {
  var r = searchRoutes(fromCity.id, toCity.id)
  var dist = r.dist || 500
  var prefer = dist > 1100 ? '飞机' : '高铁'
  var comfort = (r.comfort || []).find(function (o) { return o.type.indexOf(prefer) >= 0 }) || (r.comfort || [])[0]
  var cheapest = (r.budget || []).slice().sort(function (a, b) { return a.totalPrice - b.totalPrice })[0]
  var mode = comfort ? comfort.type : prefer
  var color = mode.indexOf('飞机') >= 0 ? '#7c3aed' : mode.indexOf('大巴') >= 0 ? '#059669' : '#2563eb'
  var icon = mode.indexOf('飞机') >= 0 ? '✈️' : mode.indexOf('大巴') >= 0 ? '🚌' : '🚄'
  return {
    from: fromCity, to: toCity, dist: dist, mode: mode, color: color, icon: icon,
    curved: mode.indexOf('飞机') >= 0,
    durMin: comfort ? comfort.totalDuration : 0,
    price: comfort ? comfort.totalPrice : 0,
    comfort: comfort, cheapest: cheapest,
  }
}

// ---------------- 离线地图 ----------------
var MAP_W = 425, MAP_H = 300
var MAP_BBOX = { minLng: 72, maxLng: 136, minLat: 17, maxLat: 54 }
function project(lng, lat) {
  var x = (lng - MAP_BBOX.minLng) / (MAP_BBOX.maxLng - MAP_BBOX.minLng) * MAP_W
  var y = (MAP_BBOX.maxLat - lat) / (MAP_BBOX.maxLat - MAP_BBOX.minLat) * MAP_H
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
}

function outlinePath() {
  var d = ''
  ;(chinaOutline.rings || []).forEach(function (ring) {
    for (var i = 0; i < ring.length; i++) {
      var p = project(ring[i][0], ring[i][1])
      d += (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]
    }
    d += 'Z'
  })
  return d
}

function buildMapSvg(ordered, legs) {
  var pts = ordered.map(function (c) { var p = project(c.lng, c.lat); return { c: c, x: p[0], y: p[1] } })
  var parts = []
  parts.push('<svg class="tg-svg" viewBox="0 0 ' + MAP_W + ' ' + MAP_H + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">')
  // defs: arrow markers per color
  parts.push('<defs>')
  ;['#2563eb', '#7c3aed', '#059669'].forEach(function (col, i) {
    parts.push('<marker id="ar' + i + '" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="' + col + '"/></marker>')
  })
  parts.push('</defs>')
  // ocean bg
  parts.push('<rect x="0" y="0" width="' + MAP_W + '" height="' + MAP_H + '" fill="#eef5fb"/>')
  // land
  parts.push('<path d="' + outlinePath() + '" fill="#dCEbF7" stroke="#a7c7e3" stroke-width="0.8" stroke-linejoin="round"/>')

  // routes
  var usedModes = {}
  function markerIdFor(col) { return col === '#2563eb' ? 'ar0' : col === '#7c3aed' ? 'ar1' : 'ar2' }
  for (var i = 0; i + 1 < pts.length; i++) {
    var a = pts[i], b = pts[i + 1], leg = legs[i]
    var col = leg ? leg.color : '#2563eb'
    usedModes[leg ? leg.mode : '高铁'] = col
    var dline
    if (leg && leg.curved) {
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1
      var off = Math.min(38, len * 0.22)
      var cx = mx - dy / len * off, cy = my + dx / len * off
      dline = 'M' + a.x + ',' + a.y + ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + b.x + ',' + b.y
      parts.push('<path d="' + dline + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#' + markerIdFor(col) + ')" opacity="0.9"/>')
      var lx = cx, ly = cy
    } else {
      dline = 'M' + a.x + ',' + a.y + ' L' + b.x + ',' + b.y
      parts.push('<path d="' + dline + '" fill="none" stroke="' + col + '" stroke-width="2.2" marker-end="url(#' + markerIdFor(col) + ')" opacity="0.92"/>')
      var lx = (a.x + b.x) / 2, ly = (a.y + b.y) / 2
    }
    // distance/time label at midpoint
    if (leg) {
      var lbl = leg.dist + 'km·' + leg.icon + fmtDurShort(leg.durMin)
      parts.push('<text x="' + lx.toFixed(1) + '" y="' + (ly - 4).toFixed(1) + '" class="tg-mlbl" text-anchor="middle" stroke="#fff" stroke-width="3" paint-order="stroke">' + esc(lbl) + '</text>')
      parts.push('<text x="' + lx.toFixed(1) + '" y="' + (ly - 4).toFixed(1) + '" class="tg-mlbl" text-anchor="middle" fill="' + col + '">' + esc(lbl) + '</text>')
    }
  }

  // city dots + labels
  pts.forEach(function (pt, idx) {
    var isFirst = idx === 0, isLast = idx === pts.length - 1 && pts.length > 1
    var ring = isFirst ? '#16a34a' : isLast ? '#dc2626' : '#2563eb'
    parts.push('<circle cx="' + pt.x + '" cy="' + pt.y + '" r="7" fill="#fff" opacity="0.65"/>')
    parts.push('<circle cx="' + pt.x + '" cy="' + pt.y + '" r="5" fill="' + ring + '"/>')
    parts.push('<text x="' + pt.x + '" y="' + (pt.y + 2.8) + '" class="tg-mnum" text-anchor="middle" fill="#fff">' + (idx + 1) + '</text>')
    var right = pt.x < MAP_W * 0.74
    var lxx = right ? pt.x + 9 : pt.x - 9
    var anchor = right ? 'start' : 'end'
    var lyy = pt.y - 8 + (idx % 2 === 0 ? 0 : 14)
    parts.push('<text x="' + lxx + '" y="' + lyy + '" class="tg-mcity" text-anchor="' + anchor + '" stroke="#fff" stroke-width="3" paint-order="stroke">' + esc(pt.c.name) + '</text>')
    parts.push('<text x="' + lxx + '" y="' + lyy + '" class="tg-mcity" text-anchor="' + anchor + '" fill="#1e293b">' + esc(pt.c.name) + '</text>')
  })

  // compass
  parts.push('<g transform="translate(20,26)"><path d="M0,-12 L4,6 L0,2 L-4,6 Z" fill="#dc2626"/><text x="0" y="-15" class="tg-mcomp" text-anchor="middle" fill="#475569">N</text></g>')

  // legend
  var modeKeys = Object.keys(usedModes)
  if (modeKeys.length > 0) {
    var ly0 = MAP_H - 8 - (modeKeys.length - 1) * 15
    parts.push('<rect x="' + (MAP_W - 92) + '" y="' + (ly0 - 13) + '" width="86" height="' + (modeKeys.length * 15 + 6) + '" rx="5" fill="#ffffff" opacity="0.78"/>')
    modeKeys.forEach(function (m, i) {
      var yy = ly0 + i * 15
      parts.push('<line x1="' + (MAP_W - 86) + '" y1="' + (yy - 3) + '" x2="' + (MAP_W - 68) + '" y2="' + (yy - 3) + '" stroke="' + usedModes[m] + '" stroke-width="2.4"/>')
      parts.push('<text x="' + (MAP_W - 64) + '" y="' + yy + '" class="tg-mleg" fill="#334155">' + esc(m) + '</text>')
    })
  }
  parts.push('</svg>')
  return parts.join('')
}

// ---------------- 逐日行程 ----------------
var STYLE_CFG = {
  classic: { name: '经典', night: ['品尝当地特色晚餐', '夜游核心商圈', '老街夜市觅食'] },
  food: { name: '美食', night: ['打卡网红美食店', '夜市深度扫街', '地道宵夜小馆'] },
  culture: { name: '文化', night: ['观看当地特色演出', '文化街区夜游', '书店/美术馆漫步'] },
  relax: { name: '休闲', night: ['咖啡馆发呆放松', '江边/湖边夜散步', '做个 SPA 解乏'] },
}

function highlightFor(city, attr) {
  var tags = city.tags || []
  var pool = []
  if (tags.indexOf('山水') >= 0 || tags.indexOf('自然') >= 0) pool.push('饱览自然山水', '呼吸清新空气')
  if (tags.indexOf('文化') >= 0 || tags.indexOf('历史') >= 0) pool.push('感受历史底蕴', '触摸城市记忆')
  if (tags.indexOf('海滨') >= 0 || tags.indexOf('度假') >= 0) pool.push('看海听浪吹风', '享受海岛慢时光')
  if (tags.indexOf('古镇') >= 0) pool.push('漫步古巷石桥', '寻一处烟火人家')
  if (tags.indexOf('美食') >= 0) pool.push('边逛边尝小吃', '寻味地道烟火')
  if (pool.length === 0) pool.push('打卡地标', '深度漫游')
  return pool[hashStr(city.id + attr) % pool.length]
}

function buildItinerary(city, days, style, isFirstCity, dayDates, flowMap) {
  var cfg = STYLE_CFG[style] || STYLE_CFG.classic
  var attrs = (city.attractions || []).slice()
  var nights = cfg.night
  var cuisines = city.cuisines || []
  // 上午/下午的观光位
  var sightSlots = []
  for (var d = 0; d < days; d++) { sightSlots.push({ day: d, t: '上午' }); sightSlots.push({ day: d, t: '下午' }) }
  // 第一天上午固定为抵达
  var arrivalText = isFirstCity ? ('抵达' + city.name + '，入住酒店稍作休整') : ('抵达' + city.name + '，安顿后开启行程')
  var assign = {}
  // day0 上午 = arrival
  assign['0-上午'] = { kind: 'arrive', text: arrivalText }
  var ai = 0
  for (var s = 0; s < sightSlots.length; s++) {
    var slot = sightSlots[s]
    var key = slot.day + '-' + slot.t
    if (key === '0-上午') continue
    if (ai < attrs.length) {
      var a = attrs[ai++]
      var dur = 2 + (hashStr(city.id + a) % 2) // 2~3h
      assign[key] = { kind: 'sight', text: '游览' + a, hi: highlightFor(city, a), dur: dur + '小时' }
    } else {
      assign[key] = { kind: 'free', text: '自由活动 / 周边漫步', hi: '随心而行', dur: '' }
    }
  }
  // 最后一天下午改为返程准备
  assign[(days - 1) + '-下午'] = { kind: 'leave', text: days > 1 ? '采购特产，准备前往下一站' : '自由活动后准备离开', hi: '收好行李与回忆', dur: '' }

  var out = []
  for (var dd = 0; dd < days; dd++) {
    var rows = ''
    ;['上午', '下午', '晚上'].forEach(function (t) {
      var item
      if (t === '晚上') {
        var nightText = nights[dd % nights.length]
        if (cuisines.length > 0 && (style === 'food' || dd % 2 === 0)) nightText = '品尝' + cuisines[dd % cuisines.length] + ' 等地道美味'
        item = { kind: 'night', text: nightText, hi: '', dur: '' }
      } else {
        item = assign[dd + '-' + t] || { kind: 'free', text: '自由活动', hi: '', dur: '' }
      }
      var badge = t === '上午' ? 'tg-am' : t === '下午' ? 'tg-pm' : 'tg-ev'
      rows += '<div class="tg-slot"><span class="tg-tbadge ' + badge + '">' + t + '</span>'
      rows += '<div class="tg-slotbody"><span class="tg-slottext">' + esc(item.text) + '</span>'
      if (item.hi) rows += '<span class="tg-slothi">· ' + esc(item.hi) + '</span>'
      if (item.dur) rows += '<span class="tg-dur">⏱ ' + esc(item.dur) + '</span>'
      rows += '</div></div>'
    })
    // 逐日真实日期 + 天气 + 人流（来自人流/天气引擎）
    var dstr = dayDates && dayDates[dd] ? dayDates[dd] : ''
    var fe = (dstr && flowMap) ? flowMap[dstr] : null
    var meta = ''
    if (dstr) {
      var dp = dstr.split('-')
      meta += '<span class="tg-ddate">' + parseInt(dp[1]) + '/' + parseInt(dp[2]) + '</span>'
    }
    if (fe && fe.weather) meta += '<span class="tg-wx">🌤️ ' + esc(fe.weather) + '</span>'
    if (fe && fe.crowdLabel) meta += '<span class="tg-crowd tg-' + (fe.crowdColor || 'mid') + '">' + esc(fe.crowdLabel) + '</span>'
    out.push('<div class="tg-day"><div class="tg-daynum"><span class="tg-dayn">Day ' + (dd + 1) + '</span>' + meta + '</div>' + rows + '</div>')
  }
  return out.join('')
}

// ---------------- 预算 ----------------
function buildBudget(ordered, legs, days, tierMul) {
  var nightsTotal = 0, lodging = 0, food = 0, tickets = 0
  ordered.forEach(function (c) {
    var n = Math.max(1, days)
    nightsTotal += n
    lodging += (c.avgHotelPrice || 300) * n * tierMul
    food += (c.costLevel * 55 + 70) * n
    tickets += 180
  })
  var transport = 0
  legs.forEach(function (l) { transport += l.price || 0 })
  var misc = ordered.length * days * 40
  var base = Math.round(lodging + food + transport + tickets + misc)
  var lo = Math.round(base * 0.78), hi = Math.round(base * 1.3)
  return {
    rows: [
      ['🚄 城际交通', legs.length + ' 段 · 单程推荐方案', Math.round(transport)],
      ['🏨 住宿', nightsTotal + ' 晚 · 中端档', Math.round(lodging)],
      ['🍜 餐饮', days * ordered.length + ' 人天', Math.round(food)],
      ['🎫 门票', ordered.length + ' 城景点', Math.round(tickets)],
      ['🧳 杂项', '市内交通/购物', Math.round(misc)],
    ],
    base: base, lo: lo, hi: hi, nights: nightsTotal,
  }
}

// ---------------- 吃住精选 ----------------
function stayTable(city) {
  var rows = generateStayData(city).slice(0, 3).map(function (s) {
    return '<tr><td><b>' + esc(s.name) + '</b><span class="tg-mini">' + esc(s.category) + ' ' + esc(s.stars) + '</span></td>' +
      '<td>⭐' + s.rating + '</td><td>' + esc((s.tags || [])[0] || '') + '</td><td class="tg-price">¥' + s.avgPrice + '</td></tr>'
  }).join('')
  return '<table class="tg-tbl"><thead><tr><th>酒店</th><th>评分</th><th>特点</th><th>均价/晚</th></tr></thead><tbody>' + rows + '</tbody></table>'
}
function foodTable(city) {
  var rows = generateFoodData(city).slice(0, 3).map(function (f) {
    return '<tr><td><b>' + esc(f.name) + '</b><span class="tg-mini">' + esc(f.category) + '</span></td>' +
      '<td>⭐' + f.rating + '</td><td>' + f.recommendRate + '%荐</td><td class="tg-price">¥' + f.avgPrice + '/人</td></tr>'
  }).join('')
  return '<table class="tg-tbl"><thead><tr><th>餐厅</th><th>评分</th><th>推荐</th><th>人均</th></tr></thead><tbody>' + rows + '</tbody></table>'
}

// ---------------- 出行贴士 ----------------
function buildTips(ordered, month) {
  var season = seasonOf(month)
  var tips = []
  var packBySeason = {
    '春': '🌸 春季多变，备一件薄外套和雨具',
    '夏': '☀️ 夏季炎热，防晒霜、遮阳帽、补水必备',
    '秋': '🍁 秋高气爽，早晚温差大，备件外套',
    '冬': '❄️ 冬季寒冷，羽绒服、保暖内衣不能少',
  }
  tips.push(packBySeason[season])
  var allTags = {}
  ordered.forEach(function (c) { (c.tags || []).forEach(function (t) { allTags[t] = true }) })
  if (allTags['高原']) tips.push('🏔️ 含高原地区，提前适应、备好抗高反药物，行程放缓')
  if (allTags['海滨'] || allTags['度假']) tips.push('🏖️ 海边紫外线强，泳衣、防水袋、防晒别忘')
  if (allTags['冰雪']) tips.push('🧤 冰雪目的地路面湿滑，防滑鞋、手套、暖宝宝备齐')
  if (allTags['沙漠']) tips.push('🏜️ 沙漠昼夜温差极大，防风沙口罩与厚外套必备')
  tips.push('📅 提前预订往返票与首晚酒店，避开周末与节假日涨价')
  tips.push('📱 下载离线地图与翻译 App，带少量现金以备不时之需')
  return tips.map(function (t) { return '<div class="tg-tip">' + esc(t) + '</div>' }).join('')
}

// ---------------- 样式 ----------------
var GUIDE_CSS =
  '.tg-guide{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;max-width:760px;margin:0 auto;color:#1f2937;line-height:1.7;font-size:14px;-webkit-text-size-adjust:100%}' +
  '.tg-guide *{box-sizing:border-box}' +
  '.tg-hd{background:linear-gradient(135deg,#4fc3f7,#1976d2);color:#fff;border-radius:14px;padding:20px 22px;margin-bottom:16px}' +
  '.tg-hd h1{margin:0;font-size:22px;font-weight:800;letter-spacing:0.5px}' +
  '.tg-sub{margin-top:8px;font-size:13px;opacity:0.95}' +
  '.tg-sub b{font-weight:700}' +
  '.tg-card{background:#fff;border:1px solid #e6eaf0;border-radius:12px;padding:16px 18px;margin-bottom:14px}' +
  '.tg-card>h2{margin:0 0 12px;font-size:16px;color:#0f3d6b;border-left:4px solid #4fc3f7;padding-left:10px;line-height:1.2}' +
  '.tg-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}' +
  '.tg-stat{background:#f4f8fc;border-radius:10px;padding:10px;text-align:center}' +
  '.tg-stat .v{font-size:18px;font-weight:800;color:#1976d2}' +
  '.tg-stat .l{font-size:11px;color:#6b7280;margin-top:2px}' +
  '.tg-svg{width:100%;height:auto;display:block;border-radius:10px;border:1px solid #e6eaf0}' +
  '.tg-mlbl{font-size:8px;font-weight:700}' +
  '.tg-mnum{font-size:7px;font-weight:800}' +
  '.tg-mcity{font-size:9px;font-weight:700}' +
  '.tg-mcomp{font-size:8px;font-weight:700}' +
  '.tg-mleg{font-size:8px}' +
  '.tg-city{background:#fff;border:1px solid #e6eaf0;border-radius:12px;padding:16px 18px;margin-bottom:14px}' +
  '.tg-cityhd{display:flex;align-items:baseline;flex-wrap:wrap;gap:8px;border-bottom:1px dashed #e2e8f0;padding-bottom:10px;margin-bottom:12px}' +
  '.tg-cityhd .nm{font-size:18px;font-weight:800;color:#0f3d6b}' +
  '.tg-cityhd .pv{font-size:12px;color:#6b7280}' +
  '.tg-tag{display:inline-block;background:#e8f3ff;color:#1565c0;border-radius:5px;font-size:11px;padding:1px 7px;margin-left:2px}' +
  '.tg-qstat{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#374151;margin-bottom:12px}' +
  '.tg-qstat span b{color:#1976d2}' +
  '.tg-day{background:#f7fafd;border:1px solid #eef2f7;border-radius:10px;padding:10px 12px;margin-bottom:10px}' +
  '.tg-daynum{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:6px}' +
  '.tg-dayn{font-weight:800;color:#1976d2;font-size:13px}' +
  '.tg-ddate{font-size:11px;color:#94a3b8;font-weight:600}' +
  '.tg-wx{font-size:11px;color:#0369a1;background:#e0f2fe;border-radius:5px;padding:1px 7px}' +
  '.tg-crowd{font-size:11px;font-weight:700;border-radius:5px;padding:1px 7px}' +
  '.tg-low{background:#e8f5e9;color:#2e7d32}.tg-mid{background:#fff8e1;color:#f57f17}.tg-high{background:#ffebee;color:#c62828}' +
  '.tg-flow{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:8px 0 4px;font-size:12px}' +
  '.tg-flowadv{font-weight:700;color:#334155}' +
  '.tg-flowsum{color:#64748b}.tg-flowsum b{color:#1976d2}' +
  '.tg-best{background:#ecfdf5;border-left:3px solid #34d399;border-radius:6px;padding:7px 11px;margin:4px 0 8px;font-size:12px;color:#065f46}.tg-best b{color:#047857}' +
  '.tg-slot{display:flex;gap:8px;align-items:flex-start;padding:4px 0}' +
  '.tg-tbadge{flex:none;font-size:11px;font-weight:700;color:#fff;border-radius:5px;padding:2px 7px;margin-top:1px;width:34px;text-align:center}' +
  '.tg-am{background:#f59e0b}.tg-pm{background:#3b82f6}.tg-ev{background:#8b5cf6}' +
  '.tg-slotbody{flex:1}' +
  '.tg-slottext{font-weight:600;color:#1f2937}' +
  '.tg-slothi{color:#64748b;font-size:12px;margin-left:6px}' +
  '.tg-dur{display:inline-block;color:#0ea5a3;font-size:11px;margin-left:8px;background:#e6fffb;border-radius:4px;padding:0 5px}' +
  '.tg-sub2{font-weight:700;color:#334155;font-size:13px;margin:12px 0 6px}' +
  '.tg-chips{display:flex;flex-wrap:wrap;gap:6px}' +
  '.tg-chip{display:inline-block;background:#e8f5e9;color:#2e7d32;border-radius:5px;font-size:12px;padding:2px 9px}' +
  '.tg-chip.food{background:#fff3e0;color:#e65100}' +
  '.tg-tbl{width:100%;border-collapse:collapse;margin:6px 0 2px;font-size:12px}' +
  '.tg-tbl th{background:#f1f5f9;color:#475569;text-align:left;padding:7px 9px;font-weight:600}' +
  '.tg-tbl td{border-top:1px solid #eef2f7;padding:7px 9px;vertical-align:top}' +
  '.tg-tbl .tg-mini{display:block;color:#94a3b8;font-size:10px;font-weight:400}' +
  '.tg-price{color:#f57f17;font-weight:700;white-space:nowrap}' +
  '.tg-leg{display:flex;align-items:center;gap:10px;background:#f7fafd;border:1px solid #eef2f7;border-radius:10px;padding:10px 12px;margin-bottom:8px;flex-wrap:wrap}' +
  '.tg-legroute{font-weight:800;color:#0f3d6b;font-size:14px;flex:none}' +
  '.tg-opt{font-size:12px;color:#374151;background:#fff;border:1px solid #e6eaf0;border-radius:8px;padding:4px 9px}' +
  '.tg-opt b{color:#1976d2}' +
  '.tg-save{color:#16a34a;font-size:11px;font-weight:700}' +
  '.tg-budget td.tot{font-weight:800;color:#0f3d6b}' +
  '.tg-brange{margin-top:8px;font-size:13px}' +
  '.tg-brange .big{font-size:20px;font-weight:800;color:#e65100}' +
  '.tg-tip{background:#eef7ff;border-left:3px solid #4fc3f7;border-radius:6px;padding:8px 12px;margin-bottom:7px;font-size:13px;color:#334155}' +
  '.tg-footer{text-align:center;color:#9aa5b1;font-size:11px;margin-top:18px;padding-top:10px;border-top:1px dashed #e2e8f0}' +
  '@media(max-width:520px){.tg-grid{grid-template-columns:repeat(2,1fr)}.tg-hd h1{font-size:19px}}'

// ---------------- 主函数 ----------------
// ---------------- 日期 / 人流辅助 ----------------
function fmtDateISO(d) {
  var m = String(d.getMonth() + 1).padStart(2, '0')
  var day = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + m + '-' + day
}
function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r }
function shortDate(dstr) { var p = String(dstr).split('-'); return p.length === 3 ? (parseInt(p[1]) + '/' + parseInt(p[2])) : dstr }
function flowToMap(arr) { var m = {}; (arr || []).forEach(function (f) { if (f && f.date) m[f.date] = f }); return m }

export function generateGuide(tripCities, tripRoutes, options) {
  options = options || {}
  var style = options.style || 'classic'
  var days = Math.max(1, Math.min(5, options.daysPerCity || 3))
  var month = options.month || (new Date().getMonth() + 1)
  var tierMul = options.budgetTier === 'economy' ? 0.7 : options.budgetTier === 'lux' ? 1.4 : 1.0
  var flowByCity = options.flowByCity || {}
  var dayCursor = new Date()

  var ordered = orderCities(tripCities || [], tripRoutes || [])
  if (!ordered || ordered.length === 0) return { html: '', fullHtml: '', text: '' }

  var legs = []
  for (var i = 0; i + 1 < ordered.length; i++) legs.push(legInfo(ordered[i], ordered[i + 1]))
  var totalDist = legs.reduce(function (s, l) { return s + l.dist }, 0)
  var totalDays = ordered.length * days
  var budget = buildBudget(ordered, legs, days, tierMul)
  var cityNames = ordered.map(function (c) { return c.name }).join(' → ')
  var cfg = STYLE_CFG[style] || STYLE_CFG.classic

  var c = ''
  // header
  c += '<div class="tg-hd"><h1>🧭 ' + esc(cityNames) + ' 之旅</h1>' +
    '<div class="tg-sub">' + new Date().toLocaleDateString('zh-CN') + ' 生成 · <b>' + totalDays + '</b> 天 · <b>' + ordered.length + '</b> 城 · ' + cfg.name + '玩法 · 预算 <b>¥' + budget.lo + '–' + budget.hi + '</b>/人</div></div>'

  // map
  c += '<section class="tg-card"><h2>🗺️ 行程地图</h2>' + buildMapSvg(ordered, legs) + '</section>'

  // overview
  c += '<section class="tg-card"><h2>📌 行程总览</h2><div class="tg-grid">' +
    '<div class="tg-stat"><div class="v">' + totalDays + '</div><div class="l">总天数</div></div>' +
    '<div class="tg-stat"><div class="v">' + ordered.length + '</div><div class="l">目的地</div></div>' +
    '<div class="tg-stat"><div class="v">' + totalDist + '</div><div class="l">总里程km</div></div>' +
    '<div class="tg-stat"><div class="v">¥' + budget.base + '</div><div class="l">人均预算</div></div>' +
    '</div></section>'

  // per city
  ordered.forEach(function (city, idx) {
    // 该城逐日真实日期 + 人流/天气映射
    var dayDates = []
    for (var dq = 0; dq < days; dq++) dayDates.push(fmtDateISO(addDays(dayCursor, dq)))
    dayCursor = addDays(dayCursor, days)
    var cityFlow = flowByCity[city.id] || []
    var flowMap = flowToMap(cityFlow)
    var stats = getCrowdStatsForCity(cityFlow)
    c += '<section class="tg-city">'
    c += '<div class="tg-cityhd"><span class="nm">' + (idx + 1) + '. ' + esc(city.name) + '</span><span class="pv">' + esc(city.province) + '</span>' +
      (city.tags || []).map(function (t) { return '<span class="tg-tag">' + esc(t) + '</span>' }).join('') + '</div>'
    c += '<div class="tg-qstat"><span>消费 <b>' + '💰'.repeat(city.costLevel) + '</b></span>' +
      '<span>美食 <b>⭐' + city.foodScore + '</b></span>' +
      '<span>住宿 <b>¥' + city.avgHotelPrice + '/晚</b></span>' +
      '<span>最佳月份 <b>' + (city.bestMonths || []).map(function (m) { return m + '月' }).join('、') + '</b></span></div>'
    // 人流概况 + 最佳出行日（来自人流引擎）
    if (cityFlow.length > 0) {
      var advice = stats.avgLevel <= 2 ? '✅ 人流较低，适合舒适游玩' : stats.avgLevel >= 4 ? '⚠️ 人流偏高，建议错峰' : 'ℹ️ 人流适中'
      c += '<div class="tg-flow"><span class="tg-flowadv">🚦 ' + advice + '</span>' +
        '<span class="tg-flowsum">未来两周 低 <b>' + stats.lowDays + '</b> · 中 <b>' + stats.midDays + '</b> · 高 <b>' + stats.highDays + '</b> 天</span></div>'
      if (stats.bestDates && stats.bestDates.length > 0) {
        c += '<div class="tg-best">📅 人流最低的好日子：' +
          stats.bestDates.slice(0, 4).map(function (d) { return '<b>' + shortDate(d) + '</b>' }).join('、') + '（建议优先安排）</div>'
      }
    }
    c += '<div class="tg-sub2">🗓️ ' + days + ' 天行程安排</div>'
    c += buildItinerary(city, days, style, idx === 0, dayDates, flowMap)
    c += '<div class="tg-sub2">🏛️ 必打卡景点</div><div class="tg-chips">' +
      (city.attractions || []).map(function (a) { return '<span class="tg-chip">' + esc(a) + '</span>' }).join('') + '</div>'
    c += '<div class="tg-sub2">🍜 不可错过的美味</div><div class="tg-chips">' +
      (city.cuisines || []).map(function (a) { return '<span class="tg-chip food">' + esc(a) + '</span>' }).join('') + '</div>'
    c += '<div class="tg-sub2">🏨 住宿推荐</div>' + stayTable(city)
    c += '<div class="tg-sub2">🍽️ 美食推荐</div>' + foodTable(city)
    c += '</section>'
  })

  // transport
  if (legs.length > 0) {
    c += '<section class="tg-card"><h2>🚄 城际交通</h2>'
    legs.forEach(function (l) {
      c += '<div class="tg-leg"><span class="tg-legroute">' + esc(l.from.name) + ' → ' + esc(l.to.name) + '</span>'
      c += '<span class="tg-opt">推荐 ' + l.icon + esc(l.mode) + ' · <b>' + fmtDur(l.durMin) + '</b> · ¥' + l.price + '</span>'
      if (l.cheapest) {
        c += '<span class="tg-opt">省钱 ' + esc(l.cheapest.icon || '') + esc(l.cheapest.type) + ' · ¥' + l.cheapest.totalPrice + '</span>'
        if (l.cheapest.savings > 0) c += '<span class="tg-save">省¥' + l.cheapest.savings + '</span>'
      }
      c += '<span class="tg-opt">约 ' + l.dist + ' km</span></div>'
    })
    c += '</section>'
  }

  // budget
  c += '<section class="tg-card"><h2>💰 预算明细 (人均)</h2><table class="tg-tbl tg-budget"><thead><tr><th>项目</th><th>明细</th><th>金额</th></tr></thead><tbody>'
  budget.rows.forEach(function (r) { c += '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td class="tg-price">¥' + r[2] + '</td></tr>' })
  c += '<tr><td class="tot">合计</td><td class="tot">' + budget.nights + ' 晚 · ' + totalDays + ' 天</td><td class="tot tg-price">¥' + budget.base + '</td></tr>'
  c += '</tbody></table><div class="tg-brange">💡 参考区间：<span class="big">¥' + budget.lo + ' ~ ¥' + budget.hi + '</span> / 人（经济 ~ 舒适）</div></section>'

  // tips
  c += '<section class="tg-card"><h2>🎒 出行贴士</h2>' + buildTips(ordered, month) + '</section>'

  // footer
  c += '<div class="tg-footer">本攻略由「旅伴」根据真实城市、景点、交通与天气数据自动生成 · ' + new Date().toLocaleDateString('zh-CN') + '</div>'

  var styleBlock = '<style>' + GUIDE_CSS + '</style>'
  var html = styleBlock + '<div class="tg-guide">' + c + '</div>'
  var fullHtml = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(cityNames) + ' 旅行攻略</title><style>body{margin:0;background:#eef2f7;padding:16px}' + GUIDE_CSS + '</style></head><body>' +
    '<div class="tg-guide">' + c + '</div></body></html>'

  // 纯文本版
  var text = cityNames + ' 之旅攻略\n\n'
  text += '行程：' + totalDays + ' 天 · ' + ordered.length + ' 城 · 人均预算 ¥' + budget.lo + '~' + budget.hi + '\n\n'
  ordered.forEach(function (city, i) {
    text += '【' + (i + 1) + '. ' + city.name + ' · ' + city.province + '】\n'
    text += '景点：' + (city.attractions || []).join('、') + '\n'
    text += '美食：' + (city.cuisines || []).join('、') + '\n'
    text += '住宿：¥' + city.avgHotelPrice + '/晚 · 最佳月份 ' + (city.bestMonths || []).join('、') + '\n\n'
  })
  legs.forEach(function (l) { text += l.from.name + ' → ' + l.to.name + '：' + l.mode + ' 约 ' + fmtDur(l.durMin) + ' ¥' + l.price + '（' + l.dist + 'km）\n' })
  return { html: html, fullHtml: fullHtml, text: text }
}

// ---------------- 人流统计 (Phase 2 使用) ----------------
export function getCrowdStatsForCity(flowData) {
  if (!flowData || flowData.length === 0) return { avgLevel: 0, lowDays: 0, midDays: 0, highDays: 0, bestDates: [] }
  var levels = flowData.map(function (f) { return f.crowdLevel })
  var avg = Math.round(levels.reduce(function (a, b) { return a + b }, 0) / levels.length)
  var low = flowData.filter(function (f) { return f.crowdLevel <= 2 }).length
  var mid = flowData.filter(function (f) { return f.crowdLevel === 3 }).length
  var high = flowData.filter(function (f) { return f.crowdLevel >= 4 }).length
  var bestDates = []
  for (var i = 1; i < flowData.length; i++) {
    if (flowData[i].crowdLevel <= 2 && flowData[i - 1].crowdLevel <= 2) {
      if (bestDates.indexOf(flowData[i - 1].date) < 0) bestDates.push(flowData[i - 1].date)
      if (bestDates.indexOf(flowData[i].date) < 0) bestDates.push(flowData[i].date)
    }
  }
  return { avgLevel: avg, lowDays: low, midDays: mid, highDays: high, bestDates: bestDates }
}
