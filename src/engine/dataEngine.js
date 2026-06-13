import { saveCities, getAllCities, getFlowForCity, saveFlowEntries } from '../utils/storage'
import { fetchCities } from '../services/api'
import cities from './cities'

const CHINESE_HOLIDAYS_2026 = {
  '2026-01-01': '元旦', '2026-01-02': '元旦', '2026-02-18': '春节',
  '2026-02-19': '春节', '2026-02-20': '春节', '2026-02-21': '春节',
  '2026-02-22': '春节', '2026-02-23': '春节', '2026-02-24': '春节',
  '2026-04-05': '清明', '2026-04-06': '清明',
  '2026-05-01': '劳动节', '2026-05-02': '劳动节', '2026-05-03': '劳动节',
  '2026-05-04': '劳动节', '2026-05-05': '劳动节',
  '2026-06-19': '端午', '2026-06-20': '端午', '2026-06-21': '端午',
  '2026-09-25': '中秋', '2026-09-26': '中秋', '2026-09-27': '中秋',
  '2026-10-01': '国庆', '2026-10-02': '国庆', '2026-10-03': '国庆',
  '2026-10-04': '国庆', '2026-10-05': '国庆', '2026-10-06': '国庆',
  '2026-10-07': '国庆',
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getSeason(month) {
  if (month >= 3 && month <= 5) return '春'
  if (month >= 6 && month <= 8) return '夏'
  if (month >= 9 && month <= 11) return '秋'
  return '冬'
}

function getWeatherForMonth(month) {
  const weathers = {
    1: '晴 -5~3°C', 2: '多云 -2~8°C', 3: '晴 5~15°C', 4: '多云 12~22°C',
    5: '晴 18~28°C', 6: '多云 22~32°C', 7: '晴 26~35°C', 8: '多云 24~33°C',
    9: '晴 20~28°C', 10: '多云 14~22°C', 11: '晴 6~15°C', 12: '多云 -1~8°C',
  }
  return weathers[month] || '晴 15~25°C'
}

function getEstimatedTouristCount(city, dateStr, isWeekend, isHoliday, season) {
  let base = 5000 + (city.costLevel * 1000) + Math.random() * 4000

  // Season factor
  if (city.bestMonths && city.bestMonths.includes(parseInt(dateStr.split('-')[1]))) {
    base *= 1.4
  }

  // Weekend boost
  if (isWeekend) base *= 1.5

  // Holiday super boost
  if (isHoliday) base *= 2.8

  // Summer boost for coastal cities
  const monthInt = parseInt(dateStr.split('-')[1])
  if ((city.tags.includes('海滨') || city.tags.includes('避暑')) && (monthInt >= 6 && monthInt <= 8)) {
    base *= 1.6
  }

  // Winter boost for tropical cities
  if (city.tags.includes('度假') && (monthInt >= 12 || monthInt <= 2)) {
    base *= 1.8
  }

  // Raining season reduce for some regions
  if (city.region === '西南' && (monthInt >= 6 && monthInt <= 8)) {
    base *= 0.75
  }

  return Math.round(base)
}

function getCrowdLevel(count) {
  if (count < 8000) return 1
  if (count < 12000) return 2
  if (count < 18000) return 3
  if (count < 25000) return 4
  return 5
}

function getCrowdLabel(level) {
  if (level <= 2) return '低人流'
  if (level <= 3) return '中等人流'
  return '高人流'
}

function getCrowdColor(level) {
  if (level <= 2) return 'low'
  if (level <= 3) return 'mid'
  return 'high'
}

export function generateFlowForCity(cityId, daysAhead = 14, daysBehind = 7) {
  var city = cities.find(function(c) { return c.id === cityId }) || { id: cityId, costLevel: 2, tags: [], bestMonths: [4,5,9,10], region: '其他' }; // fallback for API cities

  const entries = []
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - daysBehind)

  for (let i = 0; i < daysBehind + daysAhead; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateStr = formatDate(date)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isHoliday = !!CHINESE_HOLIDAYS_2026[dateStr]
    const month = date.getMonth() + 1
    const season = getSeason(month)

    const touristCount = getEstimatedTouristCount(city, dateStr, isWeekend, isHoliday, season)
    const crowdLevel = getCrowdLevel(touristCount)
    const isPrediction = i >= daysBehind

    entries.push({
      key: `${cityId}_${dateStr}`,
      cityId,
      date: dateStr,
      touristCount,
      crowdLevel,
      isWeekend,
      isHoliday,
      season,
      weather: getWeatherForMonth(month),
      isPrediction,
      crowdLabel: getCrowdLabel(crowdLevel),
      crowdColor: getCrowdColor(crowdLevel),
      generatedAt: Date.now(),
    })
  }

  return entries
}

export async function refreshData() {
  // Try API-first data loading
  try {
    var apiCities = await fetchCities();
    if (apiCities && apiCities.length > 0) {
      await saveCities(apiCities);
      // NO return - flow gen below
    }
  } catch(e) {}
  // Fallback to bundled data
  const existing = await getAllCities()
  if (existing.length === 0) {
    await saveCities(cities)
  } else {
    // Merge new cities into existing DB
    const existingIds = new Set(existing.map(c => c.id))
    const newCities = cities.filter(c => !existingIds.has(c.id))
    if (newCities.length > 0) await saveCities(newCities)
  }

  var allFlowEntries = []
  for (var ci = 0; ci < cities.length; ci++) {
    var flow = generateFlowForCity(cities[ci].id)
    for (var cj = 0; cj < flow.length; cj++) { allFlowEntries.push(flow[cj]) }
  }
  if (allFlowEntries.length > 0) { await saveFlowEntries(allFlowEntries) }
}

export function getCrowdStatsForCity(flowData) {
  if (!flowData || flowData.length === 0) return { avgLevel: 0, lowDays: 0, midDays: 0, highDays: 0, bestDates: [] }
  const levels = flowData.map(f => f.crowdLevel)
  const avg = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length)
  const low = flowData.filter(f => f.crowdLevel <= 2).length
  const mid = flowData.filter(f => f.crowdLevel === 3).length
  const high = flowData.filter(f => f.crowdLevel >= 4).length

  // Find best consecutive low-crowd dates (2+ days)
  const bestDates = []
  for (let i = 1; i < flowData.length; i++) {
    if (flowData[i].crowdLevel <= 2 && flowData[i-1].crowdLevel <= 2) {
      if (!bestDates.some(d => d === flowData[i-1].date)) {
        bestDates.push(flowData[i-1].date)
      }
      if (!bestDates.some(d => d === flowData[i].date)) {
        bestDates.push(flowData[i].date)
      }
    }
  }

  return { avgLevel: avg, lowDays: low, midDays: mid, highDays: high, bestDates }
}
