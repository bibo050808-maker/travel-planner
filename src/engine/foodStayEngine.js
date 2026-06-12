// Simulated food and accommodation data per city
// Each city has ~5 restaurants and ~5 hotels

const restaurantNames = {
  '粤菜': ['陶陶居', '广州酒家', '炳胜', '点都德', '利苑'],
  '川菜': ['蜀九香', '大龙燚', '小龙坎', '老房子', '皇城老妈'],
  '浙菜': ['知味观', '楼外楼', '外婆家', '新白鹿', '绿茶餐厅'],
  '湘菜': ['炊烟时代', '费大厨', '一盏灯', '火宫殿', '玉楼东'],
  '鲁菜': ['一品豆腐', '聚丰德', '燕喜堂', '廉颇台', '汇泉楼'],
  '海鲜': ['海港城', '渔人码头', '海味馆', '东海渔村', '珊瑚海'],
  '火锅': ['海底捞', '小肥羊', '呷哺呷哺', '德庄', '巴奴'],
  '小吃': ['小吃街1号', '老味道', '街头巷尾', '美食坊', '口口香'],
  '面食': ['老北京炸酱面馆', '兰州拉面', '山西刀削面', '陕西面馆', '味千拉面'],
}

const hotelNames = {
  '豪华': ['国际大酒店', '洲际酒店', '希尔顿', '万豪酒店', '凯宾斯基'],
  '中端': ['全季酒店', '亚朵酒店', '汉庭优佳', '如家精选', '维也纳'],
  '经济': ['如家快捷', '7天连锁', '汉庭酒店', '格林豪泰', '尚客优'],
  '青旅': ['背包十年', '瓦舍旅行', '登巴客栈', '老班长青旅', '青年驿站'],
}

// Seed based on cityId for consistent random
function seedRandom(cityId) {
  let hash = 0
  for (let i = 0; i < cityId.length; i++) {
    hash = ((hash << 5) - hash) + cityId.charCodeAt(i)
    hash |= 0
  }
  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff
    return hash / 0x7fffffff
  }
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)]
}

function getCuisineCategory(cuisines) {
  const map = {
    '海鲜': '海鲜', '火锅': '火锅', '面食': '面食', '小吃': '小吃',
    '粤菜': '粤菜', '川菜': '川菜', '浙菜': '浙菜', '湘菜': '湘菜',
    '鲁菜': '鲁菜',
  }
  for (const c of cuisines) {
    if (map[c]) return map[c]
    if (c.includes('虾') || c.includes('鱼') || c.includes('蟹') || c.includes('蛤')) return '海鲜'
  }
  return '小吃'
}

export function generateFoodData(city) {
  const rng = seedRandom(city.id + 'food')
  const cuisineCat = getCuisineCategory(city.cuisines)
  const names = restaurantNames[cuisineCat] || restaurantNames['小吃']
  const types = ['菜系', '小吃', '火锅', '海鲜', '面食']

  return names.map((name, i) => {
    const rating = Math.round((city.foodScore - 1 + rng() * 2) * 10) / 10
    const avgPrice = Math.round(((city.costLevel - 1) * 40 + 30 + rng() * 60))
    const type = types[Math.floor(rng() * types.length)]

    return {
      id: `${city.id}-food-${i}`,
      cityId: city.id,
      name: name,
      category: i === 0 ? `${cuisineCat} · 老字号` : `${cuisineCat} · ${type}`,
      type: 'food',
      rating: Math.min(5, Math.max(3, rating)),
      avgPrice,
      distance: parseFloat((rng() * 5).toFixed(1)),
      tags: i === 0 ? ['评分Top1', '人气火爆', '本地推荐'] : (i === 1 ? ['高性价比', '口碑好'] : ['本地人爱吃', '环境好']),
      reviewCount: Math.floor(rng() * 5000 + 500),
      recommendRate: Math.round(rng() * 15 + 82),
      crowdStatus: rng() > 0.7 ? '火爆' : rng() > 0.3 ? '正常' : '较空',
    }
  })
}

export function generateStayData(city) {
  const rng = seedRandom(city.id + 'stay')
  const hotels = [
    { name: pick(hotelNames['豪华'], rng), cat: '豪华', stars: '⭐⭐⭐⭐⭐', priceBase: city.avgHotelPrice * 2.5 },
    { name: pick(hotelNames['中端'], rng), cat: '中端', stars: '⭐⭐⭐', priceBase: city.avgHotelPrice * 1.1 },
    { name: pick(hotelNames['中端'], rng), cat: '中端', stars: '⭐⭐⭐', priceBase: city.avgHotelPrice * 0.9 },
    { name: pick(hotelNames['经济'], rng), cat: '经济', stars: '⭐⭐', priceBase: city.avgHotelPrice * 0.6 },
    { name: pick(hotelNames['青旅'], rng), cat: '青旅', stars: '⭐', priceBase: Math.min(city.avgHotelPrice * 0.25, 120) },
  ]

  return hotels.map((h, i) => {
    const rating = Math.round((4 + rng() * 1) * 10) / 10
    return {
      id: `${city.id}-stay-${i}`,
      cityId: city.id,
      name: h.name,
      category: h.cat,
      type: 'stay',
      stars: h.stars,
      rating: Math.min(5, rating),
      avgPrice: Math.round(h.priceBase),
      distance: parseFloat((rng() * 8 + 0.5).toFixed(1)),
      tags: i === 0 ? ['评分最高', '景观佳'] : i === 1 ? ['性价比之王', '近地铁'] : i === 2 ? ['交通便利', '干净卫生'] : ['最省钱', '基础舒适'],
      reviewCount: Math.floor(rng() * 3000 + 200),
      recommendRate: Math.round(rng() * 12 + 80),
    }
  })
}
