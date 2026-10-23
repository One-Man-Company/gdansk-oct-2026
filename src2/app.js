/* Šeškinė Trip — compact list-first UI, MapLibre map */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const P = {
    see: '<path d="M3 21h18M4 21V10m5 11V10m6 11V10m5 11V10M2 10L12 3l10 7"/>',
    eat: '<path d="M6 3v8a2.4 2.4 0 004.8 0V3M8.4 11v10M16.6 3c-1.6 1.6-2.2 3.3-2.2 5.5s.6 3.9 2.2 5.5V21"/>',
    cafe: '<path d="M4 8h13v5a4 4 0 01-4 4H8a4 4 0 01-4-4V8zM17 9h2a2 2 0 010 4h-2M6 3v2M10 3v2M14 3v2"/>',
    drink: '<path d="M4 4h16l-8 8v6M8 20h8M6.4 8h11.2"/>',
    do: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/>',
    nature: '<path d="M12 21v-6M12 15l-4-4a4 4 0 115.7-5.7L12 7l-1.7-1.7A4 4 0 0116 11l-4 4z"/>',
    trip: '<rect x="5" y="3" width="14" height="13" rx="2.4"/><path d="M5 10h14M8.6 20l2-4M15.4 20l-2-4"/>',
    practical: '<path d="M12 21.4s7-6.6 7-11.4a7 7 0 10-14 0c0 4.8 7 11.4 7 11.4z"/><circle cx="12" cy="10" r="2.5"/>',
    home: '<path d="M3 11l9-7 9 7v9.4a1 1 0 01-1 1h-5.4V15H9.4v6.4H4a1 1 0 01-1-1z"/>',
    pin: '<path d="M12 21.4s7-6.6 7-11.4a7 7 0 10-14 0c0 4.8 7 11.4 7 11.4z"/><circle cx="12" cy="10" r="2.5"/>',
    walk: '<circle cx="13.5" cy="4.4" r="1.9"/><path d="M12 21l1.6-5.6-3.1-3 2.1-5.6 3.6 3 3 1M9.4 9.4L7 14l3 1.6"/>',
    link: '<path d="M10.5 13.5a4.5 4.5 0 006.4 0l1.8-1.8a4.5 4.5 0 00-6.4-6.4l-1 1"/><path d="M13.5 10.5a4.5 4.5 0 00-6.4 0l-1.8 1.8a4.5 4.5 0 006.4 6.4l1-1"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/>',
    moon: '<path d="M20.5 14.4A8.6 8.6 0 019.6 3.5 8.6 8.6 0 1020.5 14.4z"/>',
    locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"/>',
    expand: '<path d="M9 3.5H3.5V9M15 3.5h5.5V9M15 20.5h5.5V15M9 20.5H3.5V15"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    plan: '<path d="M4 5h16M4 12h16M4 19h10"/>'
  };
  const icon = (k, cls) => '<svg class="i ' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[k] || P.practical) + '</svg>';

  const CAT = {
    see:      { label: "See",       color: "#1d5c4c" },
    eat:      { label: "Eat",       color: "#c8791f" },
    cafe:     { label: "Café",      color: "#a16207" },
    drink:    { label: "Drink",     color: "#b23b3b" },
    do:       { label: "Do",        color: "#6d4aa6" },
    nature:   { label: "Nature",    color: "#2f7d55" },
    trip:     { label: "Day trip",  color: "#2563a8" },
    practical:{ label: "Practical", color: "#6c7480" }
  };
  const DAYLBL = { d1: "Sat", d2: "Sun", d3: "Mon" };

  /* theme */
  const root = document.documentElement;
  const saved = localStorage.getItem("st-theme");
  if (saved) root.setAttribute("data-theme", saved);
  else if (matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) root.setAttribute("data-theme", "dark");
  const themeBtn = $("#theme");
  const syncTheme = () => { if (themeBtn) themeBtn.innerHTML = icon(root.getAttribute("data-theme") === "dark" ? "sun" : "moon"); };
  if (themeBtn) themeBtn.onclick = () => {
    const dark = root.getAttribute("data-theme") === "dark";
    root.setAttribute("data-theme", dark ? "light" : "dark");
    localStorage.setItem("st-theme", dark ? "light" : "dark");
    syncTheme();
  };
  syncTheme();

  /* tabs */
  const tabs = $$(".tab"), pages = $$("section.page");
  function show(id) {
    const t = document.getElementById(id) || document.getElementById("plan");
    pages.forEach(p => p.classList.toggle("on", p.id === t.id));
    tabs.forEach(b => b.classList.toggle("on", b.dataset.tab === t.id));
    history.replaceState(null, "", "#" + t.id);
    window.scrollTo(0, 0);
    if (t.id === "map") {
      if (!window.__map) initMap();
      if (window.__map) [40, 200, 600].forEach(ms => setTimeout(() => { window.__map.resize(); renderMap(); }, ms));
    }
  }
  tabs.forEach(b => b.onclick = () => show(b.dataset.tab));

  /* weather strip */
  const WX = {
    sat: { d: "Sat 24", t: "8→12°", v: "good", vt: "GOOD", n: "Dry · sunset 17:27 · gust 32" },
    sun: { d: "Sun 25", t: "5→10°", v: "bad", vt: "INDOOR", n: "Rain 14–19 · gust 62" },
    mon: { d: "Mon 26", t: "8→12°", v: "good", vt: "GOOD", n: "Dry · gusts 46" }
  };
  const ws = $("#wxstrip");
  if (ws) ws.innerHTML = Object.values(WX).map(w =>
    '<div class="wxd"><div class="d">' + w.d + '</div><div class="t">' + w.t + '</div>' +
    '<span class="v ' + w.v + '">' + w.vt + '</span><div class="n">' + w.n + '</div></div>').join("");

  /* day tabs */
  $$("#daytabs .day").forEach(b => b.onclick = () => {
    $$("#daytabs .day").forEach(x => x.classList.toggle("on", x === b));
    $$(".daypanel").forEach(p => p.style.display = p.dataset.panel === b.dataset.day ? "" : "none");
  });

  /* ---------- rows ---------- */
  const ratingCls = r => !r ? "" : r >= 4.6 ? "good" : r >= 4.2 ? "mid" : "low";
  function row(p) {
    const c = CAT[p.cat] || CAT.practical;
    const days = (p.days || []).map(d => DAYLBL[d]).join(" · ");
    const rate = p.rating ? '<span class="rate">' + icon("star") + p.rating.toFixed(1) + '</span>' : '';
    const priceTxt = p.price && p.price !== "—" ? p.price.split("·")[0].trim() : "";
    const dist = p.cat === "practical" ? "" : p.km + " km";
    return '<article class="row" id="r-' + p.id + '" data-cat="' + p.cat + '">' +
      '<button class="rowhead" aria-expanded="false">' +
        '<span class="cdot" style="background:' + c.color + '"></span>' +
        '<span class="rm"><span class="rt">' + esc(p.name) + '</span>' +
        '<span class="rs">' + esc(p.sub) + ' · ' + esc(p.area) + '</span></span>' +
        '<span class="rr">' + rate + (priceTxt ? '<span class="price">' + esc(priceTxt) + '</span>' : '') + '</span>' +
        icon("chev", "chev") +
      '</button>' +
      '<div class="rowbody">' +
        '<p>' + esc(p.desc) + '</p>' +
        '<p class="why"><b>Why:</b> ' + esc(p.why) + '</p>' +
        (p.tip ? '<div class="tip">' + esc(p.tip) + '</div>' : '') +
        '<div class="rc">' + (p.hours && p.hours !== "—" ? '<span>' + esc(p.hours) + '</span>' : '') +
          (p.dur && p.dur !== "—" ? '<span>' + esc(p.dur) + '</span>' : '') +
          (days ? '<span>Best: ' + days + '</span>' : '') + (dist ? '<span>' + dist + ' from flat</span>' : '') +
          '<span>' + (p.indoor ? "Inside" : "Outside") + '</span></div>' +
        '<div class="links">' +
          '<a class="btn pri" href="' + p.gmaps + '" target="_blank" rel="noopener">' + icon("pin") + ' Maps</a>' +
          '<a class="btn" href="' + p.dir + '" target="_blank" rel="noopener">' + icon("walk") + ' Walk ' + (p.walk || "") + ' min</a>' +
          (p.web ? '<a class="btn" href="' + p.web + '" target="_blank" rel="noopener">' + icon("link") + ' Site</a>' : '') +
        '</div>' +
      '</div></article>';
  }
  const shown = { list: 25, eat: 25, drink: 25 };
  function mount(el, items, key, emptyMsg) {
    if (!el) return;
    const n = shown[key] || 25;
    const slice = items.slice(0, n);
    el.innerHTML = (items.length ? slice.map(row).join("") :
      '<div class="card"><b>Nothing matches.</b><p class="small mut" style="margin:4px 0 0">' + (emptyMsg || "Clear the search or pick another filter.") + '</p></div>') +
      (items.length > n ? '<button class="more" data-more="' + key + '">Show ' + Math.min(25, items.length - n) + ' more · ' + (items.length - n) + ' left</button>' : "");
  }
  document.addEventListener("click", e => {
    const m = e.target.closest("[data-more]");
    if (!m) return;
    shown[m.dataset.more] = (shown[m.dataset.more] || 25) + 25;
    if (m.dataset.more === "list") renderList();
    if (m.dataset.more === "eat") renderEat();
    if (m.dataset.more === "drink") renderDrink();
  });
  /* expand */
  document.addEventListener("click", e => {
    const h = e.target.closest(".rowhead");
    if (!h) return;
    const art = h.closest(".row");
    const open = art.classList.toggle("open");
    h.setAttribute("aria-expanded", open ? "true" : "false");
  });
  /* deep links from the plan */
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-row]");
    if (!a) return;
    e.preventDefault();
    openRow(a.dataset.row);
  });
  function openRow(id) {
    const p = PLACES.find(x => x.id === id);
    if (!p) return;
    listState.cat = "all"; listState.day = "all"; listState.minRating = false;
    listState.q = p.name;                     // filter to this place so it is guaranteed rendered
    const q = $("#q"); if (q) q.value = p.name;
    buildChips(); renderList();
    show("places");
    setTimeout(() => {
      const el = document.getElementById("r-" + id);
      if (!el) return;
      el.classList.add("open");
      el.querySelector(".rowhead").setAttribute("aria-expanded", "true");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.outline = "2px solid var(--accent)";
      setTimeout(() => el.style.outline = "", 1600);
    }, 80);
  }

  /* ---------- filters ---------- */
  const listState = { cat: "all", day: "all", q: "", minRating: false, sort: "distance" };
  const eatState = { kind: "all", minRating: false };
  const drinkState = { kind: "all", minRating: false };
  const mapState = { cat: "all" };

  function chip(label, attr, val, on) {
    return '<button class="fchip' + (on ? " on" : "") + '" ' + attr + '="' + val + '">' + label + '</button>';
  }
  function buildChips() {
    const c = $("#catfilters");
    if (c) c.innerHTML = chip("All", "data-fcat", "all", listState.cat === "all") +
      Object.keys(CAT).map(k => chip(icon(k) + " " + CAT[k].label, "data-fcat", k, listState.cat === k)).join("");
    const d = $("#dayfilters");
    if (d) d.innerHTML = chip("Any day", "data-day", "all", listState.day === "all") +
      Object.entries(DAYLBL).map(([k, v]) => chip(v, "data-day", k, listState.day === k)).join("") +
      chip("★ 4.5+", "data-min", "1", listState.minRating);
    const e = $("#eatfilters");
    if (e) e.innerHTML = chip("All", "data-ekind", "all", eatState.kind === "all") +
      chip("Restaurants", "data-ekind", "eat", eatState.kind === "eat") +
      chip("Cafés", "data-ekind", "cafe", eatState.kind === "cafe") +
      chip("★ 4.5+", "data-emin", "1", eatState.minRating);
    const dr = $("#drinkfilters");
    if (dr) dr.innerHTML = chip("All", "data-dkind", "all", drinkState.kind === "all") +
      chip("Cocktails", "data-dkind", "cocktail", drinkState.kind === "cocktail") +
      chip("Craft beer", "data-dkind", "beer", drinkState.kind === "beer") +
      chip("Clubs", "data-dkind", "club", drinkState.kind === "club") +
      chip("★ 4.5+", "data-dmin", "1", drinkState.minRating);
    const m = $("#mapfilters");
    if (m) m.innerHTML = chip("All", "data-mcat", "all", mapState.cat === "all") +
      Object.keys(CAT).map(k => chip(icon(k) + " " + CAT[k].label, "data-mcat", k, mapState.cat === k)).join("");
  }
  document.addEventListener("click", e => {
    const t = e.target;
    const c = t.closest("[data-fcat]"), d = t.closest("[data-day]"), min = t.closest("[data-min]");
    const ek = t.closest("[data-ekind]"), em = t.closest("[data-emin]");
    const dk = t.closest("[data-dkind]"), dm = t.closest("[data-dmin]");
    const mc = t.closest("[data-mcat]"), so = t.closest("[data-sort]");
    if (c) { listState.cat = c.dataset.fcat; buildChips(); renderList(); }
    if (d) { listState.day = d.dataset.day; buildChips(); renderList(); }
    if (min) { listState.minRating = !listState.minRating; buildChips(); renderList(); }
    if (ek) { eatState.kind = ek.dataset.ekind; buildChips(); renderEat(); }
    if (em) { eatState.minRating = !eatState.minRating; buildChips(); renderEat(); }
    if (dk) { drinkState.kind = dk.dataset.dkind; buildChips(); renderDrink(); }
    if (dm) { drinkState.minRating = !drinkState.minRating; buildChips(); renderDrink(); }
    if (mc) { mapState.cat = mc.dataset.mcat; buildChips(); renderMap(); fitAll(); }
    if (so) { listState.sort = so.dataset.sort; buildChips(); renderList(); }
  });

  const byRating = (a, b) => (b.rating || 0) - (a.rating || 0) || a.km - b.km;

  function renderList() {
    const q = listState.q.toLowerCase();
    let rows = PLACES.filter(p => {
      if (listState.cat !== "all" && p.cat !== listState.cat) return false;
      if (listState.day !== "all" && !(p.days || []).includes(listState.day)) return false;
      if (listState.minRating && !(p.rating >= 4.5)) return false;
      if (q && !(p.name + " " + p.sub + " " + p.area + " " + p.desc + " " + p.why).toLowerCase().includes(q)) return false;
      return true;
    });
    rows.sort(listState.sort === "distance" ? (a, b) => a.km - b.km : byRating);
    const count = $("#count");
    if (count) count.innerHTML = rows.length + " places · " + (listState.cat === "all" ? "all" : CAT[listState.cat].label) +
      (listState.day !== "all" ? " · " + DAYLBL[listState.day] : "") + (listState.minRating ? " · 4.5+" : "") +
      ' · <button class="sortbtn" data-sort="' + (listState.sort === "distance" ? "rating" : "distance") + '">' +
      (listState.sort === "distance" ? "nearest first ⇄" : "top rated ⇄") + '</button>';
    mount($("#list"), rows, "list");
  }
  function renderEat() {
    let rows = PLACES.filter(p => {
      if (eatState.kind === "all") return p.cat === "eat" || p.cat === "cafe";
      return p.cat === eatState.kind;
    }).filter(p => !eatState.minRating || p.rating >= 4.5);
    rows.sort(byRating);
    const c = $("#eatcount");
    if (c) c.textContent = rows.length + " places · sorted by Google rating";
    mount($("#eatlist"), rows, "eat");
  }
  function renderDrink() {
    let rows = PLACES.filter(p => p.cat === "drink").filter(p => {
      const s = (p.sub || "").toLowerCase();
      if (drinkState.kind === "cocktail") return s.includes("cocktail") || s.includes("bar");
      if (drinkState.kind === "beer") return s.includes("beer") || s.includes("pub");
      if (drinkState.kind === "club") return s.includes("club") || s.includes("student");
      return true;
    }).filter(p => !drinkState.minRating || p.rating >= 4.5);
    rows.sort(byRating);
    const c = $("#drinkcount");
    if (c) c.textContent = rows.length + " bars · sorted by Google rating";
    mount($("#drinklist"), rows, "drink");
  }

  /* search */
  const q = $("#q");
  if (q) {
    let t;
    q.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { listState.q = q.value.trim(); renderList(); }, 110); });
  }

  /* ---------- map ---------- */
  function initMap() {
    const el = $("#map");
    if (!el || !window.maplibregl) return;
    const map = new maplibregl.Map({
      container: "map", style: "https://tiles.openfreemap.org/styles/liberty",
      center: [18.64, 54.355], zoom: 12, attributionControl: false
    });
    window.__map = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    window.__byId = {};
    window.__markers = PLACES.map(p => {
      const size = p.id === "flat" ? 26 : 16;
      const d = document.createElement("div");
      d.className = "pin" + (p.id === "flat" ? " home" : "");
      d.style.cssText = "width:" + size + "px;height:" + size + "px;background:" + (CAT[p.cat] || CAT.practical).color;
      d.title = p.name;
      if (p.id === "flat") d.innerHTML = icon("home");
      const pop = new maplibregl.Popup({ offset: size * 0.7, maxWidth: "250px" }).setHTML(
        '<div class="pop"><h4>' + esc(p.name) + '</h4>' +
        '<div class="m">' + (p.rating ? "★ " + p.rating.toFixed(1) + " · " : "") + esc(p.price.split("·")[0].trim()) + ' · ' + esc(p.area) + '</div>' +
        '<div class="tiny mut" style="margin-bottom:5px">' + esc(p.hours) + '</div>' +
        '<a href="' + p.gmaps + '" target="_blank" rel="noopener">Maps ↗</a>' +
        (p.web ? '<a href="' + p.web + '" target="_blank" rel="noopener">Site ↗</a>' : '') +
        '<a href="#r-' + p.id + '" data-row="' + p.id + '">Details →</a></div>');
      const mk = new maplibregl.Marker({ element: d, anchor: "center" }).setLngLat([p.lon, p.lat]).setPopup(pop).addTo(map);
      mk.__p = p; window.__byId[p.id] = mk;
      return mk;
    });

    $("#fitall").onclick = fitAll;
    $("#locate").onclick = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        const ll = [pos.coords.longitude, pos.coords.latitude];
        new maplibregl.Marker({ color: "#c8791f" }).setLngLat(ll).addTo(map);
        map.flyTo({ center: ll, zoom: 15 });
      }, () => alert("Location not available."), { timeout: 8000 });
    };
    window.__fitAll = fitAll;
    map.on("load", () => { map.resize(); renderMap(); });
    map.on("moveend", renderMap);
    renderMap();
  }
  function visible(p) { return mapState.cat === "all" || p.cat === mapState.cat; }
  function renderMap() {
    const map = window.__map;
    if (!map || !window.__markers) return;
    window.__markers.forEach(m => { if (m._map) m.remove(); });
    (window.__clusters || []).forEach(el => el.remove());
    window.__clusters = [];
    const list = PLACES.filter(visible);
    const tol = 40, groups = [];
    list.forEach(p => {
      let pt; try { pt = map.project([p.lon, p.lat]); } catch (e) { return; }
      let g = groups.find(g => Math.hypot(g.x - pt.x, g.y - pt.y) < tol);
      if (!g) groups.push({ x: pt.x, y: pt.y, pts: [p] });
      else { g.pts.push(p); g.x = (g.x * (g.pts.length - 1) + pt.x) / g.pts.length; g.y = (g.y * (g.pts.length - 1) + pt.y) / g.pts.length; }
    });
    groups.forEach(g => {
      if (g.pts.length === 1) { const m = window.__byId[g.pts[0].id]; if (m) m.addTo(map); return; }
      const lon = g.pts.reduce((s, p) => s + p.lon, 0) / g.pts.length;
      const lat = g.pts.reduce((s, p) => s + p.lat, 0) / g.pts.length;
      const sz = Math.round(Math.min(36, 24 + Math.log2(g.pts.length) * 3.4));
      const el = document.createElement("div");
      el.className = "clusters";
      el.style.cssText = "width:" + sz + "px;height:" + sz + "px;font-size:" + (sz > 32 ? 12 : 11) + "px";
      el.textContent = g.pts.length;
      el.title = g.pts.slice(0, 5).map(p => p.name).join(" · ");
      el.onclick = () => map.flyTo({ center: [lon, lat], zoom: Math.min(map.getZoom() + 2, 16.5), duration: 450 });
      new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([lon, lat]).addTo(map);
      window.__clusters.push(el);
    });
  }
  function fitAll() {
    const map = window.__map;
    if (!map || !window.maplibregl) return;
    const c = map.getContainer();
    if (!c.clientWidth || !c.clientHeight) return;
    let list = PLACES.filter(visible);
    if (mapState.cat === "all") list = list.filter(p => p.km <= 7.5);
    if (!list.length) return;
    const b = new maplibregl.LngLatBounds();
    list.forEach(p => b.extend([p.lon, p.lat]));
    map.fitBounds(b, { padding: 28, maxZoom: 13.2, duration: 400 });
  }

  /* boot */
  buildChips();
  renderList();
  renderEat();
  renderDrink();
  const h = location.hash.replace("#", "");
  if (h && document.getElementById(h)) show(h);
  else if (h && h.startsWith("r-")) show("places");
})();
