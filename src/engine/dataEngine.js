import { saveCities, getAllCities, getFlowForCity, saveFlowEntries } from '../utils/storage'
import { fetchCities } from '../services/api'
import realWeatherList from './realLatestWeather.json';
import cities from './cities'
console.error('【重要】天气数据加载：', Object.keys(realWeatherList || {}).length, '城市');
var _fk = Object.keys(realWeatherList || {})[0];
console.error('【重要】样本：', _fk ? JSON.stringify(realWeatherList[_fk]).substring(0,200) : 'NO DATA');

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


function getFallbackWeather(city) { return getRegionalFallback(city && city.province); }

function hashStr(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h | 0; } return Math.abs(h); }

function perturbWeather(base, seed) {
  var tables = {
    "sunny": ["晴","多云","晴","晴","多云","晴","晴","多云","晴","多云"],
    "cloudy": ["多云","多云","晴","多云","阴","多云","多云","阴","多云","晴"],
    "rainy": ["小雨","中雨","多云","阴","小雨","阵雨","多云","小雨","中雨","阴"],
  };
  if (base.includes('晴') || base.includes('晴')) return tables.sunny[seed % 10];
  if (base.includes('云') || base.includes('阴')) return tables.cloudy[seed % 10];
  if (base.includes('雨') || base.includes('雷') || base.includes('雪') || base.includes('暴')) return tables.rainy[seed % 10];
  return tables.sunny[seed % 10];
}
export function generateFlowForCity(cityId, daysAhead = 14, daysBehind = 7) {
  const city = cities.find(c => c.id === cityId); if (!city) return [];
  const entries = [];
  var safeCityName = (city.name || "").replace(/市|区|城区|县|省/g, "");
  var realWeatherValues = Object.values(realWeatherList || {});
  var realData = null;
  try {
    realData = realWeatherValues.find(w => {
      var safeProvince = (w.province || "").replace(/市|区|城区|县|省/g, "");
      var safeWCity = (w.city || "").replace(/市|区|城区|县|省/g, "");
      return (safeProvince && (safeProvince.includes(safeCityName) || safeCityName.includes(safeProvince))) || 
             (safeWCity && (safeWCity.includes(safeCityName) || safeCityName.includes(safeWCity)));
    });
  } catch(e) {}

  var baseWeather = null, baseTemp = null;
  if (realData && realData.forecast) {
    var fcKeys = Object.keys(realData.forecast);
    if (fcKeys.length > 0) {
      var firstFc = realData.forecast[fcKeys[0]];
      if (firstFc && firstFc.weather && firstFc.tempMax != null) {
        baseWeather = firstFc.weather; baseTemp = parseInt(firstFc.tempMax);
      }
    }
  }
  if (!baseWeather || baseTemp === null) {
    var fb = getRegionalFallback(city && city.province);
    var m = fb.match(/[\u4e00-\u9fff]+/g), t = fb.match(/(\d+)~(\d+)/);
    baseWeather = m ? m[m.length - 1] : '多云'; baseTemp = t ? parseInt(t[2]) : 25;
  }

  const now = new Date(); const startDate = new Date(now); startDate.setDate(now.getDate() - daysBehind);

  for (let i = 0; i < daysBehind + daysAhead; i++) {
    const date = new Date(startDate); date.setDate(startDate.getDate() + i); const dateStr = formatDate(date);
    const dayOfWeek = date.getDay(), isWeekend = dayOfWeek === 0 || dayOfWeek === 6, isHoliday = !!CHINESE_HOLIDAYS_2026[dateStr];
    const month = date.getMonth() + 1, season = getSeason(month);
    const touristCount = getEstimatedTouristCount(city, dateStr, isWeekend, isHoliday, season), crowdLevel = getCrowdLevel(touristCount), isPrediction = i >= daysBehind;

    var dayWeather = "⛅ 多云 20~27°C";
    if (realData && realData.forecast && realData.forecast[dateStr]) {
      var fc = realData.forecast[dateStr]; dayWeather = fc.weather + " " + fc.tempMin + "~" + fc.tempMax + "°C";
    } else if (baseWeather && baseTemp !== null) {
      var seed = hashStr(cityId + dateStr), offset = (seed % 7) - 3;
      var currentMin = Math.min(baseTemp - 8 + offset, baseTemp + offset - 2), currentMax = baseTemp + offset;
      var dynamicPhenomenon = perturbWeather(baseWeather, seed);
      dayWeather = dynamicPhenomenon + " " + currentMin + "~" + currentMax + "°C";
    } else if (typeof getFallbackWeather === "function") { dayWeather = getFallbackWeather(city); }

    entries.push({
      key: `${cityId}_${dateStr}`, cityId, date: dateStr, touristCount, crowdLevel, isWeekend, isHoliday, season,
      weather: dayWeather, isPrediction, crowdLabel: getCrowdLabel(crowdLevel), crowdColor: getCrowdColor(crowdLevel), generatedAt: Date.now(),
    });
  }
  console.log('[DataGen 终极成功] ' + city.name + ' 首日天气: ' + (entries[0] ? entries[0].weather : 'N/A'));
  return entries;
}

export async function refreshData() {
  // Try API-first data loading
  try {
    var apiCities = await fetchCities();
    if (apiCities && apiCities.length > 0) {
      await saveCities(apiCities);
      return;
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

  var wMap = {};
  try { cities.forEach(function(cx) {
    var key = cx.name;
    var w = realWeatherList[key];
    if (!w) {
      var allKeys = Object.keys(realWeatherList);
      for (var k = 0; k < allKeys.length; k++) {
        if (key.includes(allKeys[k]) || allKeys[k].includes(key)) {
          w = realWeatherList[allKeys[k]];
          break;
        }
      }
    }
    if (w && w.forecast) wMap[cx.id] = w.forecast;
  }); } catch(e){}
  var allFlow = [];
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
