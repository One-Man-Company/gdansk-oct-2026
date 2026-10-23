#!/usr/bin/env python3
"""Builds the Gdańsk trip site (single-file, mobile-first) from data/places.json."""
import json, math, pathlib, datetime

ROOT = pathlib.Path(__file__).parent
DATA = json.load(open(ROOT / "data/places.json"))
FLAT = (54.34727, 18.61882)

CATS = {
    "history":  ("History", "🏛️", "#f5b13d"),
    "views":    ("Views", "🌅", "#4fd1c5"),
    "walk":     ("Walks", "🚶", "#8ab4f8"),
    "fun":      ("Fun", "🎯", "#c084fc"),
    "bar":      ("Bars", "🍸", "#ff7ab6"),
    "food":     ("Food", "🍽️", "#ffb86b"),
    "daytrip":  ("Day trips", "🚆", "#57d38c"),
    "practical":("Practical", "📍", "#94a3b8"),
}

def hav(a, b):
    R = 6371.0
    la1, lo1, la2, lo2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    d = 2 * R * math.asin(math.sqrt(math.sin((la2-la1)/2)**2 + math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2))
    return round(d, 1)

for p in DATA:
    p["km"] = hav(FLAT, (p["lat"], p["lon"]))
    p["walk"] = max(1, round(p["km"] / 4.5 * 60))
    p["catName"], p["emoji"], p["color"] = CATS[p["cat"]]
    p["gmaps"] = f"https://www.google.com/maps/search/?api=1&query={p['lat']},{p['lon']}"
    p["dir"] = f"https://www.google.com/maps/dir/?api=1&origin={FLAT[0]},{FLAT[1]}&destination={p['lat']},{p['lon']}&travelmode=walking"

DATA.sort(key=lambda p: (p["cat"], p["km"]))

WEATHER = {
  "source": "Open-Meteo hourly model blend",
  "days": [
    {"key":"sat","date":"Sat 24 Oct","label":"Arrival day","code":"Overcast, dry","max":11.7,"min":8.0,
     "feelsMax":8.8,"feelsMin":4.8,"rain":0.0,"prob":5,"wind":14.7,"gust":32.0,"dir":"S · 171°",
     "sunrise":"07:31","sunset":"17:27","uv":1.8,"verdict":"GOOD","vclass":"good",
     "summary":"Dry the whole day. Cloud breaks in the evening (7% cover by 20:00) — a clear, cold sunset. Wind moderate, 14–15 km/h, gusts 32.",
     "plan":"Old Town on foot + waterfront sunset. Perfect for the bar crawl — you will be walking between bars, not hiding from rain."},
    {"key":"sun","date":"Sun 25 Oct","label":"Storm day","code":"Rain PM, gale","max":9.6,"min":5.3,
     "feelsMax":5.2,"feelsMin":1.2,"rain":1.9,"prob":100,"wind":24.3,"gust":62.3,"dir":"S · 180°",
     "sunrise":"07:33","sunset":"17:25","uv":1.0,"verdict":"INDOOR","vclass":"bad",
     "summary":"Dry until ~13:00, then rain 14:00–19:00 with 100% probability at 18:00. Sustained wind 22–24 km/h with gusts to 62 km/h — gale-force at the waterfront.",
     "plan":"Museum day: WWII Museum in the morning, indoor activity (bowling/axe/shooting) in the afternoon, concert or long dinner in the evening. NO boat, NO tower, NO Westerplatte, NO Sopot."},
    {"key":"mon","date":"Mon 26 Oct","label":"Departure day","code":"Partly sunny, dry","max":12.1,"min":7.7,
     "feelsMax":8.3,"feelsMin":5.1,"rain":0.0,"prob":27,"wind":18.4,"gust":46.1,"dir":"SW · 225°",
     "sunrise":"07:35","sunset":"17:22","uv":1.5,"verdict":"GOOD","vclass":"good",
     "summary":"The warmest day of the three and mostly dry. Cloud thins in the afternoon (29% by 18:00). Wind 15–18 km/h, gusts 46 — breezy but workable.",
     "plan":"Oliwa organ + park in the morning, free Monday museums in the afternoon, sunset on a hill, then airport. Leave the flat by 20:00."}
  ],
  "hourly": {
    "sat": [["06","8.4","5.8",0,11.8,26],["09","8.4","5.7",0,11.7,26],["12","11.2","8.3",0,13.7,31],
            ["15","11.7","8.8",3,13.6,30],["18","10.9","8.5",0,12.3,30],["21","9.0","6.1",0,13.0,28]],
    "sun": [["06","5.4","1.8",0,14.5,36],["09","5.7","1.2",0,19.4,49],["12","8.9","3.7",4,22.0,56],
            ["15","8.5","4.1",46,21.6,60],["18","8.3","4.7",100,16.8,49],["21","7.9","5.0",64,13.8,37]],
    "mon": [["06","8.3","5.3",0,13.0,32],["09","8.9","5.6",0,15.0,46],["12","11.3","7.3",2,18.4,46],
            ["15","11.9","8.3",3,15.1,35],["18","10.3","7.2",3,11.6,34],["21","8.6","5.5",2,13.6,30]]
  }
}

def js(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

css = (ROOT / "src/style.css").read_text()
body = (ROOT / "src/body.html").read_text()
app = (ROOT / "src/app.js").read_text()

ICON = {
 "walk": '<circle cx="13.5" cy="4.4" r="1.9"/><path d="M12 21l1.6-5.6-3.1-3 2.1-5.6 3.6 3 3 1M9.4 9.4L7 14l3 1.6"/>',
 "views": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
 "locate": '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"/>',
 "practical": '<path d="M12 21.4s7-6.6 7-11.4a7 7 0 10-14 0c0 4.8 7 11.4 7 11.4z"/><circle cx="12" cy="10" r="2.5"/>',
 "bar": '<path d="M4 4h16l-8 8v6M8 20h8M6.4 8h11.2"/>',
 "daytrip": '<rect x="5" y="3" width="14" height="13" rx="2.4"/><path d="M5 10h14M8.6 20l2-4M15.4 20l-2-4"/>',
 "fun": '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/>',
 "info": '<circle cx="12" cy="12" r="8.5"/><path d="M12 11.2v5M12 7.9v.2"/>',
}
def tab_icon(k):
    return ('<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>')
TABS = [("plan","Plan","walk"),("weather","Weather","views"),("map","Map","locate"),("places","Places","practical"),
        ("eat","Eat & Drink","bar"),("transport","Transport","daytrip"),("costs","Budget","fun"),("info","Info","info")]
nav = "".join(f'<button class="tab{" on" if k=="plan" else ""}" data-tab="{k}">{tab_icon(i)}{v}</button>' for k, v, i in TABS)

html = f"""<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Gdańsk · 24–26 Oct 2026 · 5 friends</title>
<meta name="description" content="A weather-proofed 3-day Gdańsk plan for five friends: hour-by-hour forecast, 63 mapped places with prices and October opening hours, transport costs, and bar routes.">
<meta name="theme-color" content="#0a0c11">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta property="og:title" content="Gdańsk · 24–26 Oct 2026">
<meta property="og:description" content="Three days, five friends, one storm on Sunday. The full plan, map, prices and bars.">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%23f5b13d'/%3E%3Ctext x='50' y='72' font-size='62' font-family='Helvetica,Arial,sans-serif' font-weight='bold' fill='%231a1205' text-anchor='middle'%3EG%3C/text%3E%3C/svg%3E">
<link rel="manifest" href="manifest.json">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css">
<style>{css}</style>
</head>
<body>
<header class="top">
  <div class="topbar">
    <div class="logo"><span class="dot">G</span><span>GDAŃSK · 24–26 OCT</span></div>
    <div class="spacer"></div>
    <button class="iconbtn" id="theme" title="Light / dark" aria-label="Toggle theme"></button>
  </div>
</header>
<nav class="tabs"><div class="tabscroll">{nav}</div></nav>
<main>
{body}
</main>
<footer><div class="wrap">
  <p style="margin:0 0 6px"><b>Built for five friends, 24–26 October 2026.</b> Prices and opening hours verified 23 Oct 2026 from official sites; forecasts from Open-Meteo; map data © OpenStreetMap contributors.</p>
  <p style="margin:0">Not a booking site — links go to the venues' own pages. Re-check anything you are about to pay for: Polish museums change hours on public holidays and bars change them weekly.</p>
</div></footer>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script>
const PLACES={js(DATA)};
const CATS={js(CATS)};
const WEATHER={js(WEATHER)};
window.PLACES=PLACES; window.CATS=CATS; window.WEATHER=WEATHER;
</script>
<script>{app}</script>
</body>
</html>
"""
(ROOT / "index.html").write_text(html)

manifest = {
  "name": "Gdańsk 24–26 Oct", "short_name": "Gdańsk", "start_url": "./index.html",
  "display": "standalone", "background_color": "#0a0c11", "theme_color": "#0a0c11",
  "icons": [{"src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' rx='42' fill='%23f5b13d'/%3E%3Ctext x='96' y='138' font-size='120' font-family='Helvetica,Arial,sans-serif' font-weight='bold' fill='%231a1205' text-anchor='middle'%3EG%3C/text%3E%3C/svg%3E",
             "sizes": "192x192", "type": "image/svg+xml", "purpose": "any"}]
}
(ROOT / "manifest.json").write_text(json.dumps(manifest, indent=1))

print(f"built index.html {len(html)/1024:.0f} KB · {len(DATA)} places · "
      f"{sum(1 for p in DATA if p['cat']=='bar')} bars · {sum(1 for p in DATA if p['cat']=='food')} food")
