// Simulated route data between Chinese cities
// Each city pair has multiple transport options

const TRANSPORT_TYPES = {
  highSpeedRail: { label: '高铁', icon: '🚄', baseSpeed: 300, costPerKm: 0.45, comfort: 8 },
  normalTrain: { label: '普快', icon: '🚂', baseSpeed: 120, costPerKm: 0.12, comfort: 5 },
  flight: { label: '飞机', icon: '✈️', baseSpeed: 800, costPerKm: 0.90, comfort: 7 },
  bus: { label: '大巴', icon: '🚌', baseSpeed: 90, costPerKm: 0.15, comfort: 4 },
}

// Approximate distances between major cities (km)
function getDistance(fromId, toId) {
  const coords = {
    beijing: [39.9, 116.4], shanghai: [31.2, 121.5], hangzhou: [30.3, 120.2],
    chengdu: [30.6, 104.1], xiamen: [24.5, 118.1], sanya: [18.3, 109.5],
    guilin: [25.3, 110.3], lijiang: [26.9, 100.2], dali: [25.6, 100.3],
    kunming: [25.0, 102.7], xian: [34.3, 108.9], chongqing: [29.6, 106.5],
    wuhan: [30.6, 114.3], changsha: [28.2, 112.9], nanjing: [32.1, 118.8],
    suzhou: [31.3, 120.6], qingdao: [36.1, 120.4], dalian: [38.9, 121.6],
    haerbin: [45.8, 126.5], guangzhou: [23.1, 113.3], shenzhen: [22.5, 114.1],
    luoyang: [34.6, 112.5], huangshan: [29.7, 118.3], zhangjiajie: [29.1, 110.5],
    tianjin: [39.1, 117.2], wuxi: [31.6, 120.3], shenyang: [41.8, 123.4],
    zhenzhou: [34.8, 113.7], jinan: [36.7, 117.0], zhuhai: [22.3, 113.6],
    haikou: [20.0, 110.3], qinhuangdao: [39.9, 119.6], lasa: [29.6, 91.1],
  }

  const a = coords[fromId], b = coords[toId]
  if (!a || !b) return 500

  // Approximate: 1 degree = 111km, simplified distance
  const dLat = (b[0] - a[0]) * 111
  const dLng = (b[1] - a[1]) * 111 * Math.cos((a[0] + b[0]) / 2 * Math.PI / 180)
  return Math.round(Math.sqrt(dLat*dLat + dLng*dLng))
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`
}

function generateRoutes(fromId, toId) {
  if (fromId === toId) return { comfort: [], budget: [], tip: '出发城市与到达城市相同，无需长途交通' }

  const dist = getDistance(fromId, toId)
  const base = dist || 500

  const comfort = [
    {
      id: 'hsr-1',
      type: '高铁',
      icon: '🚄',
      seats: ['一等座', '商务座', '二等座'],
      bestSeatClass: '一等座',
      segments: [{
        type: 'highSpeedRail',
        from: fromId,
        to: toId,
        duration: Math.round(base / TRANSPORT_TYPES.highSpeedRail.baseSpeed * 60 + 40),
        price: Math.round(base * TRANSPORT_TYPES.highSpeedRail.costPerKm * 1.8),
        seatClass: '一等座',
      }],
      totalDuration: Math.round(base / TRANSPORT_TYPES.highSpeedRail.baseSpeed * 60 + 40),
      totalPrice: Math.round(base * TRANSPORT_TYPES.highSpeedRail.costPerKm * 1.8),
      transfers: 0,
      comfortScore: 9,
    },
    {
      id: 'fly-1',
      type: '飞机',
      icon: '✈️',
      seats: ['经济舱', '商务舱'],
      bestSeatClass: '经济舱',
      segments: [{
        type: 'flight',
        from: fromId,
        to: toId,
        duration: Math.round(base / TRANSPORT_TYPES.flight.baseSpeed * 60 + 120),
        price: Math.round(base * TRANSPORT_TYPES.flight.costPerKm),
        seatClass: '经济舱',
      }],
      totalDuration: Math.round(base / TRANSPORT_TYPES.flight.baseSpeed * 60 + 120),
      totalPrice: Math.round(base * TRANSPORT_TYPES.flight.costPerKm),
      transfers: 0,
      comfortScore: 7,
    },
  ]

  const budget = [
    {
      id: 'train-econ',
      type: '普快列车',
      icon: '🚂',
      seats: ['硬座', '硬卧', '软卧'],
      bestSeatClass: '硬座',
      segments: [{
        type: 'normalTrain',
        from: fromId,
        to: toId,
        duration: Math.round(base / TRANSPORT_TYPES.normalTrain.baseSpeed * 60 + 60),
        price: Math.round(base * TRANSPORT_TYPES.normalTrain.costPerKm),
        seatClass: '硬座',
      }],
      totalDuration: Math.round(base / TRANSPORT_TYPES.normalTrain.baseSpeed * 60 + 60),
      totalPrice: Math.round(base * TRANSPORT_TYPES.normalTrain.costPerKm),
      transfers: 0,
      comfortScore: 5,
      savings: 0,
    },
    {
      id: 'hsr-econ',
      type: '高铁',
      icon: '🚄',
      seats: ['二等座', '一等座'],
      bestSeatClass: '二等座',
      segments: [{
        type: 'highSpeedRail',
        from: fromId,
        to: toId,
        duration: Math.round(base / TRANSPORT_TYPES.highSpeedRail.baseSpeed * 60 + 40),
        price: Math.round(base * TRANSPORT_TYPES.highSpeedRail.costPerKm),
        seatClass: '二等座',
      }],
      totalDuration: Math.round(base / TRANSPORT_TYPES.highSpeedRail.baseSpeed * 60 + 40),
      totalPrice: Math.round(base * TRANSPORT_TYPES.highSpeedRail.costPerKm),
      transfers: 0,
      comfortScore: 6,
      savings: Math.round(base * TRANSPORT_TYPES.highSpeedRail.costPerKm * 0.8),
    },
    {
      id: 'bus-cheap',
      type: '长途大巴',
      icon: '🚌',
      seats: ['普通座'],
      bestSeatClass: '普通座',
      segments: [{
        type: 'bus',
        from: fromId,
        to: toId,
        duration: Math.round(base / TRANSPORT_TYPES.bus.baseSpeed * 60 + 90),
        price: Math.round(base * TRANSPORT_TYPES.bus.costPerKm),
        seatClass: '普通座',
      }],
      totalDuration: Math.round(base / TRANSPORT_TYPES.bus.baseSpeed * 60 + 90),
      totalPrice: Math.round(base * TRANSPORT_TYPES.bus.costPerKm),
      transfers: 0,
      comfortScore: 4,
      savings: Math.round(base * TRANSPORT_TYPES.highSpeedRail.costPerKm * 1.8 - base * TRANSPORT_TYPES.bus.costPerKm),
    },
  ]

  // Add savings to budget routes
  const comfortMax = Math.max(...comfort.map(r => r.totalPrice))
  for (const b of budget) {
    b.savings = Math.max(0, comfortMax - b.totalPrice)
  }

  return { comfort, budget, dist }
}

export function searchRoutes(fromCityId, toCityId, mode) {
  return generateRoutes(fromCityId, toCityId)
}
