import { createElement as h } from 'react'

/* ===== 原创SVG图标集 ===== */
/* 所有图标均为原创设计，24x24视口，stroke: currentColor */

function Svg({ d, size, className, color, fill, viewBox }) {
  return h('svg', {
    width: size || 20,
    height: size || 20,
    viewBox: viewBox || '0 0 24 24',
    fill: fill || 'none',
    stroke: color || 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: className
  }, d ? h('path', { d: d }) : null)
}

function multi(parts) {
  return function(props) {
    return h('svg', {
      width: props.size || 20,
      height: props.size || 20,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: props.color || 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: props.className
    }, ...parts.map(function(p) {
      if (p.tag === 'circle') return h('circle', p.props);
      if (p.tag === 'rect') return h('rect', p.props);
      if (p.tag === 'line') return h('line', p.props);
      if (p.tag === 'path') return h('path', p.props);
      if (p.tag === 'polyline') return h('polyline', p.props);
      if (p.tag === 'polygon') return h('polygon', p.props);
      return h('path', { d: p });
    }))
  }
}

var c = function(cx, cy, r) { return { tag: 'circle', props: { cx: cx, cy: cy, r: r } }; };
var l = function(x1, y1, x2, y2) { return { tag: 'line', props: { x1: x1, y1: y1, x2: x2, y2: y2 } }; };
var p = function(d) { return { tag: 'path', props: { d: d } }; };
var rect = function(x, y, w, h, rx) { return { tag: 'rect', props: { x: x, y: y, width: w, height: h, rx: rx || 0 } }; };
var poly = function(points) { return { tag: 'polygon', props: { points: points } }; };
var pl = function(points) { return { tag: 'polyline', props: { points: points } }; };

var ICONS = {}

// 搜索 - 放大镜
ICONS.search = multi([c(10, 10, 7), l(15, 15, 22, 22)])

// 地图 - 地图轮廓+图钉
ICONS.map = multi([
  p('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'),
  p('M9 22V12h6v10'),
  c(12, 10, 2)
])

// 食宿 - 碗+筷子
ICONS.food = multi([
  p('M6 14a6 6 0 0 0 12 0'),
  p('M6 14c0-5 2.5-10 6-10s6 5 6 10'),
  l(9, 11, 9, 4),
  l(15, 11, 15, 4)
])

// 搭子 - 双人
ICONS.buddy = multi([
  c(9, 8, 3.5),
  c(17, 9, 3),
  p('M4 20c0-4 2.5-6 5-6'),
  p('M13 20c0-5 2-7 4-7'),
  l(9, 18, 9, 20),
  l(17, 19, 17, 20)
])

// 攻略 - 打开的书
ICONS.guide = multi([
  p('M4 19.5A2.5 2.5 0 0 1 6.5 17H20'),
  p('M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'),
  l(10, 6, 16, 6),
  l(10, 10, 16, 10),
  l(10, 14, 14, 14)
])

// 太阳 - 圆+光线
ICONS.sun = multi([
  c(12, 12, 5),
  l(12, 2, 12, 4),
  l(12, 20, 12, 22),
  l(2, 12, 4, 12),
  l(20, 12, 22, 12),
  l(4.9, 4.9, 6.3, 6.3),
  l(17.7, 17.7, 19.1, 19.1),
  l(17.7, 4.9, 19.1, 6.3),
  l(4.9, 17.7, 6.3, 19.1)
])

// 月亮 - 新月
ICONS.moon = multi([p('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z')])

// 星星
ICONS.star = multi([p('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z')])

// 心形
ICONS.heart = multi([p('M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z')])

// 下载 - 箭头向下+横线
ICONS.download = multi([
  p('M12 15V3'),
  p('M7 10l5 5 5-5'),
  p('M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2')
])

// 编辑 - 铅笔
ICONS.edit = multi([
  p('M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'),
  l(15, 5, 19, 9)
])

// 交换 - 左右箭头
ICONS.swap = multi([
  p('M8 3L4 7l4 4'),
  p('M4 7h16'),
  p('M16 21l4-4-4-4'),
  p('M20 17H4')
])

// 左箭头
ICONS.arrowLeft = multi([p('M19 12H5'), p('M12 19l-7-7 7-7')])

// 右箭头
ICONS.arrowRight = multi([p('M5 12h14'), p('M12 5l7 7-7 7')])

// 刷新 - 圆形箭头
ICONS.refresh = multi([
  p('M23 4v6h-6'),
  p('M1 20v-6h6'),
  p('M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15')
])

// 指南针
ICONS.compass = multi([
  c(12, 12, 10),
  p('M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z'),
  c(12, 12, 1.5)
])

// 导航
ICONS.navigation = multi([p('M3 11l19-9-9 19-2-8-8-2z')])

// 飞机
ICONS.plane = multi([
  p('M22 2L11 13'),
  p('M22 2l-7 20-4-9-9-4 20-7z')
])

// 火车
ICONS.train = multi([
  rect(4, 8, 16, 10, 2),
  p('M4 14h16'),
  c(9, 16, 1.5),
  c(15, 16, 1.5),
  l(4, 5, 20, 5),
  p('M8 2l2 6h4l2-6')
])

// 公交
ICONS.bus = multi([
  rect(4, 6, 16, 14, 3),
  p('M4 14h16'),
  c(8, 16, 1.5),
  c(16, 16, 1.5),
  p('M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2')
])

// 床
ICONS.bed = multi([
  p('M3 7v11'),
  p('M3 18h18'),
  p('M21 7v11'),
  p('M3 7h18'),
  p('M3 11h18'),
  p('M7 7V4'),
  p('M17 7V4'),
  c(12, 13, 1.5)
])

// 厨师帽
ICONS.chef = multi([
  p('M6 13.87A4 4 0 0 1 7.41 6a5.5 5.5 0 0 1 9.18 0A4 4 0 0 1 18 13.87'),
  p('M6 17h12'),
  p('M6 21h12'),
  p('M9 13.87V17'),
  p('M15 13.87V17')
])

// 咖啡
ICONS.coffee = multi([
  p('M18 8h1a4 4 0 0 1 0 8h-1'),
  p('M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z'),
  l(6, 1, 6, 1),
  l(6, 4, 6, 4)
])

// 购物袋
ICONS.shop = multi([
  p('M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z'),
  p('M3 6h18'),
  p('M16 10a4 4 0 0 1-8 0')
])

// 相机
ICONS.camera = multi([
  p('M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'),
  c(12, 13, 4),
  c(12, 13, 2)
])

// 山
ICONS.mountain = multi([
  p('M2 22l8-12 4 5 4-3 4 10H2z'),
  p('M2 22h20')
])

// 海浪
ICONS.waves = multi([
  p('M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0'),
  p('M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0'),
  p('M2 6c2-2 4-2 6 0s4 2 6 0 4-2 6 0')
])

// 建筑
ICONS.building = multi([
  rect(4, 6, 16, 16, 2),
  p('M4 12h16'),
  p('M8 6V2h8v4'),
  p('M8 16h2'),
  p('M14 16h2'),
  p('M8 20h2'),
  p('M14 20h2')
])

// 地图图钉
ICONS.mapPin = multi([
  p('M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'),
  c(12, 10, 3)
])

// 关闭 X
ICONS.x = multi([l(5, 5, 19, 19), l(19, 5, 5, 19)])

// 加号
ICONS.plus = multi([l(12, 5, 12, 19), l(5, 12, 19, 12)])

// 左V形
ICONS.chevronLeft = multi([p('M15 18l-6-6 6-6')])

// 右V形
ICONS.chevronRight = multi([p('M9 18l6-6-6-6')])

// 筛选
ICONS.filter = multi([
  p('M22 3H2l8 9.46V19l4 2v-8.54L22 3z')
])

// 滑块调节
ICONS.sliders = multi([
  l(4, 21, 4, 14),
  l(4, 10, 4, 3),
  l(12, 21, 12, 12),
  l(12, 8, 12, 3),
  l(20, 21, 20, 16),
  l(20, 12, 20, 3),
  c(4, 12, 2),
  c(12, 10, 2),
  c(20, 14, 2)
])

// 日历
ICONS.calendar = multi([
  rect(3, 4, 18, 18, 2),
  l(3, 10, 21, 10),
  l(8, 2, 8, 6),
  l(16, 2, 16, 6),
  l(8, 14, 10, 14),
  l(14, 14, 16, 14),
  l(8, 18, 10, 18),
  l(14, 18, 16, 18)
])

// 闪光
ICONS.sparkles = multi([
  p('M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z'),
  p('M18 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z'),
  p('M6 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z')
])

// 用户
ICONS.user = multi([
  c(12, 8, 5),
  p('M4 21c0-5 3.5-8 8-8s8 3 8 8')
])

// 设置
ICONS.settings = multi([
  c(12, 12, 3),
  p('M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z')
])

// 分享
ICONS.share = multi([
  c(6, 18, 3),
  c(18, 6, 3),
  c(18, 18, 3),
  l(8.5, 15.5, 15.5, 9.5),
  l(8.5, 8.5, 15.5, 14.5)
])

// 书签
ICONS.bookmark = multi([
  p('M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z')
])

// 地球
ICONS.globe = multi([
  c(12, 12, 10),
  p('M2 12h20'),
  p('M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'),
  p('M4.93 4.93A10 10 0 0 0 4.93 19.07M19.07 4.93a10 10 0 0 1 0 14.14')
])

export default function Icon({ name, size, strokeWidth, className, color }) {
  var icon = ICONS[name]
  if (!icon) return null
  return icon({ size: size || 20, className: className, color: color, strokeWidth: strokeWidth || 2 })
}
