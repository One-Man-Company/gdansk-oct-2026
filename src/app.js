/* Gdańsk trip planner — vanilla JS, MapLibre + OpenFreeMap (no API keys) */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- inline SVG icon set (no emoji: renders identically everywhere) ---------- */
  const P = {
    history: '<path d="M3 21h18M4 21V10m5 11V10m6 11V10m5 11V10M2 10L12 3l10 7"/>',
    views: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
    walk: '<circle cx="13.5" cy="4.4" r="1.9"/><path d="M12 21l1.6-5.6-3.1-3 2.1-5.6 3.6 3 3 1M9.4 9.4L7 14l3 1.6"/>',
    fun: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/>',
    bar: '<path d="M4 4h16l-8 8v6M8 20h8M6.4 8h11.2"/>',
    food: '<path d="M6 3v8a2.4 2.4 0 004.8 0V3M8.4 11v10M16.6 3c-1.6 1.6-2.2 3.3-2.2 5.5s.6 3.9 2.2 5.5V21"/>',
    daytrip: '<rect x="5" y="3" width="14" height="13" rx="2.4"/><path d="M5 10h14M8.6 20l2-4M15.4 20l-2-4"/>',
    practical: '<path d="M12 21.4s7-6.6 7-11.4a7 7 0 10-14 0c0 4.8 7 11.4 7 11.4z"/><circle cx="12" cy="10" r="2.5"/>',
    home: '<path d="M3 11l9-7 9 7v9.4a1 1 0 01-1 1h-5.4V15H9.4v6.4H4a1 1 0 01-1-1z"/>',
    pin: '<path d="M12 21.4s7-6.6 7-11.4a7 7 0 10-14 0c0 4.8 7 11.4 7 11.4z"/><circle cx="12" cy="10" r="2.5"/>',
    link: '<path d="M10.5 13.5a4.5 4.5 0 006.4 0l1.8-1.8a4.5 4.5 0 00-6.4-6.4l-1 1"/><path d="M13.5 10.5a4.5 4.5 0 00-6.4 0l-1.8 1.8a4.5 4.5 0 006.4 6.4l1-1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/>',
    moon: '<path d="M20.5 14.4A8.6 8.6 0 019.6 3.5 8.6 8.6 0 1020.5 14.4z"/>',
    locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"/>',
    expand: '<path d="M9 3.5H3.5V9M15 3.5h5.5V9M15 20.5h5.5V15M9 20.5H3.5V15"/>'
  };
  const icon = (k, cls) => '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[k] || P.practical) + '</svg>';

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const saved = localStorage.getItem("gd-theme");
  if (saved) root.setAttribute("data-theme", saved);
  else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) root.setAttribute("data-theme", "light");
  const themeBtn = $("#theme");
  function syncThemeBtn() {
    const light = root.getAttribute("data-theme") === "light";
    if (themeBtn) themeBtn.innerHTML = icon(light ? "moon" : "sun");
    if (window.__map) {
      window.__map.setStyle(light ? STYLE_LIGHT : STYLE_DARK);
      window.__map.once("styledata", () => setTimeout(renderMap, 150));
    }
  }
  if (themeBtn) themeBtn.addEventListener("click", () => {
    const light = root.getAttribute("data-theme") === "light";
    root.setAttribute("data-theme", light ? "dark" : "light");
    localStorage.setItem("gd-theme", light ? "dark" : "light");
    syncThemeBtn();
  });
  syncThemeBtn();

  /* ---------- tabs ---------- */
  const tabs = $$(".tab");
  const pages = $$("section.page");
  function show(id, push) {
    const target = document.getElementById(id) || document.getElementById("plan");
    pages.forEach(p => p.classList.toggle("on", p.id === target.id));
    tabs.forEach(t => t.classList.toggle("on", t.dataset.tab === target.id));
    if (push !== false) history.replaceState(null, "", "#" + target.id);
    window.scrollTo(0, 0);
    if (target.id === "map") {
      if (!window.__map) initMap();
      if (window.__map) {
        [60, 250, 700].forEach(ms => setTimeout(() => { window.__map.resize(); renderMap(); }, ms));
        setTimeout(() => { if (!window.__mapFitted && window.__fitAll) { window.__fitAll(); window.__mapFitted = true; } }, 340);
      }
    }
  }
  tabs.forEach(t => t.addEventListener("click", () => show(t.dataset.tab)));
  document.body.addEventListener("click", (e) => {
    const a = e.target.closest("[data-go]");
    if (!a) return;
    const id = a.getAttribute("href").replace("#", "");
    e.preventDefault();
    show(a.dataset.go);
    const el = document.getElementById(id);
    if (el) setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.outline = "2px solid var(--amber)";
      setTimeout(() => el.style.outline = "", 1800);
    }, 90);
  });
  const start = location.hash.replace("#", "");
  if (start && document.getElementById(start)) show(start, false);

  /* ---------- weather ---------- */
  const wxWrap = $("#wxcards");
  if (wxWrap && window.WEATHER) {
    WEATHER.days.forEach(d => {
      const hrs = WEATHER.hourly[d.key] || [];
      const el = document.createElement("div");
      el.className = "card wx-day";
      el.innerHTML =
        '<div class="top"><div><div class="badge ' + d.vclass + '">' + d.verdict + '</div>' +
        '<h3 style="margin:8px 0 2px">' + d.date + '</h3><div class="tiny mut">' + esc(d.label) + ' · ' + esc(d.code) + '</div></div>' +
        '<div style="text-align:right"><div class="temp">' + Math.round(d.max) + '°<span> / ' + Math.round(d.min) + '°</span></div>' +
        '<div class="tiny mut">feels ' + Math.round(d.feelsMax) + '° / ' + Math.round(d.feelsMin) + '°</div></div></div>' +
        '<div class="hours">' + hrs.map(h =>
          '<div><span class="mut">' + h[0] + '</span><b>' + h[1] + '°</b><span class="' + (h[3] >= 50 ? 'rr' : 'r') + '">' + h[3] + '%</span><br><span class="tiny mut">' + h[5] + 'k</span></div>').join('') +
        '</div>' +
        '<div class="wx-meta">' +
        '<div><span class="mut tiny">Rain</span><b>' + d.rain.toFixed(1) + ' mm · ' + d.prob + '%</b></div>' +
        '<div><span class="mut tiny">Wind / gusts</span><b>' + d.wind + ' / ' + d.gust + ' km/h</b></div>' +
        '<div><span class="mut tiny">Sunset</span><b>' + d.sunset + '</b></div>' +
        '<div><span class="mut tiny">UV</span><b>' + d.uv + '</b></div>' +
        '</div>' +
        '<p class="small" style="margin:12px 0 6px">' + esc(d.summary) + '</p>' +
        '<p class="small" style="margin:0;color:var(--amber2)"><b>Plan:</b> ' + esc(d.plan) + '</p>';
      wxWrap.appendChild(el);
    });
  }

  /* ---------- place card ---------- */
  function card(p) {
    const days = (p.day || []).filter(Boolean).map(d => ({ d1: "Sat", d2: "Sun", d3: "Mon" }[d])).join(" · ");
    const dist = p.cat === "practical" ? "" : '<span><b>From flat</b>' + p.km + ' km · ' + p.walk + ' min walk</span>';
    return '<article class="place" id="pl-' + p.id + '">' +
      '<div class="ph"><div class="ic" style="color:' + p.color + '">' + icon(p.id === "flat" ? "home" : p.cat) + '</div>' +
      '<div style="flex:1"><h3 class="nm">' + esc(p.name) + '</h3>' +
      '<div class="ar">' + esc(p.area) + (p.addr ? ' · ' + esc(p.addr) : '') + '</div></div>' +
      '<div style="text-align:right;white-space:nowrap"><div style="font-weight:800;font-size:13px;color:' + p.color + '">' + esc(p.price.split("·")[0].trim()) + '</div>' +
      '<div class="tiny mut">' + (p.indoor ? "indoor" : "outdoor") + '</div></div></div>' +
      '<p class="ds">' + esc(p.desc) + '</p>' +
      '<div class="why"><b>Why it matters:</b> ' + esc(p.why) + '</div>' +
      (p.tip ? '<div class="tip">' + esc(p.tip) + '</div>' : '') +
      '<div class="meta"><span><b>Hours</b>' + esc(p.hours) + '</span><span><b>Time</b>' + esc(p.dur) + '</span>' + dist +
      (days ? '<span><b>Best</b>' + days + '</span>' : '') + '</div>' +
      '<div class="links">' +
      '<a class="btn pri" href="' + p.gmaps + '" target="_blank" rel="noopener">' + icon("pin") + ' Maps</a>' +
      '<a class="btn" href="' + p.dir + '" target="_blank" rel="noopener">' + icon("walk") + ' Walk there</a>' +
      (p.web ? '<a class="btn" href="' + p.web + '" target="_blank" rel="noopener">' + icon("link") + ' Website</a>' : '') +
      '</div></article>';
  }

  /* ---------- filters ---------- */
  const listState = { cat: "all", day: "all", q: "" };
  const mapState = { cat: "all" };

  function buildChips() {
    const catWrap = $("#catfilters"), dayWrap = $("#dayfilters");
    if (catWrap) {
      catWrap.innerHTML = '<button class="fchip on" data-cat="all">All (' + PLACES.length + ')</button>' +
        Object.keys(CATS).map(c => {
          const n = PLACES.filter(p => p.cat === c).length;
          return '<button class="fchip" data-cat="' + c + '"><span style="color:' + CATS[c][2] + '">' + icon(c) + '</span> ' + CATS[c][0] + ' (' + n + ')</button>';
        }).join("");
    }
    if (dayWrap) {
      dayWrap.innerHTML = [["all", "All days"], ["d1", "Sat 24"], ["d2", "Sun 25"], ["d3", "Mon 26"]]
        .map(([v, l]) => '<button class="fchip' + (v === "all" ? " on" : "") + '" data-day="' + v + '">' + l + '</button>').join("");
    }
    const mf = $("#mapfilters");
    if (mf) {
      mf.innerHTML = '<button class="fchip on" data-mcat="all">All (' + PLACES.length + ')</button>' +
        Object.keys(CATS).map(c => '<button class="fchip" data-mcat="' + c + '"><span style="color:' + CATS[c][2] + '">' + icon(c) + '</span> ' + CATS[c][0] + '</button>').join("");
    }
  }

  document.body.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cat]"), d = e.target.closest("[data-day]"), m = e.target.closest("[data-mcat]");
    if (c) {
      listState.cat = c.dataset.cat;
      $$("[data-cat]").forEach(x => x.classList.toggle("on", x.dataset.cat === listState.cat));
      renderList();
    }
    if (d) {
      listState.day = d.dataset.day;
      $$("[data-day]").forEach(x => x.classList.toggle("on", x.dataset.day === listState.day));
      renderList();
    }
    if (m) {
      mapState.cat = m.dataset.mcat;
      $$("[data-mcat]").forEach(x => x.classList.toggle("on", x.dataset.mcat === mapState.cat));
      renderMap(); fitAll();
    }
  });

  /* ---------- lists ---------- */
  const listEl = $("#placelist"), countEl = $("#placecount");
  function filtered() {
    const q = listState.q.toLowerCase();
    return PLACES.filter(p => {
      if (listState.cat !== "all" && p.cat !== listState.cat) return false;
      if (listState.day !== "all" && !(p.day || []).includes(listState.day)) return false;
      if (q && !(p.name + " " + p.area + " " + p.desc + " " + p.why + " " + p.addr).toLowerCase().includes(q)) return false;
      return true;
    });
  }
  function renderList() {
    if (!listEl) return;
    const rows = filtered();
    if (countEl) countEl.textContent = rows.length + (rows.length === 1 ? " place" : " places") +
      (listState.cat !== "all" ? " in " + CATS[listState.cat][0] : "") +
      (listState.day !== "all" ? " · " + { d1: "Saturday", d2: "Sunday", d3: "Monday" }[listState.day] : "") +
      " · nearest first";
    listEl.innerHTML = rows.length ? rows.map(card).join("") :
      '<div class="card"><b>Nothing matches.</b><p class="small mut" style="margin:6px 0 0">Clear the search or pick another category.</p></div>';
  }
  const eatEl = $("#eatlist");
  function renderEat() {
    if (!eatEl) return;
    const bars = PLACES.filter(p => p.cat === "bar").sort((a, b) => a.km - b.km);
    const food = PLACES.filter(p => p.cat === "food").sort((a, b) => a.km - b.km);
    eatEl.innerHTML = '<h3 style="margin:6px 0 10px">Bars (' + bars.length + ')</h3>' + bars.map(card).join("") +
      '<h3 style="margin:26px 0 10px">Restaurants &amp; food (' + food.length + ')</h3>' + food.map(card).join("");
  }

  /* ---------- map (MapLibre + OpenFreeMap, no key) ---------- */
  const STYLE_LIGHT = "https://tiles.openfreemap.org/styles/liberty";
  const STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";

  function initMap() {
    const el = $("#map");
    if (!el) return;
    if (!window.maplibregl) { el.innerHTML = '<div style="padding:20px">Map could not load. All places are listed in the Places tab.</div>'; return; }
    const map = new maplibregl.Map({
      container: "map",
      style: root.getAttribute("data-theme") === "light" ? STYLE_LIGHT : STYLE_DARK,
      center: [18.63, 54.36], zoom: 12, attributionControl: false
    });
    window.__map = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    window.__byId = {};
    window.__allMarkers = PLACES.map(p => {
      const size = p.id === "flat" ? 34 : 28;
      const div = document.createElement("div");
      div.className = "pin" + (p.id === "flat" ? " home" : "");
      div.style.width = div.style.height = size + "px";
      div.style.background = p.color;
      div.title = p.name;
      div.innerHTML = '<span>' + icon(p.id === "flat" ? "home" : p.cat) + '</span>';
      const pop = new maplibregl.Popup({ offset: size * 0.75, maxWidth: "270px", closeButton: true })
        .setHTML('<div class="pop"><h4>' + esc(p.name) + '</h4>' +
          '<div class="m">' + esc(p.area) + ' · ' + esc(p.price.split("·")[0].trim()) + '</div>' +
          '<div style="margin-bottom:6px">' + esc(p.hours) + '</div>' +
          '<a href="' + p.gmaps + '" target="_blank" rel="noopener">Maps ↗</a>' +
          (p.web ? '<a href="' + p.web + '" target="_blank" rel="noopener">Website ↗</a>' : '') +
          '<a href="#pl-' + p.id + '" data-go="places">Details →</a></div>');
      const mk = new maplibregl.Marker({ element: div, anchor: "bottom" })
        .setLngLat([p.lon, p.lat]).setPopup(pop).addTo(map);
      mk.__p = p;
      window.__byId[p.id] = mk;
      return mk;
    });

    $("#fitall").addEventListener("click", fitAll);
    $("#locate").addEventListener("click", () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        const ll = [pos.coords.longitude, pos.coords.latitude];
        new maplibregl.Marker({ color: "#4fd1c5" }).setLngLat(ll)
          .setPopup(new maplibregl.Popup().setHTML("You are here")).addTo(map).togglePopup();
        map.flyTo({ center: ll, zoom: 15 });
      }, () => alert("Location not available — check browser permissions."), { timeout: 8000 });
    });

    window.__fitAll = fitAll;
    map.on("load", () => { map.resize(); renderMap(); });
    map.on("moveend", renderMap);
    map.on("zoomend", renderMap);
    renderMap();
  }
  function visible(p, st) { return st.cat === "all" || p.cat === st.cat; }

  /* screen-space clustering: keeps icon pins when they fit, groups them when they don't */
  function renderMap() {
    const map = window.__map;
    if (!window.__allMarkers) return;
    window.__allMarkers.forEach(m => { if (m._map) m.remove(); });
    (window.__clusters || []).forEach(el => el.remove());
    window.__clusters = [];

    const list = PLACES.filter(p => visible(p, mapState));
    const tol = 46, groups = [];
    list.forEach(p => {
      let pt;
      try { pt = map.project([p.lon, p.lat]); } catch (e) { pt = null; }
      if (!pt) return;
      let g = groups.find(g => Math.hypot(g.x - pt.x, g.y - pt.y) < tol);
      if (!g) { g = { x: pt.x, y: pt.y, pts: [p] }; groups.push(g); }
      else { g.pts.push(p); g.x = (g.x * (g.pts.length - 1) + pt.x) / g.pts.length; g.y = (g.y * (g.pts.length - 1) + pt.y) / g.pts.length; }
    });

    groups.forEach(g => {
      if (g.pts.length === 1) {
        const mk = window.__byId[g.pts[0].id];
        if (mk) mk.addTo(map);
      } else {
        const lon = g.pts.reduce((s, p) => s + p.lon, 0) / g.pts.length;
        const lat = g.pts.reduce((s, p) => s + p.lat, 0) / g.pts.length;
        const el = document.createElement("div");
        el.className = "clusters";
        const sz = Math.round(Math.min(42, 28 + Math.log2(g.pts.length) * 4));
        el.style.cssText = "width:" + sz + "px;height:" + sz + "px;font-size:" + (sz > 36 ? 13 : 12) + "px";
        el.innerHTML = "<span>" + g.pts.length + "</span>";
        el.title = g.pts.slice(0, 6).map(p => p.name).join(" · ") + (g.pts.length > 6 ? " …" : "");
        el.addEventListener("click", () => map.flyTo({ center: [lon, lat], zoom: Math.min(map.getZoom() + 2, 16.5), duration: 500 }));
        new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([lon, lat]).addTo(map);
        window.__clusters.push(el);
      }
    });
  }
  function fitAll() {
    const map = window.__map;
    if (!map || !window.maplibregl) return;
    const c = map.getContainer();
    if (!c.clientWidth || !c.clientHeight) return;
    let list = PLACES.filter(p => visible(p, mapState));
    if (mapState.cat === "all") list = list.filter(p => p.km <= 8); // frame the city, not the airport/Malbork
    if (!list.length) return;
    const b = new maplibregl.LngLatBounds();
    list.forEach(p => b.extend([p.lon, p.lat]));
    map.fitBounds(b, { padding: 34, maxZoom: 13.4, duration: 500 });
  }

  /* ---------- search ---------- */
  const q = $("#q");
  if (q) {
    let t;
    q.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { listState.q = q.value.trim(); renderList(); }, 120);
    });
  }

  /* ---------- boot ---------- */
  buildChips();
  renderList();
  renderEat();
  if (document.getElementById("map").classList.contains("on")) initMap();
})();
