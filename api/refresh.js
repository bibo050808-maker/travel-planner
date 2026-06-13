// Vercel Serverless Function - BFF 数据管道
// 用途：安全调用高德天气 API（Key 不暴露给前端），生成流控数据
import cities from '../src/engine/cities.js';

const AMAP_KEY = process.env.AMAP_WEATHER_KEY || '';

const HOLIDAYS_2026 = {
  '2026-01-01': '元旦', '2026-02-18': '春节', '2026-02-19': '春节',
  '2026-04-05': '清明', '2026-05-01': '劳动节', '2026-06-19': '端午',
  '2026-09-25': '中秋', '2026-10-01': '国庆',
};

function formatDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function getSeason(m) { return m >= 3 && m <= 5 ? '春' : m >= 6 && m <= 8 ? '夏' : m >= 9 && m <= 11 ? '秋' : '冬'; }

function calcCrowd(city, dateStr, isWeekend, holiday, season, weather) {
  var base = 5000 + (city.costLevel || 2) * 1000 + Math.random() * 4000;
  if (city.bestMonths && city.bestMonths.includes(parseInt(dateStr.split('-')[1]))) base *= 1.4;
  if (isWeekend) base *= 1.5;
  if (holiday) base *= 2.8;
  var m = parseInt(dateStr.split('-')[1]);
  if ((city.tags || []).includes('海滨') && m >= 6 && m <= 8) base *= 1.6;
  if ((city.tags || []).includes('度假') && (m >= 12 || m <= 2)) base *= 1.8;
  if (weather && (weather.includes('雨') || weather.includes('雪') || weather.includes('雷'))) base *= 0.6;
  return Math.round(base);
}

function getLevel(c) { return c < 8000 ? 1 : c < 12000 ? 2 : c < 18000 ? 3 : c < 25000 ? 4 : 5; }
function getLabel(l) { return l <= 2 ? '低人流' : l <= 3 ? '中等人流' : '高人流'; }
function getColor(l) { return l <= 2 ? 'low' : l <= 3 ? 'mid' : 'high'; }

function fallbackWeather(month) {
  var w = {1:'晴 -5~3°C',2:'多云 -2~8°C',3:'晴 5~15°C',4:'多云 12~22°C',5:'晴 18~28°C',6:'多云 22~32°C',7:'晴 26~35°C',8:'多云 24~33°C',9:'晴 20~28°C',10:'多云 14~22°C',11:'晴 6~15°C',12:'多云 -1~8°C'};
  return w[month] || '晴 15~25°C';
}

async function fetchGaodeWeather(cityName) {
  if (!AMAP_KEY || !cityName) return null;
  var url = 'https://restapi.amap.com/v3/weather/weatherInfo?key=' + AMAP_KEY + '&city=' + encodeURIComponent(cityName) + '&extensions=all';
  try {
    var r = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined });
    if (!r.ok) return null;
    var data = await r.json();
    if (data.status !== '1' || !data.forecasts || !data.forecasts[0]) return null;
    var casts = data.forecasts[0].casts || [];
    var result = {};
    casts.forEach(function(c) { result[c.date] = { weather: c.dayweather || '', tempMax: parseInt(c.daytemp) || 0, tempMin: parseInt(c.nighttemp) || 0 }; });
    return result;
  } catch(e) { return null; }
}

function generateEntries(city, weatherMap) {
  var entries = [];
  var now = new Date();
  for (var i = -7; i < 14; i++) {
    var d = new Date(now); d.setDate(now.getDate() + i);
    var dateStr = formatDate(d);
    var dow = d.getDay();
    var isWeekend = dow === 0 || dow === 6;
    var holiday = HOLIDAYS_2026[dateStr] || null;
    var month = d.getMonth() + 1;
    var season = getSeason(month);
    var wData = weatherMap && weatherMap[dateStr] ? weatherMap[dateStr] : null;
    var weatherStr = wData ? wData.weather + ' ' + wData.tempMax + '°C' : fallbackWeather(month);
    var crowd = calcCrowd(city, dateStr, isWeekend, holiday, season, wData ? wData.weather : null);
    var level = getLevel(crowd);
    entries.push({
      key: city.id + '_' + dateStr,
      cityId: city.id,
      date: dateStr,
      touristCount: crowd,
      crowdLevel: level,
      isWeekend: isWeekend,
      isHoliday: !!holiday,
      season: season,
      weather: weatherStr,
      isPrediction: i >= 0,
      crowdLabel: getLabel(level),
      crowdColor: getColor(level),
      generatedAt: Date.now(),
    });
  }
  return entries;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  if (!AMAP_KEY) {
    return res.status(200).json({ ok: false, error: 'AMAP_WEATHER_KEY not configured in Vercel environment variables', entries: [], generatedAt: null });
  }

  var allEntries = [];
  var weatherCount = 0;

  for (var i = 0; i < cities.length; i += 5) {
    var batch = cities.slice(i, Math.min(i + 5, cities.length));
    var results = await Promise.all(batch.map(async function(city) {
      var weatherMap = await fetchGaodeWeather(city.name);
      if (weatherMap) weatherCount++;
      return generateEntries(city, weatherMap);
    }));
    results.forEach(function(entries) { entries.forEach(function(e) { allEntries.push(e); }); });
    if (i + 5 < cities.length) await new Promise(function(r) { setTimeout(r, 300); });
  }

  return res.status(200).json({
    ok: true,
    generatedAt: Date.now(),
    totalEntries: allEntries.length,
    citiesProcessed: cities.length,
    citiesWithWeather: weatherCount,
    entries: allEntries
  });
}
