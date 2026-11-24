// Fixed "stage" behind the page: an exact grid of dots whose brightness follows slow lights.
// The lights live in page ("world") coordinates that scroll at PARALLAX x the page, like one distant backdrop.
// The canvas holds one pixel per grid cell; CSS scales it up and masks each cell to a round dot.
// Everything that moves is large and soft: the lights drift, some cross the middle of the screen, and each one
// sends slow rings outward. Nothing small blinks, so no dot ever sits next to a word like a stray mark.
const PITCH = 6;
const FRAME_MS = 1000 / 20;
const PARALLAX = 0.3;
const GRAIN_ROWS = 256;
const SPARE_PX = 120;
const BODY_HALF = 600;
const INTRO_SECONDS = 1.8;
const CUTOFF_U2 = 1.6 * 1.6;
const LUT_SIZE = 1024;
const LUT_SCALE = LUT_SIZE / CUTOFF_U2;
const LUT = new Float32Array(LUT_SIZE + 1);
for (let i = 0; i <= LUT_SIZE; i++) LUT[i] = Math.exp(-2.2 * (i / LUT_SCALE));

const BASE = { color: [137, 152, 180], alpha: 0.045 };
const HAZE_DIV = 4;
const VIOLET = [164, 135, 255], CYAN = [89, 223, 241], MINT = [111, 241, 174];
// How far and how fast the lights drift (multipliers on each light's own sway and periods), and their rings.
const SWAY = 2.4, TEMPO = 0.38, RIPPLE = 0.22, RIPPLE_SPEED = 1.5;
// How much of the glow shows over the text column of a wide screen, and over a narrow screen that has no margins.
const CENTRE_GLOW = 0.3, NARROW_GLOW = 0.42;

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

const smooth = x => { const v = Math.min(1, Math.max(0, x)); return v * v * (3 - 2 * v); };
const light = (color, x, y, radius, gain, sway, periods, phase, wave = 0) => ({ color, x, y, radius, gain, sway, periods, phase, wave });

// Lights in world coordinates: x in screen widths, y in screen heights (0..1 is the first screen).
function buildLights(hero, docHeight, vh) {
  const list = hero
    ? [light(VIOLET, 0.88, 0.40, 0.60, 0.85, [0.05, 0.07], [47, 61], 0, 0.10),
       light(MINT, 0.02, 0.02, 0.36, 0.70, [0.03, 0.03], [43, 57], 4.1),
       light(CYAN, 0.98, 0.94, 0.40, 0.50, [0.04, 0.04], [39, 53], 1.9)]
    : [light(MINT, -0.10, 0.12, 0.50, 0.65, [0.03, 0.03], [43, 57], 4.1),
       light(VIOLET, 1.10, 0.34, 0.52, 0.70, [0.05, 0.07], [47, 61], 0, 0)];
  const reach = 1 + Math.max(0, docHeight - vh) * PARALLAX / vh + 0.6;
  for (let i = 0, y = hero ? 1.55 : 0.95; y <= reach; i++, y += 0.62) {
    const right = i % 2 === 1;
    const color = right ? VIOLET : (Math.floor(i / 2) % 2 === 0 ? MINT : CYAN);
    list.push(light(color, right ? 1.08 : -0.08, y, 0.48, 0.62, [0.03, 0.05], [39 + 7 * (i % 4), 53 + 5 * (i % 3)], i * 1.7));
  }
  // Wanderers: one dim light per screen height that crosses the middle from side to side, so the field moves behind the text too.
  for (let i = 0, y = 0.45; y <= reach; i++, y += 0.9) {
    list.push(light(i % 2 === 0 ? CYAN : VIOLET, 0.5, y, 0.5, 0.62, [0.14, 0.05], [84 + 9 * (i % 3), 101 + 7 * (i % 2)], i * 2.3 + 0.8));
  }
  return list;
}

export function mountStage() {
  if (matchMedia('(forced-colors: active)').matches || matchMedia('(prefers-contrast: more)').matches) return;
  const host = document.querySelector('[data-stage]');
  const canvas = host && host.querySelector('canvas');
  const ctx = canvas && canvas.getContext('2d');
  if (!ctx) return;
  canvas.classList.add('stage-dots');
  // Haze layer sits below the dots, low resolution and stretched smoothly by CSS (never translated).
  const haze = document.createElement('canvas');
  haze.className = 'stage-haze';
  const hctx = haze.getContext('2d');
  if (hctx) host.insertBefore(haze, canvas);
  canvas.style.willChange = 'transform';

  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const hasHero = !!document.querySelector('.product-hero');

  let cols = 0, rows = 0, hcols = 0, hrows = 0, image = null, himage = null, grain = null;
  let lights = [], docHeight = 0, count = 0, baseW = 0, baseH = 0, kcol = null, hkcol = null, cost = 0, resizeRaf = 0;
  let dx2 = [], dy2 = [], hdx2 = [], hdy2 = [];
  let lx, ly, inv, gain, wave, act;
  let t = 0, introT = 0, last = 0, lastDraw = -1e9, lastScroll = -1, raf = 0;

  // Motion is off for the OS reduced-motion setting and for the page's own pause control (data-motion="off").
  const still = () => reducedQuery.matches || document.documentElement.dataset.motion === 'off';
  const aspect = () => baseW / Math.max(1, baseH);
  const portrait = () => aspect() < 0.8;
  const parallax = () => (still() ? 0 : PARALLAX);
  // Columns over the body column stay quiet (k = 0) so text keeps its contrast; the side margins can glow (k = 1).
  const quietFactor = x => {
    const half = Math.min(baseW / 2, BODY_HALF);
    if (baseW / 2 <= BODY_HALF) return NARROW_GLOW;
    // The glow grows gradually from inside the text column out to the edge, so no vertical band edge shows.
    return Math.max(CENTRE_GLOW, smooth((Math.abs(x - baseW / 2) - (half - 120)) / 300));
  };
  const scrollNow = () => Math.max(0, globalThis.scrollY || 0);

  function allocLights() {
    lights = buildLights(hasHero && !portrait(), docHeight, Math.max(1, baseH));
    count = lights.length;
    lx = new Float32Array(count); ly = new Float32Array(count); inv = new Float32Array(count);
    gain = new Float32Array(count); wave = new Float32Array(count); act = new Int32Array(count);
    dx2 = lights.map(() => new Float32Array(cols));
    dy2 = lights.map(() => new Float32Array(rows));
    hdx2 = lights.map(() => new Float32Array(hcols));
    hdy2 = lights.map(() => new Float32Array(hrows));
  }

  function measureDoc() {
    return Math.max(baseH, document.documentElement.scrollHeight || 0);
  }

  // Rebuilds the grid only when the width changes or the height moves by more than a mobile address bar (120px).
  function size() {
    if (baseW && innerWidth === baseW && Math.abs(innerHeight - baseH) <= SPARE_PX) return false;
    baseW = innerWidth;
    baseH = innerHeight;
    cols = Math.max(1, Math.ceil(baseW / PITCH));
    rows = Math.max(1, Math.ceil(baseH / PITCH)) + Math.ceil(SPARE_PX / PITCH);
    canvas.width = cols;
    canvas.height = rows;
    canvas.style.width = cols * PITCH + 'px';
    canvas.style.height = rows * PITCH + 'px';
    image = ctx.createImageData(cols, rows);
    const rand = seededRandom(20261124);
    grain = new Float32Array(cols * GRAIN_ROWS);
    for (let i = 0; i < grain.length; i++) grain[i] = 0.7 + 0.3 * rand();
    kcol = new Float32Array(cols);
    for (let c = 0; c < cols; c++) kcol[c] = quietFactor((c + 0.5) * PITCH);
    if (hctx) {
      // A zero-size window (hidden tab, collapsed frame) must not produce an empty ImageData, which throws.
      hcols = Math.max(1, Math.ceil(cols / HAZE_DIV));
      hrows = Math.max(1, Math.ceil(Math.ceil(baseH / PITCH) / HAZE_DIV));
      haze.width = hcols;
      haze.height = hrows;
      himage = hctx.createImageData(hcols, hrows);
      hkcol = new Float32Array(hcols);
      for (let c = 0; c < hcols; c++) hkcol[c] = quietFactor((c + 0.5) / hcols * baseW);
    }
    docHeight = measureDoc();
    allocLights();
    return true;
  }

  function refreshDoc() {
    const h = measureDoc();
    if (h === docHeight) return;
    docHeight = h;
    allocLights();
    lastDraw = -1e9;
  }

  // Fills one layer: for every cell, the summed light strength, colour-averaged, written as RGBA.
  function draw(scroll) {
    const t0 = performance.now();
    const data = image.data;
    const asp = aspect();
    const vw = Math.max(1, baseW), vh = Math.max(1, baseH);
    const intro = still() ? 1 : smooth(introT / INTRO_SECONDS);
    const tone = portrait() ? 0.6 : 1;
    const worldPx = scroll * parallax();
    const offset = worldPx % PITCH;
    const worldRow = Math.floor(worldPx / PITCH);
    const shift = worldPx / vh;
    const rscale = Math.min(asp, 1);
    let na = 0;
    for (let k = 0; k < count; k++) {
      const L = lights[k];
      const radius = L.radius * rscale;
      const x = L.x + SWAY * L.sway[0] * Math.sin(2 * Math.PI * t / (L.periods[0] * TEMPO) + L.phase);
      const y = L.y + SWAY * L.sway[1] * Math.cos(2 * Math.PI * t / (L.periods[1] * TEMPO) + L.phase) - shift;
      if (y + 1.6 * radius < 0 || y - 1.6 * radius > 1) continue;
      lx[k] = x; ly[k] = y;
      inv[k] = 1 / (radius * radius);
      gain[k] = L.gain * tone * intro * (0.8 + 0.2 * Math.sin(t / 3.2 + L.phase));
      wave[k] = Math.max(L.wave, RIPPLE);
      act[na++] = k;
      const cxs = dx2[k], cys = dy2[k];
      for (let c = 0; c < cols; c++) { const d = ((c + 0.5) * PITCH / vw - x) * asp; cxs[c] = d * d; }
      for (let r = 0; r < rows; r++) { const d = ((r + 0.5) * PITCH - offset) / vh - y; cys[r] = d * d; }
      if (hctx) {
        const hx = hdx2[k], hy = hdy2[k];
        for (let c = 0; c < hcols; c++) { const d = ((c + 0.5) / hcols - x) * asp; hx[c] = d * d; }
        for (let r = 0; r < hrows; r++) { const d = (r + 0.5) / hrows - y; hy[r] = d * d; }
      }
    }
    if (hctx) {
      const hd = himage.data;
      let j = 0;
      for (let r = 0; r < hrows; r++) {
        for (let c = 0; c < hcols; c++, j++) {
          let sum = 0, R = 0, G = 0, B = 0;
          for (let a = 0; a < na; a++) {
            const k = act[a];
            if (gain[k] < 0.001) continue;
            const u2 = (hdx2[k][c] + hdy2[k][r]) * inv[k];
            if (u2 > CUTOFF_U2) continue;
            let w = gain[k] * LUT[(u2 * LUT_SCALE) | 0];
            if (wave[k] > 0.001) w *= 1 + wave[k] * Math.cos(Math.sqrt(u2) * 9 - t * RIPPLE_SPEED);
            const col = lights[k].color;
            sum += w; R += col[0] * w; G += col[1] * w; B += col[2] * w;
          }
          const o = j << 2;
          if (sum > 0) { hd[o] = R / sum; hd[o + 1] = G / sum; hd[o + 2] = B / sum; }
          else { hd[o] = hd[o + 1] = hd[o + 2] = 0; }
          const hk = hkcol[c], ha = 0.10 + 0.14 * hk;
          hd[o + 3] = Math.min(ha, sum * ha) * 255;
        }
      }
      hctx.putImageData(himage, 0, 0);
    }
    const br = BASE.color[0] * BASE.alpha, bg = BASE.color[1] * BASE.alpha, bb = BASE.color[2] * BASE.alpha;
    let i = 0;
    for (let r = 0; r < rows; r++) {
      const grainBase = ((r + worldRow) % GRAIN_ROWS) * cols;
      for (let c = 0; c < cols; c++, i++) {
        let sum = 0, R = br, G = bg, B = bb;
        for (let a = 0; a < na; a++) {
          const k = act[a];
          if (gain[k] < 0.001) continue;
          const u2 = (dx2[k][c] + dy2[k][r]) * inv[k];
          if (u2 > CUTOFF_U2) continue;
          let w = gain[k] * LUT[(u2 * LUT_SCALE) | 0];
          if (wave[k] > 0.001) w *= 1 + wave[k] * Math.cos(Math.sqrt(u2) * 9 - t * RIPPLE_SPEED);
          const col = lights[k].color;
          sum += w; R += col[0] * w; G += col[1] * w; B += col[2] * w;
        }
        const total = BASE.alpha + sum;
        const o = i << 2;
        data[o] = R / total;
        data[o + 1] = G / total;
        data[o + 2] = B / total;
        const k = kcol[c];
        data[o + 3] = Math.min(0.20 + 0.65 * k, BASE.alpha + sum * (0.17 + 0.68 * k)) * grain[grainBase + c] * 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    canvas.style.transform = 'translate3d(0,' + (-offset) + 'px,0)';
    lastScroll = scroll;
    cost = cost * 0.7 + (performance.now() - t0) * 0.3;
  }

  // The loop reads scrollY every frame (no scroll listener): repaint at once when it moved, else at 20 fps.
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    t += dt;
    introT += dt;
    const scroll = scrollNow();
    // Back off when drawing is expensive (4K, large windows): scrolling needs 2x the draw time between paints, idle needs 8x.
    const gap = now - lastDraw;
    if (scroll !== lastScroll ? gap >= cost * 2 : gap >= Math.max(FRAME_MS - 2, cost * 8)) {
      lastDraw = now;
      draw(scroll);
    }
  }

  function start() {
    if (raf || still() || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  // Reduced motion: no loop, no parallax; one still frame of the first screen at t = 0.
  function drawStill() {
    t = 0;
    draw(0);
  }
  function redraw() {
    if (still()) drawStill();
    else draw(scrollNow());
  }

  function applyMotionPreference() {
    stop();
    if (still()) {
      canvas.style.transform = '';
      allocLights();
      drawStill();
    } else {
      allocLights();
      start();
    }
  }

  size();
  redraw();

  addEventListener('resize', () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; size(); redraw(); });
  });
  addEventListener('load', () => { refreshDoc(); });
  if (typeof ResizeObserver !== 'undefined' && document.body) new ResizeObserver(refreshDoc).observe(document.body);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reducedQuery.addEventListener('change', applyMotionPreference);
  if (typeof MutationObserver !== 'undefined') new MutationObserver(applyMotionPreference).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });

  if (!still()) start();
}
