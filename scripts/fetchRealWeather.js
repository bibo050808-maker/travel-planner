import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AMAP_KEY = process.env.AMAP_KEY || "";
import cities from "../src/engine/cities.js";

async function fetchCityWeather(cityName) {
  var url = "https://restapi.amap.com/v3/weather/weatherInfo?key=" + AMAP_KEY + "&city=" + encodeURIComponent(cityName) + "&extensions=all";
  try {
    var r = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined });
    if (!r.ok) return null;
    var d = await r.json();
    if (d.status !== "1" || !d.forecasts || !d.forecasts[0]) return null;
    var casts = d.forecasts[0].casts || [];
    var result = {};
    for (var i = 0; i < casts.length; i++) {
      result[casts[i].date] = { weather: casts[i].dayweather || "", tempMax: parseInt(casts[i].daytemp) || 0, tempMin: parseInt(casts[i].nighttemp) || 0 };
    }
    return result;
  } catch(e) { return null; }
}

async function main() {
  if (!AMAP_KEY) { console.error("ERROR: Set AMAP_KEY env var first"); process.exit(1); }
  console.log("Fetching real weather for " + cities.length + " cities...");
  var output = {};
  var ok = 0;
  for (var i = 0; i < cities.length; i += 5) {
    var batch = cities.slice(i, Math.min(i + 5, cities.length));
    var results = await Promise.allSettled(batch.map(async function(c) {
      var w = await fetchCityWeather(c.name);
      if (w) { output[c.id] = w; ok++; }
    }));
    console.log("  #" + (Math.floor(i / 5) + 1) + ": " + batch.length + " cities (" + ok + " OK)");
    if (i + 5 < cities.length) await new Promise(function(r) { setTimeout(r, 200); });
  }
  fs.writeFileSync(path.resolve(ROOT, "src/engine/realLatestWeather.json"), JSON.stringify(output, null, 2), "utf8");
  console.log("Done! " + ok + "/" + cities.length + " cities saved.");
}
main().catch(function(e) { console.error("Fatal:", e); process.exit(1); });