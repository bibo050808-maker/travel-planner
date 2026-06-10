import { AMAP_KEY, LEAN_APP_ID, LEAN_APP_KEY, API_BASE } from '../config';
// API Service - Multi-platform data integration
// Supports: 高德地图 API (maps/POI/routes), LeanCloud (user data), custom backend

var AMAP_KEY = '';        // 高德地图 Web API Key
var LEAN_APP_ID = '';     // LeanCloud App ID
var LEAN_APP_KEY = '';    // LeanCloud App Key
var API_BASE = '';        // Custom backend URL

// ==========================================
// 高德地图 API（需要先注册获取 Key）
// ==========================================
// 注册: https://lbs.amap.com/dev/key/app
// 免费额度: 日调用量 30000 次

export async function fetchCitiesFromAmap() {
  if (!AMAP_KEY) return null;
  // 获取全国行政区划（地级市）
  var r = await fetch('https://restapi.amap.com/v3/config/district?keywords=中国&subdistrict=2&key=' + AMAP_KEY);
  var data = await r.json();
  if (data.status !== '1' || !data.districts) return null;
  
  var provinces = data.districts[0].districts || [];
  var cities = [];
  provinces.forEach(function(p) {
    var cityList = p.districts || [];
    cityList.forEach(function(c) {
      if (c.level === 'city' || c.level === 'district') {
        cities.push({
          id: c.adcode,
          name: c.name,
          province: p.name,
          tags: [],
          costLevel: 2,
          foodScore: 7,
          avgHotelPrice: 200,
          bestMonths: [4, 5, 9, 10],
          attractions: [],
          cuisines: [],
          region: getRegion(p.name),
          adcode: c.adcode,
          center: c.center,
        });
      }
    });
  });
  return cities;
}

function getRegion(province) {
  var north = ['北京','天津','河北','山西','内蒙古'];
  var northeast = ['辽宁','吉林','黑龙江'];
  var east = ['上海','江苏','浙江','安徽','福建','江西','山东'];
  var central = ['河南','湖北','湖南'];
  var south = ['广东','广西','海南'];
  var southwest = ['重庆','四川','贵州','云南','西藏'];
  var northwest = ['陕西','甘肃','青海','宁夏','新疆'];
  if (north.includes(province)) return '华北';
  if (northeast.includes(province)) return '东北';
  if (east.includes(province)) return '华东';
  if (central.includes(province)) return '华中';
  if (south.includes(province)) return '华南';
  if (southwest.includes(province)) return '西南';
  if (northwest.includes(province)) return '西北';
  return '其他';
}

export async function searchPOI(cityCode, keywords, types) {
  if (!AMAP_KEY) return null;
  var typeStr = types ? '&types=' + types : '';
  var r = await fetch('https://restapi.amap.com/v3/place/text?key=' + AMAP_KEY + '&keywords=' + encodeURIComponent(keywords) + '&city=' + cityCode + typeStr + '&offset=20');
  var data = await r.json();
  return data;
}

export async function getRoute(fromLng, fromLat, toLng, toLat, strategy) {
  if (!AMAP_KEY) return null;
  strategy = strategy || 0;
  var r = await fetch('https://restapi.amap.com/v3/direction/driving?key=' + AMAP_KEY + '&origin=' + fromLng + ',' + fromLat + '&destination=' + toLng + ',' + toLat + '&strategy=' + strategy);
  var data = await r.json();
  return data;
}

// ==========================================
// LeanCloud（用户数据存储）
// ==========================================
// 注册: https://console.leancloud.app/apps
// 免费额度: API 请求 10000次/天

function leanHeaders() {
  var now = new Date().toISOString();
  return {
    'X-LC-Id': LEAN_APP_ID,
    'X-LC-Key': LEAN_APP_KEY,
    'Content-Type': 'application/json',
  };
}

export async function saveToCloud(className, data) {
  if (!LEAN_APP_ID) return null;
  var r = await fetch('https://' + LEAN_APP_ID.substring(0, 8) + '.api.lncldglobal.com/1.1/classes/' + className, {
    method: 'POST',
    headers: leanHeaders(),
    body: JSON.stringify(data),
  });
  return await r.json();
}

export async function queryFromCloud(className, params) {
  if (!LEAN_APP_ID) return null;
  var query = Object.keys(params || {}).map(function(k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
  var r = await fetch('https://' + LEAN_APP_ID.substring(0, 8) + '.api.lncldglobal.com/1.1/classes/' + className + '?' + query, {
    headers: leanHeaders(),
  });
  return await r.json();
}

// ==========================================
// 现有兼容接口（保留降级逻辑）
// ==========================================

export async function fetchCities() {
  // 优先级: 高德地图 > API_BASE > 本地数据
  if (AMAP_KEY) {
    try {
      var cities = await fetchCitiesFromAmap();
      if (cities && cities.length > 20) return cities;
    } catch(e) {}
  }
  if (API_BASE) {
    try {
      var r = await fetch(API_BASE + '/cities');
      if (r.ok) return await r.json();
    } catch(e) {}
  }
  throw new Error('No data source available');
}

export function setAmapKey(key) { AMAP_KEY = key; }
export function setLeanCloudKeys(appId, appKey) { LEAN_APP_ID = appId; LEAN_APP_KEY = appKey; }
export function setApiBase(url) { API_BASE = url; }