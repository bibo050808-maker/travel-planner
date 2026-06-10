// API Service - Fetch from remote API or local fallback
var API_BASE = '';

export async function fetchCities() {
  if (API_BASE) {
    try {
      var r = await fetch(API_BASE + '/cities');
      if (r.ok) return await r.json();
    } catch(e) {}
  }
  var r = await fetch('/data/cities.json');
  return await r.json();
}

export function setApiBase(url) { API_BASE = url; }

// Supabase setup (uncomment & configure):
// setApiBase('https://YOUR-PROJECT.supabase.co/rest/v1');
// Then add headers: Authorization: Bearer YOUR_KEY
