#!/usr/bin/env python3
"""Builds the Šeškinė Trip site (single file, compact list-first UI)."""
import json, math, pathlib

ROOT = pathlib.Path(__file__).parent
DATA = json.load(open(ROOT / "data/places_v2.json"))
FLAT = (54.34727, 18.61882)

def hav(a, b):
    R = 6371.0
    la1, lo1, la2, lo2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    d = 2 * R * math.asin(math.sqrt(math.sin((la2-la1)/2)**2 + math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2))
    return round(d, 1)

for p in DATA:
    p["km"] = hav(FLAT, (p["lat"], p["lon"]))
    p["walk"] = max(1, round(p["km"] / 4.5 * 60))
    p["gmaps"] = f"https://www.google.com/maps/search/?api=1&query={p['lat']},{p['lon']}"
    p["dir"] = f"https://www.google.com/maps/dir/?api=1&origin={FLAT[0]},{FLAT[1]}&destination={p['lat']},{p['lon']}&travelmode=walking"

DATA.sort(key=lambda p: (p["cat"], p["km"]))

def js(o): return json.dumps(o, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

css = (ROOT / "src2/style.css").read_text()
body = (ROOT / "src2/body.html").read_text()
app = (ROOT / "src2/app.js").read_text()

TABS = [("plan", "Plan", "plan"), ("map", "Map", "locate"), ("places", "Places", "pin"),
        ("eat", "Eat", "eat"), ("drink", "Drink", "drink"), ("transport", "Transport", "trip"),
        ("costs", "Costs", "star"), ("info", "Info", "practical")]
PATHS = {
 "plan": '<path d="M4 5h16M4 12h16M4 19h10"/>',
 "locate": '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"/>',
 "pin": '<path d="M12 21.4s7-6.6 7-11.4a7 7 0 10-14 0c0 4.8 7 11.4 7 11.4z"/><circle cx="12" cy="10" r="2.5"/>',
 "eat": '<path d="M6 3v8a2.4 2.4 0 004.8 0V3M8.4 11v10M16.6 3c-1.6 1.6-2.2 3.3-2.2 5.5s.6 3.9 2.2 5.5V21"/>',
 "drink": '<path d="M4 4h16l-8 8v6M8 20h8M6.4 8h11.2"/>',
 "trip": '<rect x="5" y="3" width="14" height="13" rx="2.4"/><path d="M5 10h14M8.6 20l2-4M15.4 20l-2-4"/>',
 "star": '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 "practical": '<path d="M12 21.4s7-6.6 7-11.4a7 7 0 10-14 0c0 4.8 7 11.4 7 11.4z"/><circle cx="12" cy="10" r="2.5"/>',
}
def tabicon(k):
    return ('<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PATHS[k] + '</svg>')
nav = "".join(f'<button class="tab{" on" if k=="plan" else ""}" data-tab="{k}">{tabicon(i)}{v}</button>' for k, v, i in TABS)

rated = sum(1 for p in DATA if p.get("rating"))
html = f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Šeškinė Trip · Gdańsk 24–26 Oct 2026</title>
<meta name="description" content="Šeškinė Trip: a weather-led 3-day Gdańsk plan for five friends — {len(DATA)} places with Google ratings, prices, October hours, map, transport and costs.">
<meta name="theme-color" content="#f5f4f0">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Šeškinė Trip">
<meta property="og:title" content="Šeškinė Trip · Gdańsk 24–26 Oct">
<meta property="og:description" content="{len(DATA)} places, {rated} Google ratings, weather-proofed 3-day plan for five friends.">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='24' fill='%231d5c4c'/%3E%3Ctext x='50' y='70' font-size='52' font-family='Helvetica,Arial,sans-serif' font-weight='bold' fill='%23fff' text-anchor='middle'%3E%C5%A0%3C/text%3E%3C/svg%3E">
<link rel="manifest" href="manifest.json">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css">
<style>{css}</style>
</head>
<body>
<header>
  <div class="bar">
    <div class="brand"><span class="mark">Š</span>
      <span><b>Šeškinė Trip</b><span>Gdańsk · 24–26 Oct 2026 · 5 friends</span></span></div>
    <div class="sp"></div>
    <button class="iconbtn" id="theme" aria-label="Toggle theme"></button>
  </div>
</header>
<nav class="tabs"><div class="tscroll">{nav}</div></nav>
<main>
{body}
</main>
<footer><div class="wrap">
  <b>Šeškinė Trip</b> · {len(DATA)} places, {rated} Google ratings · prices and hours verified 23 Oct 2026.
  Weather: Open-Meteo · Map: OpenFreeMap / © OpenStreetMap contributors.
</div></footer>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script>
const PLACES={js(DATA)};
window.PLACES=PLACES;
</script>
<script>{app}</script>
</body>
</html>
"""
(ROOT / "index.html").write_text(html)

manifest = {
  "name": "Šeškinė Trip — Gdańsk", "short_name": "Šeškinė Trip", "start_url": "./index.html",
  "display": "standalone", "background_color": "#f5f4f0", "theme_color": "#1d5c4c",
  "icons": [{"src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' rx='44' fill='%231d5c4c'/%3E%3Ctext x='96' y='132' font-size='104' font-family='Helvetica,Arial,sans-serif' font-weight='bold' fill='%23fff' text-anchor='middle'%3E%C5%A0%3C/text%3E%3C/svg%3E",
             "sizes": "192x192", "type": "image/svg+xml", "purpose": "any"}]
}
(ROOT / "manifest.json").write_text(json.dumps(manifest, indent=1))
print(f"built {len(html)/1024:.0f} KB · {len(DATA)} places · {rated} rated")
