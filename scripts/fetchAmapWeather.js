import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AMAP_KEY = process.env.AMAP_KEY || "";
import cities from "../src/engine/cities.js";

async function fetchWeather(cityName) {
  var url = "https://restapi.amap.com/v3/weather/weatherInfo?key=" + AMAP_KEY + "&city=" + encodeURIComponent(cityName) + "&extensions=all";
  try {
    var r = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined });
    if (!r.ok) return null;
    var data = await r.json();
    if (data.status !== "1" || !data.forecasts || !data.forecasts[0]) return null;
    var casts = data.forecasts[0].casts || [];
    var result = {};
    for (var i = 0; i < casts.length; i++) {
      result[casts[i].date] = { weather: casts[i].dayweather || "", tempMax: parseInt(casts[i].daytemp) || 0, tempMin: parseInt(casts[i].nighttemp) || 0 };
    }
    return result;
  } catch(e) { return null; }
}

async function main() {
  if (!AMAP_KEY) { console.error("ERROR: AMAP_KEY not set"); process.exit(1); }
  console.log("Fetching weather for " + cities.length + " cities...");
  var wMap = {};
  var ok = 0;
  for (var i = 0; i < cities.length; i += 20) {
    var batch = cities.slice(i, i + 20);
    var results = await Promise.allSettled(batch.map(async function(c) {
      var w = await fetchWeather(c.name);
      if (w) { wMap[c.name] = w; ok++; }
    }));
    console.log("  Batch " + (Math.floor(i / 20) + 1) + ": " + batch.length + " cities (" + ok + " OK)");
    if (i + 20 < cities.length) await new Promise(function(r) { setTimeout(r, 1000); });
  }
  var outPath = path.resolve(ROOT, "src/engine/weatherData.json");
  fs.writeFileSync(outPath, JSON.stringify(wMap, null, 2), "utf8");
  console.log("Done! " + ok + "/" + cities.length + " cities");
}
main().catch(function(e) { console.error("Fatal:", e); process.exit(1); });