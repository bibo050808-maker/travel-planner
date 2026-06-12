import cities from './cities';
import { generateFoodData, generateStayData } from './foodStayEngine';

export function generateGuide(tripCities, tripRoutes, style) {
  style = style || 'classic';
  var styles = {
    classic: { days: [['抵达后入住酒店休息整顿', '游览市区中心感受当地氛围', '品尝当地特色美食'], ['上午深度游', '下午继续探索', '傍晚休闲漫步'], ['品尝当地早餐逛市场', '准备离开']] },
    food: { days: [['抵达后寻找地道小吃', '打卡当地网红美食店', '夜市美食体验'], ['早餐后逛当地菜市场', '美食街深度扫街', '烹饪体验课'], ['早上再去吃一次最爱的', '买些特产准备离开']] },
    culture: { days: [['抵达后参观当地博物馆', '探访历史建筑群', '文化街区夜游'], ['上午参观主要文化遗址', '下午走访非遗工坊', '看当地特色演出'], ['早上去当地书店/美术馆', '整理旅行笔记后离开']] },
    relax: { days: [['抵达后悠闲漫步熟悉环境', '找家咖啡馆发呆', '做个SPA放松'], ['自然醒后吃个brunch', '去公园/湖边散步', '享受慢生活'], ['睡到自然醒', '周边随便逛逛后离开']] }
  };
  var tmpl = styles[style] || styles.classic;
  // Reorder cities by route chain
  var orderedCities = [];
  var added = {};
  if (tripRoutes && tripRoutes.length > 0) {
    tripRoutes.forEach(function(r) {
      var fc = tripCities.find(function(c) { return c.id === r.fromId; });
      var tc = tripCities.find(function(c) { return c.id === r.toId; });
      if (fc && !added[fc.id]) { orderedCities.push(fc); added[fc.id] = true; }
      if (tc && !added[tc.id]) { orderedCities.push(tc); added[tc.id] = true; }
    });
  }
  // Add any remaining cities
  tripCities.forEach(function(c) {
    if (!added[c.id]) { orderedCities.push(c); added[c.id] = true; }
  });
  if (orderedCities.length > 0) { var citiesForGuide = orderedCities; } else { var citiesForGuide = tripCities; }
  if (!citiesForGuide || citiesForGuide.length === 0) return { html: '', text: '' };

  var html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>旅行攻略</title>' +
    '<style>body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#333;line-height:1.8}' +
    'h1{text-align:center;color:#1976d2;font-size:24px;padding-bottom:10px;border-bottom:2px solid #4fc3f7}' +
    'h2{color:#1976d2;font-size:18px;margin-top:24px;border-left:4px solid #4fc3f7;padding-left:10px}' +
    'h3{font-size:15px;color:#555}.day{background:#f5f7fa;padding:12px 16px;border-radius:8px;margin:8px 0}' +
    '.tip{background:#e3f2fd;padding:10px 14px;border-radius:8px;margin:8px 0;font-size:13px}' +
    '.tag{display:inline-block;background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:4px;font-size:11px;margin:2px}' +
    '.food{display:inline-block;background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:4px;font-size:11px;margin:2px}' +
    '.price{color:#f57f17;font-weight:600}ul{padding-left:20px}li{margin:4px 0}' +
    'table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}' +
    'th{background:#e3f2fd}.footer{text-align:center;color:#999;margin-top:30px;font-size:11px}</style></head><body>';

  var cityNames = citiesForGuide.map(function(c) { return c.name; }).join(' - ');
  html += '<h1>\uD83C\uDF0D ' + cityNames + '\u4E4B\u65C5</h1>';
  html += '<p style="text-align:center;color:#888">\u751F\u6210\u65E5\u671F: ' + new Date().toLocaleDateString('zh-CN') + '</p>';

  html += '<h2>\uD83D\uDCCC \u884C\u7A0B\u6982\u89C8</h2>';
  html += '<p>\u672C\u6B21\u65C5\u884C\u5171' + citiesForGuide.length + '\u4E2A\u76EE\u7684\u5730\uFF0C\u5EFA\u8BAE\u65C5\u884C\u5929\u6570: ' + (citiesForGuide.length * 3) + ' \u5929</p>';
  var budget = citiesForGuide.reduce(function(s, c) { return s + (c.avgHotelPrice || 300); }, 0) * citiesForGuide.length + citiesForGuide.length * 200;
  html += '<p>\u9884\u7B97\u8303\u56F4: \u00A5' + budget + ' \u5DE6\u53F3</p>';

  if (tripRoutes && tripRoutes.length > 0) {
    html += '<h2>\uD83D\uDE89 \u4EA4\u901A\u8DEF\u7EBF</h2>';
    tripRoutes.forEach(function(r, i) {
      html += '<div class="day"><strong>\u7B2C' + (i+1) + '\u6BB5: ' + (r.fromName || '?') + ' \u2192 ' + (r.toName || '?') + '</strong>';
      html += '<br/>\u6A21\u5F0F: ' + (r.mode === 'comfort' ? '\uD83D\uDECB\uFE0F \u8212\u9002' : '\uD83D\uDCB0 \u7701\u94B1') + '</div>';
    });
  }

  citiesForGuide.forEach(function(city, idx) {
    html += '<h2>\uD83C\uDF06 ' + city.name + ' (' + city.province + ')</h2>';
    html += '<p>\u6D88\u8D39\u6C34\u5E73: ' + '\uD83D\uDCB0'.repeat(city.costLevel) + ' | \u7F8E\u98DF\u8BC4\u5206: \u2B50 ' + city.foodScore + '/10 | \u4F4F\u5BBF: \u00A5' + city.avgHotelPrice + '/\u665A</p>';
    if (city.bestMonths) {
      var mstr = city.bestMonths.map(function(m) { return m + '\u6708'; }).join('\u3001');
      html += '<p>\uD83D\uDCC5 \u6700\u4F73\u65C5\u884C\u6708\u4EFD: ' + mstr + '</p>';
    }
    html += '<div class="day"><strong>\uD83D\uDCCD Day ' + (idx*3+1) + ' \u62B5\u8FBE ' + city.name + '</strong><br/>';
    html += '\u2022 \u4E0A\u5348\uFF1A\u62B5\u8FBE\u540E\u5165\u4F4F\u9152\u5E97\uFF0C\u4F11\u606F\u6574\u987F<br/>';
    html += '\u2022 \u4E0B\u5348\uFF1A\u6E38\u89C8\u5E02\u533A\uFF0C\u611F\u53D7\u5F53\u5730\u6C1B\u56F4</div>';
    var attrs = (city.attractions || []).slice(0, 4);
    html += '<div class="day"><strong>\uD83D\uDCCD Day ' + (idx*3+2) + ' \u6DF1\u5EA6\u6E38 ' + city.name + '</strong><br/>';
    var labels = ['\u4E0A\u5348', '\u4E0B\u5348', '\u665A\u4E0A'];
    if (tmpl.days[1]) tmpl.days[1].forEach(function(t, i) { html += '\u2022 ' + (labels[i]||'') + '\uFF1A' + t + '<br/>'; });
    html += '</div>';
    html += '<div class="day"><strong>\uD83D\uDCCD Day ' + (idx*3+3) + ' \u7F8E\u98DF\u4E0E\u79BB\u5F00</strong><br/>';
    html += '\u2022 \u4E0A\u5348\uFF1A\u54C1\u5C1D\u5F53\u5730\u65E9\u9910\uFF0C\u901B\u5F53\u5730\u5E02\u573A<br/>';
    html += '\u2022 \u4E0B\u5348\uFF1A\u51C6\u5907\u79BB\u5F00\uFF0C\u524D\u5F80\u4E0B\u4E00\u7AD9</div>';
    html += '<h3>\uD83C\uDFDB\uFE0F \u70ED\u95E8\u666F\u70B9</h3><p>';
    (city.attractions || []).forEach(function(a) { html += '<span class="tag">' + a + '</span>'; });
    html += '</p>';
    html += '<h3>\uD83C\uDF5C \u7279\u8272\u7F8E\u98DF</h3><p>';
    (city.cuisines || []).forEach(function(c) { html += '<span class="food">' + c + '</span>'; });
    html += '</p>';
    var stays = generateStayData(city);
    if (stays.length > 0) {
      html += '<h3>\uD83C\uDFE8 \u4F4F\u5BBF\u63A8\u8350</h3><table><tr><th>\u540D\u79F0</th><th>\u661F\u7EA7</th><th>\u8BC4\u5206</th><th>\u4EF7\u683C</th></tr>';
      stays.slice(0, 3).forEach(function(s) {
        html += '<tr><td>' + s.name + '</td><td>' + (s.stars||'') + '</td><td>' + (s.rating||'') + '</td><td class="price">\u00A5' + s.avgPrice + '</td></tr>';
      });
      html += '</table>';
    }
    var foods = generateFoodData(city);
    if (foods.length > 0) {
      html += '<h3>\uD83C\uDF7D\uFE0F \u7F8E\u98DF\u63A8\u8350</h3><table><tr><th>\u540D\u79F0</th><th>\u7C7B\u578B</th><th>\u8BC4\u5206</th><th>\u4EBA\u5747</th></tr>';
      foods.slice(0, 3).forEach(function(f) {
        html += '<tr><td>' + f.name + '</td><td>' + (f.category||'') + '</td><td>' + (f.rating||'') + '</td><td class="price">\u00A5' + f.avgPrice + '</td></tr>';
      });
      html += '</table>';
    }
  });

  html += '<h2>\uD83D\uDCA1 \u51FA\u884C\u5C0F\u8D34\u58EB</h2>';
  html += '<div class="tip">\uD83D\uDCC5 \u63D0\u524D\u9884\u8BA2\u7F51\u7ED3\u4E0E\u9152\u5E97\uFF0C\u907F\u514D\u65FA\u5B63\u6DA8\u4EF7</div>';
  html += '<div class="tip">\uD83C\uDFA8 \u968F\u8EAB\u643A\u5E26\u8EAB\u4EFD\u8BC1\u3001\u5145\u7535\u5668\u3001\u5E38\u5907\u836F\u54C1</div>';
  html += '<div class="tip">\uD83D\uDCF1 \u4E0B\u8F7D\u79BB\u7EBF\u5730\u56FE\u548C\u7FFB\u8BD1 App\uFF0C\u4E0D\u6015\u6CA1\u4FE1\u53F7</div>';
  html += '<div class="tip">\uD83D\uDCB0 \u5E26\u5C11\u91CF\u73B0\u91D1\uFF0C\u624B\u673A\u652F\u4ED8\u5DF2\u8986\u76D6\u5927\u90E8\u5206\u573A\u666F</div>';
  html += '<div class="footer">\u672C\u653B\u7565\u7531\u65C5\u4F34 App \u81EA\u52A8\u751F\u6210 | ' + new Date().toLocaleDateString('zh-CN') + '</div>';
  html += '</body></html>';

  var text = cityNames + '\u4E4B\u65C5\u653B\u7565\n\n';
  text += '\u884C\u7A0B\u6982\u89C8: ' + citiesForGuide.length + '\u4E2A\u57CE\u5E02\uFF0C' + (citiesForGuide.length * 3) + '\u5929\n\n';
  citiesForGuide.forEach(function(c, i) {
    text += '\u3010' + c.name + '\u3011\n';
    text += '\u666F\u70B9: ' + (c.attractions || []).join('\u3001') + '\n';
    text += '\u7F8E\u98DF: ' + (c.cuisines || []).join('\u3001') + '\n';
    text += '\u4F4F\u5BBF: \u00A5' + c.avgHotelPrice + '/\u665A\u3001\u6D88\u8D39\u7B49\u7EA7: ' + c.costLevel + '/5\n\n';
  });
  text += '\u51FA\u884C\u63D0\u793A: \u63D0\u524D\u9884\u8BA2\u3001\u5E26\u8EAB\u4EFD\u8BC1\u3001\u4E0B\u8F7D\u79BB\u7EBF\u5730\u56FE\n';

  return { html: html, text: text };
}