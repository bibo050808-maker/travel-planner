import { saveCities, getAllCities, getFlowForCity, saveFlowEntries } from '../utils/storage'
import { fetchCities } from '../services/api'
import cities from './cities'

const AMAP_KEY = (function() { try { return localStorage.getItem('amap_key') || ''; } catch(e) { return ''; } })();

function fetchGaodeWeather(cityName) {
  if (!AMAP_KEY || !cityName) return null;
  var url = 'https://restapi.amap.com/v3/weather/weatherInfo?key=' + AMAP_KEY + '&city=' + encodeURIComponent(cityName) + '&extensions=all';
  return fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined })
    .then(function(r) { if (!r.ok) return null; return r.json(); })
    .then(function(data) {
      if (!data || data.status !== '1' || !data.forecasts || !data.forecasts[0]) return null;
      var casts = data.forecasts[0].casts || [];
      var result = {};
      for (var i = 0; i < casts.length; i++) {
        result[casts[i].date] = {
          weather: casts[i].dayweather || '',
          tempMax: parseInt(casts[i].daytemp) || 0,
          tempMin: parseInt(casts[i].nighttemp) || 0
        };
      }
      return result;
    })
    .catch(function() { return null; });
}

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

function getEstimatedTouristCount(city, dateStr, isWeekend, isHoliday, season, weatherToday) {
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
  const city = cities.find(c => c.id === cityId)
  if (!city) return []

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

    const touristCount = getEstimatedTouristCount(city, dateStr, isWeekend, isHoliday, season, weatherForecast && weatherForecast[dateStr] ? weatherForecast[dateStr].weather : null)
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
      weather: (weatherForecast && weatherForecast[dateStr]) ? (weatherForecast[dateStr].weather + ' ' + weatherForecast[dateStr].tempMax + '°C') : getWeatherForMonth(month),
      isPrediction,
      crowdLabel: getCrowdLabel(crowdLevel),
      crowdColor: getCrowdColor(crowdLevel),
      generatedAt: Date.now(),
    })
  }

  return entries
}

export async function refreshData() {
  // Try BFF API first (Vercel serverless)
  try {
    var apiUrl = window.location.origin + "/api/refresh";
    var r = await fetch(apiUrl, { signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined });
    if (r.ok) {
      var data = await r.json();
      if (data.ok && data.entries && data.entries.length > 0) {
        await saveFlowEntries(data.entries);
        console.log("BFF API refreshed: " + data.totalEntries + " entries, " + data.citiesWithWeather + " cities");
        return;
      }
    }
  } catch(e) { console.log("BFF API unavailable, local fallback"); }

  // Local fallback
  try {
    var apiCities = await fetchCities();
    if (apiCities && apiCities.length > 0) { await saveCities(apiCities); }
  } catch(e) {}
  const existing = await getAllCities();
  if (existing.length === 0) { await saveCities(cities); }
  var allFlow = [];
  var wMap = {};
  var wPromises = cities.slice(0,30).map(function(cx) { return fetchGaodeWeather(cx.name).then(function(w) { wMap[cx.id] = w; }); });
  await Promise.all(wPromises);
  for (var ci = 0; ci < cities.length; ci++) {
    var flow = generateFlowForCity(cities[ci].id, 14, 7, wMap[cities[ci].id] || null);
    for (var cj = 0; cj < flow.length; cj++) { allFlow.push(flow[cj]); }
  }
  if (allFlow.length > 0) { await saveFlowEntries(allFlow); }
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
