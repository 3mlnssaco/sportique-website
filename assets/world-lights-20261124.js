// "Lights of the world": the world as a grid of dots where only the countries the service has reached are lit.
// Land cells come from assets/world-grid-20261124.json (scripts/make-world-grid.mjs), the lit countries from the
// figure's data-lit attribute, and the visible words from its figcaption (scripts/site/world-lights.mjs).
// The centre of the picture is people: white dots inside lit countries, each tied to a few nearby land dots.
// The same ?v=… the page used to load this module is passed on to the grid, so one changed file changes every address.
const GRID_URL = '/assets/world-grid-20261124.json' + new URL(import.meta.url).search;
const SEED = 20261124;
const MINT = '111,241,174';
const LAND = '150,164,190';
const LIT_DOT = 'rgb(190,255,224)';
// Unlit land: brighter close to a lit country (light spreads over its neighbours) and darker far away.
const LAND_ALPHA = 0.30, LAND_LIFT = 0.34, LAND_REACH = 58;
const GRAIN = [0.78, 0.85, 0.92, 1];
const DOT = 0.29, DOT_MIN = 0.55;
const LIT_RADIUS = 0.36, LIT_RADIUS_MIN = 0.65;
const PERSON = 0.42, PERSON_MIN = 1.7;
const GLOW_SCALE = 2.4, GLOW_MIN_CELLS = 9, GLOW_ALPHA = 0.42;
// The light reaching out into the world: one ring per lit country, only the dots it passes brighten for a moment.
const RIPPLE_PERIOD = 5.2, RIPPLE_SPEED = 30, RIPPLE_WIDTH = 2.6, RIPPLE_LIFT = 0.55, RIPPLE_RANGE = 160, RIPPLE_STAGGER = 1.3;
const RIPPLE_LEVELS = 10, FRAME_MS = 33;
const PIN_GAP = 28;
const FADE = 0.7, STAGGER = 0.45;
const BREATH_PERIOD = 6, BREATH_DEPTH = 0.08;
const PERSON_IN = 0.45, PERSON_STEP = 0.09, LINK_DELAY = 0.3, LINK_IN = 0.6;
const ARC_IN = 1.1, ARC_STEP = 0.18, TRAVEL = 3.2;
const TAU = Math.PI * 2;

function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const seedOf = text => { let h = SEED; for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193); return h >>> 0; };
const ease = x => { const v = Math.min(1, Math.max(0, x)); return v * v * (3 - 2 * v); };
function shuffle(list, rand) {
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
}

let gridPromise = null;
function loadGrid() {
  gridPromise ??= fetch(GRID_URL).then(response => {
    if (!response.ok) throw new Error('world grid unavailable');
    return response.json();
  }).then(raw => {
    const { cols, rows, codes, centers } = raw;
    const total = cols * rows;
    if (!(total > 0) || !Array.isArray(codes) || !Array.isArray(centers) || typeof raw.cells !== 'string') throw new Error('world grid malformed');
    const cells = new Uint8Array(total);
    let at = 0;
    for (const run of raw.cells.split(',')) {
      const star = run.indexOf('*');
      const value = parseInt(star < 0 ? run : run.slice(0, star), 36);
      const count = star < 0 ? 1 : parseInt(run.slice(star + 1), 36);
      if (!(value >= 0) || !(count > 0) || at + count > total) throw new Error('world grid malformed');
      cells.fill(value, at, at + count);
      at += count;
    }
    if (at !== total) throw new Error('world grid malformed');
    // A fixed grain per land cell, like a printed halftone.
    const rand = seededRandom(SEED);
    const grain = new Uint8Array(total);
    for (let i = 0; i < total; i++) grain[i] = Math.floor(rand() * GRAIN.length);
    return { cols, rows, codes, centers, cells, grain };
  });
  return gridPromise;
}

// People of one lit country: a few land cells at least two cells apart, each tied to nearby cells of the same country.
function settle(country, cols) {
  const rand = seededRandom(seedOf(country.code));
  const target = Math.min(7, 3 + Math.floor(country.cells.length / 50));
  let people = [];
  for (let attempt = 0; attempt < 16 && people.length < target; attempt++) {
    const chosen = [];
    for (const i of shuffle(country.cells.slice(), rand)) {
      const col = i % cols, row = (i - col) / cols;
      if (chosen.some(p => (p.col - col) ** 2 + (p.row - row) ** 2 < 4)) continue;
      chosen.push({ i, col, row });
      if (chosen.length === target) break;
    }
    if (chosen.length > people.length) people = chosen;
  }
  const taken = new Set(people.map(p => p.i));
  for (const person of people) {
    const want = 3 + (rand() < 0.5 ? 1 : 0);
    const near = [], far = [];
    for (const i of country.cells) {
      if (taken.has(i)) continue;
      const col = i % cols, row = (i - col) / cols;
      const d2 = (col - person.col) ** 2 + (row - person.row) ** 2;
      if (d2 > 20.25) continue;
      (d2 >= 2.25 ? far : near).push({ i, col, row, d2 });
    }
    near.sort((a, b) => a.d2 - b.d2 || a.i - b.i);
    person.links = shuffle(far, rand).slice(0, want).concat(near).slice(0, want);
  }
  return people;
}

// Opacity of every unlit land cell: the grain of the print, lifted near the lit countries.
function landAlpha(grid, countries) {
  const { cols, cells, grain } = grid;
  const alpha = new Float32Array(cells.length);
  const reach2 = LAND_REACH * LAND_REACH;
  for (let i = 0; i < cells.length; i++) {
    if (!cells[i]) continue;
    const col = i % cols, row = (i - col) / cols;
    let near = 0;
    for (const c of countries) near = Math.max(near, Math.exp(-((col - c.cx) ** 2 + (row - c.cy) ** 2) / reach2));
    alpha[i] = (LAND_ALPHA + LAND_LIFT * near) * GRAIN[grain[i]];
  }
  return alpha;
}

// For each lit country, the land that is not lit yet, nearest first: the ring only has to look at the cells near its edge.
function rippleCells(grid, countries) {
  const { cols, cells } = grid;
  const lit = new Set(countries.map(c => c.value));
  for (const c of countries) {
    const list = [];
    for (let i = 0; i < cells.length; i++) {
      if (!cells[i] || lit.has(cells[i])) continue;
      const col = i % cols, row = (i - col) / cols;
      const d = Math.hypot(col - c.cx, row - c.cy);
      if (d < RIPPLE_RANGE) list.push([d, i]);
    }
    list.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    c.reach = { dist: Float32Array.from(list, e => e[0]), cell: Int32Array.from(list, e => e[1]) };
  }
}

function buildScene(grid, lit) {
  const { cols, cells, codes, centers } = grid;
  const countries = [];
  for (const entry of lit) {
    const value = codes.indexOf(entry.code) + 1;
    if (!value || countries.some(c => c.value === value)) continue;
    const [cx, cy, size] = centers[value - 1];
    countries.push({ code: entry.code, order: Number(entry.order) || 0, value, cx, cy, size, cells: [] });
  }
  countries.sort((a, b) => a.order - b.order);
  const byValue = new Map(countries.map(c => [c.value, c]));
  for (let i = 0; i < cells.length; i++) byValue.get(cells[i])?.cells.push(i);

  countries.forEach((country, k) => {
    country.start = k * STAGGER;
    country.end = country.start + FADE;
    country.people = settle(country, cols);
  });
  const peopleAt = countries.length ? countries[countries.length - 1].end + 0.15 : 0;
  const rippleAt = peopleAt;
  const alpha = landAlpha(grid, countries);
  rippleCells(grid, countries);
  for (const country of countries) country.people.forEach((p, j) => { p.at = peopleAt + Math.min(j, 6) * PERSON_STEP; });

  // Each newly lit country joins the nearest one already lit; a few of their people are tied across.
  const arcs = [];
  const arcsAt = peopleAt + 0.9;
  const rand = seededRandom(SEED ^ 0x9e3779b9);
  const toward = (people, other) => people.slice().sort((a, b) =>
    ((a.col - other.cx) ** 2 + (a.row - other.cy) ** 2) - ((b.col - other.cx) ** 2 + (b.row - other.cy) ** 2));
  for (let k = 1; k < countries.length; k++) {
    const b = countries[k];
    let a = null, best = Infinity;
    for (let j = 0; j < k; j++) {
      const d = (countries[j].cx - b.cx) ** 2 + (countries[j].cy - b.cy) ** 2;
      if (d < best) { best = d; a = countries[j]; }
    }
    if (!a.people.length || !b.people.length) continue;
    const from = toward(a.people, b), to = toward(b.people, a);
    const count = Math.min(countries.length <= 3 ? 3 : 2, Math.max(from.length, to.length));
    for (let n = 0; n < count; n++) {
      arcs.push({
        from: from[n % from.length], to: to[n % to.length], bend: 0.16 + 0.07 * n,
        at: arcsAt + Math.min(arcs.length * ARC_STEP, 2), period: 7 + 4 * rand(), rest: 0.4 + 3 * rand(),
      });
    }
  }
  const lastArc = arcs.length ? arcs[arcs.length - 1].at + ARC_IN : 0;
  const introEnd = countries.length ? Math.max(peopleAt + 6 * PERSON_STEP + LINK_DELAY + LINK_IN, lastArc) : 0;
  return { countries, byValue, arcs, introEnd, rippleAt, alpha };
}

function mount(figure, grid) {
  const canvas = figure.querySelector('canvas');
  const ctx = canvas && canvas.getContext && canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  const layer = document.createElement('canvas');
  const lctx = layer.getContext('2d');
  if (!lctx) throw new Error('no 2d context');

  let lit = [];
  try { lit = JSON.parse(figure.dataset.lit || '[]'); } catch { lit = []; }
  if (!Array.isArray(lit)) lit = [];
  const { cols, rows, cells } = grid;
  const scene = buildScene(grid, lit.filter(entry => entry && typeof entry.code === 'string'));
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  canvas.style.aspectRatio = `${cols} / ${rows}`;

  let width = 0, height = 0, pitch = 0, dpr = 1;
  let clock = 0, last = 0, lastDraw = -1e9, raf = 0;
  let started = false, onScreen = false, wasStill = null, needsPaint = true;

  const isStill = () => reduced.matches || root.dataset.motion === 'off';
  const px = cell => (cell + 0.5) * pitch;

  function dots(target, list, radius) {
    target.beginPath();
    for (const i of list) {
      const col = i % cols, x = px(col), y = px((i - col) / cols);
      target.moveTo(x + radius, y);
      target.arc(x, y, radius, 0, TAU);
    }
    target.fill();
  }

  // The unlit world, painted once per size: every land cell is a place still to reach.
  function paintLand() {
    layer.width = canvas.width;
    layer.height = canvas.height;
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lctx.clearRect(0, 0, width, height);
    const radius = Math.max(DOT * pitch, DOT_MIN);
    const groups = new Map();
    for (let i = 0; i < cells.length; i++) {
      if (!cells[i]) continue;
      const key = Math.round(scene.alpha[i] * 100);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(i);
    }
    for (const [key, list] of groups) {
      lctx.fillStyle = `rgba(${LAND},${(key / 100).toFixed(2)})`;
      dots(lctx, list, radius);
    }
  }

  function resize() {
    const w = canvas.clientWidth;
    const ratio = Math.min(2, globalThis.devicePixelRatio || 1);
    if (!(w > 0) || (w === width && ratio === dpr)) return false;
    width = w;
    height = w * rows / cols;
    pitch = w / cols;
    dpr = ratio;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    paintLand();
    placePins();
    return true;
  }

  const curve = (arc, u) => {
    const ax = px(arc.from.col), ay = px(arc.from.row), bx = px(arc.to.col), by = px(arc.to.row);
    // A gentle arc that always bows towards the top of the map.
    const dx = bx - ax, dy = by - ay, side = dx >= 0 ? 1 : -1;
    const mx = (ax + bx) / 2 + dy * arc.bend * side, my = (ay + by) / 2 - dx * arc.bend * side;
    const v = 1 - u;
    return [v * v * ax + 2 * v * u * mx + u * u * bx, v * v * ay + 2 * v * u * my + u * u * by];
  };
  // Where the travelling light of an arc is right now (0..1 along it), or -1 while it rests.
  const travel = (arc, t) => {
    const since = t - arc.at - ARC_IN - arc.rest;
    if (since < 0) return -1;
    const phase = since % arc.period;
    if (phase >= TRAVEL) return -1;
    const u = ease(phase / TRAVEL);
    return Math.floor(since / arc.period) % 2 ? 1 - u : u;
  };

  // First dot of a distance-sorted list that is at least `min` away.
  function from(dist, min) {
    let lo = 0, hi = dist.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (dist[mid] < min) lo = mid + 1; else hi = mid; }
    return lo;
  }
  // The rings: only dots under a ring's edge are painted again, a little brighter and more mint; the rest stays as the base layer.
  const rippleTint = Array.from({ length: RIPPLE_LEVELS }, (_, k) => {
    const m = (k + 1) / RIPPLE_LEVELS;
    return LAND.split(',').map((v, c) => Math.round(+v + ([111, 241, 174][c] - v) * m)).join(',');
  });
  function ripples(t) {
    if (t < scene.rippleAt) return;
    const radius = Math.max(DOT * pitch, DOT_MIN);
    const reach = RIPPLE_WIDTH * 3;
    scene.countries.forEach((country, k) => {
      const since = t - scene.rippleAt - k * RIPPLE_STAGGER;
      if (since < 0) return;
      const r = RIPPLE_SPEED * (since % RIPPLE_PERIOD);
      const fade = Math.pow(Math.max(0, 1 - r / RIPPLE_RANGE), 1.3);
      if (fade <= 0.01) return;
      const { dist, cell } = country.reach;
      let tint = -1;
      for (let j = from(dist, r - reach); j < dist.length && dist[j] <= r + reach; j++) {
        const off = (dist[j] - r) / RIPPLE_WIDTH;
        const w = Math.exp(-off * off) * fade;
        if (w < 0.02) continue;
        const i = cell[j], base = scene.alpha[i];
        const level = Math.min(RIPPLE_LEVELS - 1, Math.floor(w * RIPPLE_LEVELS));
        if (level !== tint) { tint = level; ctx.fillStyle = `rgb(${rippleTint[level]})`; }
        // Laid over the base dot, this adds exactly RIPPLE_LIFT * w to what the eye sees there.
        ctx.globalAlpha = Math.min(1, RIPPLE_LIFT * w / (1 - base));
        const col = i % cols;
        ctx.beginPath();
        ctx.arc(px(col), px((i - col) / cols), radius, 0, TAU);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  // Name tags beside the lit countries (wide screens only; the list under the map stays for screen readers).
  const pins = new Map();
  for (const el of figure.querySelectorAll('.world-lights-pin')) pins.set(el.dataset.code, el);
  function showPin(country, on) {
    const pin = pins.get(country.code);
    if (!pin || country.pinOn === on) return;
    country.pinOn = on;
    pin.classList.toggle('is-on', on);
  }
  function placePins() {
    if (!pitch) return;
    const left = canvas.offsetLeft, top = canvas.offsetTop, right = left + width;
    for (const country of scene.countries) {
      const pin = pins.get(country.code);
      const w = pin ? pin.offsetWidth : 0, h = pin ? pin.offsetHeight : 0;
      if (!w) continue; // hidden by the stylesheet on narrow screens
      const x = left + px(country.cx), y = top + px(country.cy);
      const flip = x + PIN_GAP + w > right;
      const edge = Math.min(Math.max(flip ? x - PIN_GAP - w : x + PIN_GAP, left), Math.max(left, right - w));
      pin.style.left = `${edge}px`;
      pin.style.top = `${Math.max(y - PIN_GAP, top + h)}px`;
      pin.classList.toggle('is-left', flip);
      // The leader runs from the tag's corner to the country, also when the tag was pushed back inside the map.
      const dx = x - (flip ? edge + w - 3 : edge + 3), dy = y - (Math.max(y - PIN_GAP, top + h) - 3);
      pin.style.setProperty?.('--lead', `${Math.hypot(dx, dy)}px`);
      pin.style.setProperty?.('--lead-angle', `${Math.atan2(dy, dx) * 180 / Math.PI}deg`);
    }
  }

  function draw() {
    if (!width) return;
    const still = isStill();
    const t = clock;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    for (const country of scene.countries) {
      const level = still ? 1 : ease((t - country.start) / FADE);
      const breath = still || t <= country.end ? 1 : 1 + BREATH_DEPTH * Math.sin(TAU * (t - country.end) / BREATH_PERIOD);
      country.level = level;
      country.breath = breath;
      // Lit dots breathe between 84% and 100%.
      country.glint = still || t <= country.end ? 1 : 1 - BREATH_DEPTH * (1 - Math.sin(TAU * (t - country.end) / BREATH_PERIOD));
      showPin(country, still || level > 0);
      if (level <= 0) continue;
      const x = px(country.cx), y = px(country.cy);
      const radius = Math.max(country.size * GLOW_SCALE, GLOW_MIN_CELLS) * pitch;
      const alpha = GLOW_ALPHA * level * breath;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, `rgba(${MINT},${alpha.toFixed(3)})`);
      glow.addColorStop(0.45, `rgba(${MINT},${(alpha * 0.12 / GLOW_ALPHA).toFixed(3)})`);
      glow.addColorStop(1, `rgba(${MINT},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    ctx.drawImage(layer, 0, 0, width, height);

    if (!still) ripples(t);

    const radius = Math.max(LIT_RADIUS * pitch, LIT_RADIUS_MIN);
    ctx.fillStyle = LIT_DOT;
    for (const country of scene.countries) {
      if (country.level <= 0) continue;
      ctx.globalAlpha = country.level * country.glint;
      dots(ctx, country.cells, radius);
    }
    ctx.globalAlpha = 1;

    // Each person's ties to the places their records live.
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(${MINT},.35)`;
    ctx.beginPath();
    for (const country of scene.countries) for (const person of country.people) {
      const grow = still ? 1 : ease((t - person.at - LINK_DELAY) / LINK_IN);
      if (grow <= 0) continue;
      const x = px(person.col), y = px(person.row);
      for (const link of person.links) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + (px(link.col) - x) * grow, y + (px(link.row) - y) * grow);
      }
    }
    ctx.stroke();

    // Ties between people of different lit countries.
    ctx.strokeStyle = 'rgba(237,243,255,.28)';
    for (const arc of scene.arcs) {
      const grow = still ? 1 : ease((t - arc.at) / ARC_IN);
      if (grow <= 0) continue;
      ctx.beginPath();
      const steps = Math.max(2, Math.ceil(28 * grow));
      for (let s = 0; s <= steps; s++) {
        const [x, y] = curve(arc, grow * s / steps);
        if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }

    const body = Math.max(PERSON * pitch, PERSON_MIN);
    for (const country of scene.countries) for (const person of country.people) {
      const show = still ? 1 : ease((t - person.at) / PERSON_IN);
      if (show <= 0) continue;
      const x = px(person.col), y = px(person.row);
      ctx.globalAlpha = show;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, body * show, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgb(${MINT})`;
      ctx.beginPath();
      ctx.arc(x, y, body * show + 1, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (still) return;
    for (const arc of scene.arcs) {
      const u = travel(arc, t);
      if (u < 0) continue;
      const [x, y] = curve(arc, u);
      const fade = Math.sin(Math.PI * u);
      const spark = Math.max(0.3 * pitch, 1.4);
      ctx.fillStyle = `rgba(${MINT},${(0.3 * fade).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, spark * 2.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${(0.95 * fade).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, spark, 0, TAU);
      ctx.fill();
    }
  }

  // Repaint only as often as the picture changes: every frame while lights come on or cross, slowly while they breathe.
  function frame(now) {
    raf = requestAnimationFrame(frame);
    clock += Math.min((now - last) / 1000, 0.1);
    last = now;
    // Full rate while the lights come on, then at most 30 a frame per second for the rings.
    const wait = clock < scene.rippleAt ? 0 : FRAME_MS;
    if (now - lastDraw < wait - 1) return;
    lastDraw = now;
    draw();
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function sync() {
    const still = isStill();
    if (still !== wasStill) { wasStill = still; needsPaint = true; }
    if (still) {
      // One still picture with every light already on.
      started = true;
      clock = Math.max(clock, scene.introEnd);
    }
    if (!still && started && onScreen && !document.hidden && scene.countries.length && width) {
      needsPaint = false;
      if (!raf) { last = performance.now(); lastDraw = -1e9; raf = requestAnimationFrame(frame); }
      return;
    }
    stop();
    if (needsPaint && width) { needsPaint = false; draw(); }
  }

  // Pointing at a country: its name and whether it is lit or next.
  const captions = new Map();
  for (const item of figure.querySelectorAll('figcaption [data-code]')) {
    captions.set(item.dataset.code, { name: item.querySelector('b')?.textContent || '', status: item.querySelector('span')?.textContent || '' });
  }
  const nextLabel = figure.querySelector('[data-next]')?.textContent || '';
  let names = null;
  try { names = new Intl.DisplayNames([root.lang || 'ko'], { type: 'region' }); } catch { names = null; }
  const nameOf = code => {
    let name = '';
    try { name = names ? names.of(code) || '' : ''; } catch { name = ''; }
    return name && name !== code ? name : captions.get(code)?.name || '';
  };
  const tip = document.createElement('div');
  tip.className = 'world-lights-tip';
  tip.hidden = true;
  tip.setAttribute('aria-hidden', 'true');
  const tipName = document.createElement('b'), tipStatus = document.createElement('span');
  tip.append(tipName, tipStatus);
  figure.append(tip);
  let shown = 0, pointer = 'mouse';

  function hideTip() {
    if (!shown) return;
    shown = 0;
    tip.hidden = true;
  }
  function landNear(x, y, reach) {
    const col = Math.floor(x / pitch), row = Math.floor(y / pitch);
    const span = Math.min(12, Math.max(1, Math.ceil(reach / pitch)));
    let found = 0, best = reach * reach;
    for (let r = Math.max(0, row - span); r <= Math.min(rows - 1, row + span); r++) {
      for (let c = Math.max(0, col - span); c <= Math.min(cols - 1, col + span); c++) {
        const value = cells[r * cols + c];
        if (!value) continue;
        const d = (px(c) - x) ** 2 + (px(r) - y) ** 2;
        if (d <= best) { best = d; found = value; }
      }
    }
    return found;
  }
  function point(event) {
    if (!pitch) return;
    const box = canvas.getBoundingClientRect();
    const x = event.clientX - box.left, y = event.clientY - box.top;
    const value = landNear(x, y, pointer === 'mouse' ? Math.max(pitch, 7) : 20);
    if (!value) { hideTip(); return; }
    if (value !== shown) {
      const code = grid.codes[value - 1];
      const country = scene.byValue.get(value);
      tipName.textContent = nameOf(code);
      tipStatus.textContent = (country && captions.get(code)?.status) || nextLabel;
      tipName.hidden = !tipName.textContent;
      shown = value;
      tip.hidden = false;
    }
    // Keep the bubble inside the map.
    const w = tip.offsetWidth, h = tip.offsetHeight;
    const left = Math.min(Math.max(x - w / 2, 0), Math.max(0, width - w));
    const top = y - h - 12 >= 0 ? y - h - 12 : Math.min(y + 16, Math.max(0, height - h));
    tip.style.left = `${canvas.offsetLeft + left}px`;
    tip.style.top = `${canvas.offsetTop + top}px`;
  }
  canvas.addEventListener('pointerdown', event => { pointer = event.pointerType || 'mouse'; });
  canvas.addEventListener('pointermove', event => {
    pointer = event.pointerType || 'mouse';
    if (pointer !== 'touch') point(event);
  });
  canvas.addEventListener('pointerleave', event => { if (event.pointerType !== 'touch') hideTip(); });
  canvas.addEventListener('click', point);
  document.addEventListener('pointerdown', event => { if (event.target !== canvas) hideTip(); });

  const onResize = () => {
    if (!resize()) return;
    hideTip();
    needsPaint = true;
    lastDraw = -1e9;
    sync();
  };
  if (typeof ResizeObserver !== 'undefined') {
    // A tag changes size when the font arrives or the language changes.
    const retag = new ResizeObserver(placePins);
    for (const pin of pins.values()) retag.observe(pin);
    new ResizeObserver(onResize).observe(canvas);
  }
  // Page zoom changes devicePixelRatio and fires `resize`; resize() does nothing when nothing changed.
  if (typeof addEventListener === 'function') addEventListener('resize', onResize);
  // Moving the window to another screen changes the ratio without a resize: watch it with a re-armed media query.
  const watchRatio = () => {
    try {
      matchMedia(`(resolution: ${globalThis.devicePixelRatio || 1}dppx)`).addEventListener?.('change', () => { onResize(); watchRatio(); }, { once: true });
    } catch { /* no matchMedia: zoom still reaches the resize listener */ }
  };
  watchRatio();

  if (typeof IntersectionObserver !== 'undefined') {
    new IntersectionObserver(entries => {
      const entry = entries[entries.length - 1];
      onScreen = entry.isIntersecting;
      // The lights come on once, the first time enough of the map is in view.
      if (entry.isIntersecting && entry.intersectionRatio >= 0.345) started = true;
      sync();
    }, { threshold: [0, 0.35] }).observe(canvas);
  } else {
    onScreen = true;
    started = true;
  }
  document.addEventListener('visibilitychange', sync);
  if (reduced.addEventListener) reduced.addEventListener('change', sync);
  if (typeof MutationObserver !== 'undefined') new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-motion'] });

  resize();
  sync();
}

// Without the grid or a 2D context nothing is drawn: the canvas is hidden and the words under the map stand on their own.
export function mountWorldLights() {
  const figures = [...document.querySelectorAll('[data-world-lights]')].filter(figure => figure.dataset.worldLights !== 'on');
  if (!figures.length) return Promise.resolve();
  const drop = figure => { figure.dataset.worldLights = 'unavailable'; };
  return loadGrid().then(grid => {
    for (const figure of figures) {
      try { mount(figure, grid); figure.dataset.worldLights = 'on'; } catch { drop(figure); }
    }
  }).catch(() => figures.forEach(drop));
}
