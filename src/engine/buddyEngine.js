// Simulated travel buddy data - generated based on city preferences
// Each buddy has a name, avatar, destination, travel style, interests, etc.

const names = ['小旅', '阿游', '背包客小张', '吃货小李', '摄影师小王', '慢旅行者', '探险家', '文艺青年', '穷游达人', '蜜月新人', '独行侠', '老江湖', '学生党', '打工人', '自由职业者', '退休旅行者']

const travelStyles = ['穷游模式', '舒适享受', '冒险探索', '文化深度', '美食之旅', '摄影打卡', '慢节奏休养', '特种兵暴走']

const interests = ['美食探店', '拍照打卡', '历史古迹', '户外徒步', '博物馆', '看日出日落', '泡咖啡馆', '逛菜市场', '夜生活', '温泉度假', '自驾游', '民宿体验', '潜水冲浪', '滑雪', '逛书店']

const emojis = ['🐼', '🐱', '🦊', '🐨', '🐧', '🦁', '🐰', '🐶', '🦄', '🐸', '🐙', '🦋', '🐳', '🦉', '🐥', '🦜']

function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0 }
  return () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return (h / 0x7fffffff + 1) / 2 }
}

export function generateBuddies(cityId, count = 12) {
  const rng = simpleHash(cityId + '-buddies')
  const buddies = []

  for (let i = 0; i < count; i++) {
    const name = names[Math.floor(rng() * names.length)]
    const style = travelStyles[Math.floor(rng() * travelStyles.length)]
    const buddyInterests = []
    const numInterests = 3 + Math.floor(rng() * 3)
    const available = [...interests]
    for (let j = 0; j < numInterests; j++) {
      const idx = Math.floor(rng() * available.length)
      buddyInterests.push(available.splice(idx, 1)[0])
    }
    const emoji = emojis[Math.floor(rng() * emojis.length)]
    const age = 20 + Math.floor(rng() * 25)
    const gender = rng() > 0.5 ? '男' : '女'
    const matchRate = Math.round(60 + rng() * 35)

    // Generate travel dates within next 30 days
    const now = new Date()
    const departOffset = Math.floor(rng() * 25) + 1
    const stayLength = 2 + Math.floor(rng() * 6)
    const departDate = new Date(now)
    departDate.setDate(now.getDate() + departOffset)
    const returnDate = new Date(departDate)
    returnDate.setDate(departDate.getDate() + stayLength)

    const formatDate = (d) => `${d.getMonth()+1}/${d.getDate()}`

    buddies.push({
      id: `${cityId}-buddy-${i}`,
      name,
      emoji,
      age,
      gender,
      travelStyle: style,
      interests: buddyInterests,
      matchRate,
      departDate: formatDate(departDate),
      returnDate: formatDate(returnDate),
      budget: style === '穷游模式' ? '¥1000-2000' : style === '舒适享受' ? '¥5000+' : '¥2000-4000',
      groupSize: Math.floor(rng() * 3) + 1,
    })
  }

  return buddies.sort((a, b) => b.matchRate - a.matchRate)
}

export function getRandomTip() {
  const tips = [
    '💡 淡季出行不仅人少，住宿价格最多能便宜 40%',
    '💡 提前 2-4 周订票通常是最佳时机',
    '💡 周一博物馆大多闭馆，建议避开',
    '💡 青旅不仅能省钱，还是认识旅伴的好地方',
    '💡 "反向旅游"正在流行：去冷门小城，体验更地道',
    '💡 带一双舒适鞋比带 3 套衣服更重要',
    '💡 本地菜市场是最能感受烟火气的地方',
    '💡 随身带个保温杯，省饮料钱还能喝热水',
    '💡 下载离线地图和翻译 App，不怕没信号',
  ]
  return tips[Math.floor(Math.random() * tips.length)]
}

export function getRandomFortune() {
  const fortunes = [
    { city: '大理', emoji: '🌅', reason: '洱海正是最美时节，适合放空自己' },
    { city: '成都', emoji: '🐼', reason: '火锅和熊猫都在等你，治愈力满分' },
    { city: '厦门', emoji: '🌊', reason: '海风和鼓浪屿的钢琴声，值得一场说走就走' },
    { city: '西安', emoji: '🏛️', reason: '碳水之都的魅力，肉夹馍都知道' },
    { city: '桂林', emoji: '⛰️', reason: '山水间发呆，胜过一打心灵鸡汤' },
    { city: '丽江', emoji: '🛖', reason: '古城的阳光，能晒化所有烦恼' },
    { city: '黄山', emoji: '☁️', reason: '云海日出，看一眼能吹一年' },
    { city: '重庆', emoji: '🍜', reason: '一碗小面就能让你爱上这座城' },
    { city: '青岛', emoji: '🍺', reason: '啤酒配海鲜，夏天的正确打开方式' },
    { city: '拉萨', emoji: '🏔️', reason: '离天空最近的地方，适合重新认识自己' },
  ]
  return fortunes[Math.floor(Math.random() * fortunes.length)]
}

// Match buddies to user preferences
export function matchBuddies(buddies, userFilters = {}) {
  let result = [...buddies]

  if (userFilters.style && userFilters.style !== 'all') {
    result = result.filter(b => b.travelStyle === userFilters.style)
  }
  if (userFilters.budget && userFilters.budget !== 'all') {
    const budgetRanges = {
      'low': ['¥1000-2000'],
      'mid': ['¥2000-4000'],
      'high': ['¥5000+'],
    }
    if (budgetRanges[userFilters.budget]) {
      result = result.filter(b => budgetRanges[userFilters.budget].includes(b.budget))
    }
  }

  return result.sort((a, b) => b.matchRate - a.matchRate)
}
