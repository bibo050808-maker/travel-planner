import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname,"..");
const AMAP_KEY = process.env.AMAP_KEY || "";
import staticCities from "../src/engine/cities.js";

async function main() {
  if(!AMAP_KEY){console.error("ERROR: AMAP_KEY not set");process.exit(1)}
  var r=await fetch("https://restapi.amap.com/v3/config/district?keywords="+encodeURIComponent("中国")+"&subdistrict=2&key="+AMAP_KEY);
  var data=await r.json();
  var seen=new Set();
  var all=[];
  staticCities.forEach(function(c){if(!seen.has(c.name)){seen.add(c.name);all.push({name:c.name,province:c.province})}});
  var provinces=(data.districts&&data.districts[0]&&data.districts[0].districts)||[];
  provinces.forEach(function(p){(p.districts||[]).forEach(function(c){if(!seen.has(c.name)){seen.add(c.name);all.push({name:c.name,province:p.name})}})});
  console.log("Total: "+all.length+" cities");
  console.log("Serial fetch (80ms delay)...");
  var wm={};var ok=0;
  for(var i=0;i<all.length;i++){
    try{
      var url="https://restapi.amap.com/v3/weather/weatherInfo?key="+AMAP_KEY+"&city="+encodeURIComponent(all[i].name)+"&extensions=all";
      var rr=await fetch(url,{signal:AbortSignal.timeout?AbortSignal.timeout(3000):undefined});
      if(rr.ok){
        var dd=await rr.json();
        if(dd.status==="1"&&dd.forecasts&&dd.forecasts[0]){
          var casts=dd.forecasts[0].casts||[];
          var fc={};
          casts.forEach(function(cx){fc[cx.date]={weather:cx.dayweather||"",tempMax:parseInt(cx.daytemp)||0,tempMin:parseInt(cx.nighttemp)||0}});
          wm[all[i].name]={province:all[i].province,forecast:fc};
          ok++;
        }
      }
    }catch(e){}
    if((i+1)%50===0)console.log("  "+(i+1)+"/"+all.length+" ("+ok+" OK)");
    await new Promise(function(rr){setTimeout(rr,80)});
  }
  console.log("Done! "+ok+"/"+all.length+" cities");
  fs.writeFileSync(path.resolve(ROOT,"src/engine/realLatestWeather.json"),JSON.stringify(wm,null,2),"utf8");
  console.log("Saved: "+fs.statSync(path.resolve(ROOT,"src/engine/realLatestWeather.json")).size+" bytes");
}
main().catch(function(e){console.error(e);process.exit(1)});
