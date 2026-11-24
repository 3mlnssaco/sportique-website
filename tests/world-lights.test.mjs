// The "lights of the world" map: land grid, markup, and the canvas script run against a stand-in DOM.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copy as allCopy } from './support.mjs';

const file = path => new URL(`../${path}`, import.meta.url);
const json = path => JSON.parse(readFileSync(file(path), 'utf8'));
const grid = json('assets/world-grid-20261124.json');
const HANGUL = /[가-힣]/u;

function decodeCells() {
  const cells = new Uint8Array(grid.cols * grid.rows);
  let at = 0;
  for (const run of grid.cells.split(',')) {
    const [value, count = '1'] = run.split('*');
    cells.fill(parseInt(value, 36), at, at + parseInt(count, 36));
    at += parseInt(count, 36);
  }
  return { cells, at };
}
function cellsOf(code) {
  const { cells } = decodeCells();
  const value = grid.codes.indexOf(code) + 1;
  const list = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== value) continue;
    const col = i % grid.cols, row = (i - col) / grid.cols;
    list.push({ col, row, lon: (col + 0.5) * grid.cell * 0.36 - 180, lat: 90 - (grid.y0 + (row + 0.5) * grid.cell) * 0.36 });
  }
  return list;
}

test('the land grid is small, covers 84N to 58S and puts countries where they are', () => {
  assert.ok(readFileSync(file('assets/world-grid-20261124.json')).length < 20000);
  assert.equal(grid.cols, 200);
  const { cells, at } = decodeCells();
  assert.equal(at, grid.cols * grid.rows);
  assert.equal(grid.codes.length, grid.centers.length);
  assert.ok(!grid.codes.includes('AQ'));
  const north = 90 - grid.y0 * 0.36, south = 90 - (grid.y0 + grid.rows * grid.cell) * 0.36;
  assert.ok(north <= 85 && north >= 83 && south >= -59 && south <= -57, `${north} ${south}`);
  const land = cells.filter(Boolean).length;
  assert.ok(land > 4000 && land < 5600, String(land));
  for (let value = 1; value <= grid.codes.length; value++) assert.ok(cells.includes(value), grid.codes[value - 1]);

  const within = (code, [west, east], [southLat, northLat], [least, most]) => {
    const list = cellsOf(code);
    assert.ok(list.length >= least && list.length <= most, `${code} has ${list.length} cells`);
    const inBox = list.filter(c => c.lon >= west && c.lon <= east && c.lat >= southLat && c.lat <= northLat).length;
    assert.ok(inBox >= list.length * 0.85, `${code}: ${inBox} of ${list.length} cells in its box`);
  };
  within('KR', [124, 131], [33, 39], [3, 6]);
  within('MN', [87, 120], [41, 53], [45, 70]);
  within('US', [-170, -66], [18, 72], [280, 400]);
  within('BR', [-74, -34], [-34, 6], [180, 260]);
  within('AU', [112, 154], [-44, -10], [180, 250]);
  within('FJ', [176, 180], [-20, -15], [1, 2]);
  within('JP', [128, 146], [30, 46], [10, 24]);
  for (const entry of json('scripts/world-lights.json').lit) assert.ok(grid.codes.includes(entry.code), entry.code);
});

test('the countries in preparation are on the grid, are not lit, and carry the fixed status word', () => {
  const { lit, soon } = json('scripts/world-lights.json');
  assert.deepEqual(soon.map(entry => entry.code), ['MN', 'US']);
  assert.deepEqual(lit.map(entry => entry.code), ['KR']);
  for (const entry of soon) {
    assert.ok(grid.codes.includes(entry.code), entry.code);
    assert.ok(!lit.some(one => one.code === entry.code), `${entry.code} is both lit and in preparation`);
    assert.equal(entry.status, '준비 중');
  }
});

test('the markup keeps every word translatable and puts no Korean in data attributes', async () => {
  const { worldLights } = await import('../scripts/site/world-lights.mjs');
  const html = worldLights();
  // Words shared with other pieces ("준비 중") are translated once, in their own file: look in every copy file.
  const copy = allCopy;
  assert.match(html, /^<figure class="world-lights" data-world-lights data-lit='\[\{"code":"KR","order":1\}\]'>/);
  assert.match(html, /<canvas role="img" aria-label="세계 지도\. [^"]+"><\/canvas>/);
  assert.ok(html.includes('aria-label="세계 지도. 불이 켜진 나라는 지금 서비스가 닿은 곳, 깜빡이는 나라는 준비 중인 곳이고, 나머지는 앞으로 켤 곳입니다."'));
  const legend = [...html.match(/<ul class="world-lights-legend">(.*?)<\/ul>/)[1].matchAll(/<li>(.*?)<\/li>/g)].map(m => m[1]);
  assert.deepEqual(legend, [
    '<i class="world-lights-dot world-lights-dot--lit" aria-hidden="true"></i><span>켜진 곳</span>',
    '<i class="world-lights-dot world-lights-dot--soon" aria-hidden="true"></i><span>준비 중</span>',
    '<i class="world-lights-dot" aria-hidden="true"></i><span data-next>앞으로 켤 곳</span>',
  ]);
  const listed = [...html.match(/<ul class="world-lights-list">(.*?)<\/ul>/)[1].matchAll(/<li ([^>]+)><b>([^<]+)<\/b> <span>([^<]+)<\/span><\/li>/g)].map(m => m.slice(1));
  assert.deepEqual(listed, [['data-code="KR"', '대한민국', 'UniQdata 서비스 중'], ['data-soon="MN"', '몽골', '준비 중'], ['data-soon="US"', '미국', '준비 중']]);
  const tags = [...html.matchAll(/<div class="world-lights-pin world-lights-pin--soon" data-soon="([A-Z]+)" aria-hidden="true"><b>([^<]+)<\/b><span>([^<]+)<\/span><\/div>/g)].map(m => m.slice(1));
  assert.deepEqual(tags, [['MN', '몽골', '준비 중'], ['US', '미국', '준비 중']]);
  assert.ok(html.indexOf('world-lights-pin" data-code="KR"') < html.indexOf('data-soon="MN" aria-hidden'), 'soon tags come after the lit ones');
  assert.ok(html.includes('<span data-next>앞으로 켤 곳</span>'));
  assert.ok(html.includes('<li data-code="KR"><b>대한민국</b> <span>UniQdata 서비스 중</span></li>'));
  assert.ok(html.includes('<div class="world-lights-pin" data-code="KR" aria-hidden="true"><b>대한민국</b><span>UniQdata 서비스 중</span></div>'));
  for (const tag of html.match(/<[^>]+>/g)) assert.doesNotMatch(tag.replace(/\saria-label="[^"]*"/, ''), HANGUL, tag);
  const words = [...html.matchAll(/>([^<]+)</g)].map(m => m[1].trim()).filter(Boolean).concat(html.match(/aria-label="([^"]*)"/)[1]);
  for (const word of words) assert.ok(Object.hasOwn(copy, word), `no English for: ${word}`);
  const base = json('scripts/english-copy.json');
  for (const key of Object.keys(json('scripts/english-copy.d/world-lights.json'))) assert.ok(!Object.hasOwn(base, key), `duplicate key: ${key}`);
});

test('the build refuses a country in preparation with another status, an unknown or off-grid code, or one that is also lit', async () => {
  const { worldLights } = await import('../scripts/site/world-lights.mjs');
  const base = json('scripts/world-lights.json');
  const offGrid = JSON.parse(readFileSync(file('assets/world-countries-20260921.json'), 'utf8')).countries.map(c => c.code).find(code => !grid.codes.includes(code));
  assert.ok(offGrid, 'a country with a name but no cell');
  const bad = [
    [{ code: 'MN', status: 'UniQdata 서비스 중' }, /준비 중/],
    [{ code: 'MN', status: '준비중' }, /준비 중/],
    [{ code: 'MN' }, /준비 중/],
    [{ code: 'ZZ', status: '준비 중' }, /unknown country code/],
    [{ code: offGrid, status: '준비 중' }, /no cell/],
    [{ code: 'KR', status: '준비 중' }, /listed twice/],
    [{ code: 'MN', status: '준비 중' }, /listed twice/, [{ code: 'MN', status: '준비 중' }]],
  ];
  for (const [entry, message, more = []] of bad) assert.throws(() => worldLights({ ...base, soon: [entry, ...more] }), message, JSON.stringify(entry));
  assert.doesNotThrow(() => worldLights({ ...base, soon: [] }));
  assert.ok(!worldLights({ ...base, soon: [] }).includes('data-soon'));
});

// --- A stand-in DOM: just enough for assets/world-lights-20261124.js to run and be watched. ---
const WIDTH = 1200, PITCH = WIDTH / 200;
const at = (col, row) => ({ clientX: (col + 0.5) * PITCH, clientY: (row + 0.5) * PITCH });

const LIT_DOT = 'rgb(190,255,224)';
// Dots painted again over the base layer by the rings: plain rgb() fills that are not the lit country's own dots.
const isRipple = style => typeof style === 'string' && style.startsWith('rgb(') && style !== LIT_DOT;

function fakeContext(log) {
  const state = { fillStyle: '', strokeStyle: '', globalAlpha: 1 };
  const count = name => { log[name] = (log[name] || 0) + 1; };
  let lastArc = null;
  // What the beacons of countries in preparation paint, with the frame (number of clearRect calls so far) each belongs to.
  log.gradients = []; log.cores = []; log.rings = []; log.tints = []; log.whites = [];
  return new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'createRadialGradient') return (x, y, r0, x1, y1, r1) => {
        count('glow');
        const entry = { frame: log.clearRect || 0, x, y, r: r1, stops: [] };
        log.gradients.push(entry);
        return { addColorStop(at, color) { entry.stops.push(color); } };
      };
      if (key === 'clearRect') return () => { count('clearRect'); (log.frames ??= []).push([]); };
      if (key === 'arc') return (x, y, r) => {
        count('arc'); lastArc = [x, y, r];
        // The bright dots of a beacon (the ring is drawn with the same fill style still set, but with a wide radius).
        const style = String(target.fillStyle);
        if (style.startsWith('rgba(190,255,224,') && r < PITCH) log.cores.push({ frame: log.clearRect || 0, x, y, alpha: parseFloat(style.split(',')[3]) });
      };
      if (key === 'fill') return () => {
        count('fill'); count(`fill ${target.fillStyle}`);
        const frame = log.clearRect || 0, style = String(target.fillStyle);
        if (/^rgba\(111,241,174,0\.\d{3}\)$/.test(style)) log.tints.push({ frame, alpha: parseFloat(style.split(',')[3]) });
        if (style === '#fff') log.whites.push({ x: lastArc[0], y: lastArc[1] });
        if (isRipple(target.fillStyle) && lastArc && log.frames?.length) log.frames.at(-1).push({ x: lastArc[0], y: lastArc[1], alpha: target.globalAlpha });
      };
      if (key === 'stroke') return () => {
        count('stroke'); count(`stroke ${target.strokeStyle}`);
        const style = String(target.strokeStyle);
        if (/^rgba\(111,241,174,\d\.\d{3}\)$/.test(style) && lastArc) log.rings.push({ frame: log.clearRect || 0, x: lastArc[0], y: lastArc[1], r: lastArc[2], alpha: parseFloat(style.split(',')[3]) });
      };
      return () => { count(String(key)); };
    },
    set(target, key, value) { target[key] = value; return true; },
  });
}

class Node {
  constructor(tag) { this.tagName = tag; this.dataset = {}; this.classes = new Set(); this.classList = { toggle: (name, on) => { if (on) this.classes.add(name); else this.classes.delete(name); } }; this.style = { setProperty: (name, value) => { this.style[name] = value; } }; this.kids = []; this.listeners = {}; this.hidden = false; this.textContent = ''; this.offsetWidth = 150; this.offsetHeight = 32; }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  fire(type, event = {}) { for (const fn of this.listeners[type] || []) fn(event); }
  setAttribute() {}
  append(...nodes) { this.kids.push(...nodes); }
}

function world({ lit = [{ code: 'KR', order: 1 }], captions = { KR: ['대한민국', 'UniQdata 서비스 중'] }, soon = {}, width = WIDTH, pinWidths = {}, pinWidth = 150, next = '앞으로 켤 곳', lang = 'ko', reduced = false, motion, context = true, fetchOk = true } = {}) {
  const log = {};
  const env = { log, frames: [], cancelled: 0, requested: 0, observers: {}, now: 0 };
  const canvas = new Node('canvas');
  Object.assign(canvas, { clientWidth: width, offsetLeft: 0, offsetTop: 0, getContext: () => (context ? (canvas.ctx ??= fakeContext(log)) : null), getBoundingClientRect: () => ({ left: 0, top: 0 }) });
  const items = Object.entries(captions).map(([code, [name, status]]) => {
    const li = new Node('li');
    li.dataset.code = code;
    li.querySelector = selector => ({ textContent: selector === 'b' ? name : status });
    return li;
  });
  const soonItems = Object.entries(soon).map(([code, [name, status]]) => {
    const li = new Node('li');
    li.dataset.soon = code;
    li.querySelector = selector => ({ textContent: selector === 'b' ? name : status });
    return li;
  });
  const figure = new Node('figure');
  figure.dataset.worldLights = '';
  figure.dataset.lit = JSON.stringify(lit);
  figure.querySelector = selector => (selector === 'canvas' ? canvas : selector === '[data-next]' ? { textContent: next } : null);
  const pins = Object.keys(captions).map(code => {
    const pin = new Node('div');
    pin.dataset.code = code;
    pin.offsetWidth = pinWidths[code] ?? pinWidth;
    return pin;
  });
  const soonPins = Object.keys(soon).map(code => {
    const pin = new Node('div');
    pin.dataset.soon = code;
    pin.offsetWidth = pinWidths[code] ?? pinWidth;
    return pin;
  });
  figure.querySelectorAll = selector => (selector === '.world-lights-pin' ? [...pins, ...soonPins] : selector.includes('data-soon') ? soonItems : items);
  const root = new Node('html');
  root.lang = lang;
  if (motion) root.dataset.motion = motion;
  const media = { matches: reduced, addEventListener(type, fn) { media.change = fn; } };
  const doc = new Node('document');
  Object.assign(doc, {
    documentElement: root, hidden: false,
    querySelectorAll: () => [figure],
    createElement: tag => { const node = new Node(tag); if (tag === 'canvas') node.getContext = () => fakeContext({}); return node; },
  });
  const observer = name => class { constructor(fn) { env.observers[name] = fn; } observe() {} };
  Object.assign(globalThis, {
    document: doc,
    matchMedia: () => media,
    devicePixelRatio: 2,
    fetch: async () => (fetchOk ? { ok: true, json: async () => json('assets/world-grid-20261124.json') } : { ok: false }),
    requestAnimationFrame: fn => { env.requested++; env.frames.push(fn); return env.requested; },
    cancelAnimationFrame: () => { env.cancelled++; env.frames.length = 0; },
    ResizeObserver: observer('resize'), IntersectionObserver: observer('intersection'), MutationObserver: observer('mutation'),
  });
  Object.assign(env, { canvas, figure, root, doc, media, pins, soonPins });
  env.tip = () => figure.kids[0];
  env.see = (ratio = 0.6) => env.observers.intersection([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]);
  // Runs the animation loop for `seconds` of animated time in steps of `ms`.
  env.run = (seconds, ms = 16) => {
    env.now ||= performance.now();
    for (let passed = 0; passed < seconds * 1000 && env.frames.length; passed += ms) {
      env.now += ms;
      env.frames.shift()(env.now);
    }
  };
  return env;
}

let loads = 0;
const load = async () => (await import(`../assets/world-lights-20261124.js?run=${++loads}`)).mountWorldLights;
const MINT_DOTS = `fill ${LIT_DOT}`, PEOPLE = 'fill #fff', RECORDS = 'stroke rgba(111,241,174,.35)', ARCS = 'stroke rgba(237,243,255,.28)';
const travellers = log => Object.keys(log).filter(key => key.startsWith('fill rgba(255,255,255,')).reduce((sum, key) => sum + log[key], 0);

test('one lit country: dark until seen, then the light, its people and their records, and no line between countries', async () => {
  const env = world();
  await (await load())();
  assert.equal(env.figure.dataset.worldLights, 'on');
  assert.equal(env.canvas.width, WIDTH * 2);
  assert.equal(env.canvas.height, Math.round(WIDTH * grid.rows / grid.cols * 2));
  assert.equal(env.log.clearRect, 1, 'one unlit picture before it is seen');
  assert.equal(env.requested, 0, 'no loop before it is seen');
  assert.ok(!env.log.glow && !env.log[MINT_DOTS] && !env.log[PEOPLE]);

  env.see(0.2);
  assert.equal(env.requested, 0, 'less than 35% in view does not start it');
  env.see(0.6);
  assert.equal(env.requested, 1);
  env.run(4);
  assert.ok(env.log.glow > 0 && env.log[MINT_DOTS] > 0 && env.log[PEOPLE] > 0 && env.log[RECORDS] > 0);
  assert.ok(!env.log[ARCS], 'a single country has nobody to cross to');

  // After the lights are on the rings keep it moving, painted at most 30 times a second.
  const before = env.log.clearRect;
  env.run(2);
  const paints = env.log.clearRect - before;
  assert.ok(paints >= 50 && paints <= 64, `${paints} paints in 2 s of rings`);
  env.run(24);
  assert.equal(travellers(env.log), 0);

  env.doc.hidden = true;
  env.doc.fire('visibilitychange');
  assert.equal(env.frames.length, 0, 'hidden tab stops the loop');
  const paused = env.log.clearRect;
  env.see(0);
  env.doc.hidden = false;
  env.doc.fire('visibilitychange');
  assert.equal(env.frames.length, 0, 'off screen stays stopped');
  assert.equal(env.log.clearRect, paused);
  env.see(0.6);
  assert.equal(env.frames.length, 1);
});

test('two lit countries: people are tied across and a light crosses each tie now and then', async () => {
  const env = world({ lit: [{ code: 'KR', order: 1 }, { code: 'MN', order: 2 }] });
  await (await load())();
  env.see();
  env.run(0.5);
  assert.ok(env.log.glow > 0);
  assert.ok(!env.log[PEOPLE], 'people come after the lights');
  env.run(5.5);
  assert.ok(env.log[PEOPLE] > 0 && env.log[RECORDS] > 0 && env.log[ARCS] > 0);
  env.run(30);
  assert.ok(travellers(env.log) > 0, 'a light crossed');
  // A crossing lasts 3.2 s and each tie sees one every 7 to 11 s: far fewer sparks than paints.
  assert.ok(travellers(env.log) < env.log.clearRect * 3 * 0.6);
});

test('reduced motion: one still picture with everything lit and no loop', async () => {
  const env = world({ lit: [{ code: 'KR', order: 1 }, { code: 'MN', order: 2 }], reduced: true });
  await (await load())();
  assert.equal(env.log.clearRect, 1);
  assert.ok(env.log.glow === 2 && env.log[MINT_DOTS] === 2 && env.log[PEOPLE] > 0 && env.log[RECORDS] === 1 && env.log[ARCS] > 0);
  assert.equal(env.log.frames.flat().length, 0, 'no ring in a still picture');
  assert.ok(env.pins.every(pin => pin.classes.has('is-on')), 'name tags show from the start');
  assert.equal(travellers(env.log), 0);
  env.see();
  env.doc.fire('visibilitychange');
  assert.equal(env.requested, 0);
  assert.equal(env.log.clearRect, 1, 'a still picture is not painted again');
  env.canvas.clientWidth = 800;
  env.observers.resize();
  assert.equal(env.log.clearRect, 2, 'except when its size changes');
  assert.equal(env.requested, 0);
});

test('the motion switch (html[data-motion=off]) is followed both ways', async () => {
  const env = world({ motion: 'off' });
  await (await load())();
  env.see();
  assert.equal(env.requested, 0);
  assert.equal(env.log.clearRect, 1);
  assert.ok(env.log.glow === 1 && env.log[PEOPLE] > 0);

  delete env.root.dataset.motion;
  env.observers.mutation();
  assert.equal(env.requested, 1, 'motion back on starts the loop');
  env.run(1);
  const running = env.log.clearRect;
  assert.ok(running > 1);

  env.root.dataset.motion = 'off';
  env.observers.mutation();
  assert.equal(env.frames.length, 0);
  assert.equal(env.log.clearRect, running + 1, 'one still picture');
  env.media.matches = true;
  env.media.change();
  assert.equal(env.frames.length, 0);
  assert.equal(env.log.clearRect, running + 1);
});

test('pointing at a country names it and says whether it is lit or next', async () => {
  const env = world();
  await (await load())();
  const tip = env.tip();
  const [name, status] = tip.kids;
  assert.equal(tip.className, 'world-lights-tip');
  assert.equal(tip.hidden, true);

  env.canvas.fire('pointermove', { pointerType: 'mouse', ...at(170, 26) });
  assert.equal(tip.hidden, false);
  assert.deepEqual([name.textContent, status.textContent], ['대한민국', 'UniQdata 서비스 중']);
  env.canvas.fire('pointermove', { pointerType: 'mouse', ...at(155, 20) });
  assert.deepEqual([name.textContent, status.textContent], ['몽골', '앞으로 켤 곳']);
  env.canvas.fire('pointerleave', { pointerType: 'mouse' });
  assert.equal(tip.hidden, true);

  // Touch: a tap shows it, a tap on open sea or anywhere else puts it away; dragging does not.
  env.canvas.fire('pointerdown', { pointerType: 'touch' });
  env.canvas.fire('pointermove', { pointerType: 'touch', ...at(170, 26) });
  assert.equal(tip.hidden, true);
  env.canvas.fire('click', at(170, 26));
  assert.equal(tip.hidden, false);
  env.canvas.fire('click', at(30, 60));
  assert.equal(tip.hidden, true);
  env.canvas.fire('click', at(199, 56));
  assert.equal(tip.hidden, false);
  const left = parseFloat(tip.style.left), top = parseFloat(tip.style.top);
  assert.ok(left >= 0 && left + tip.offsetWidth <= WIDTH, `bubble stays inside: ${left}`);
  assert.ok(top >= 0 && top + tip.offsetHeight <= WIDTH * grid.rows / grid.cols);
  env.doc.fire('pointerdown', { target: {} });
  assert.equal(tip.hidden, true);
  env.canvas.fire('click', at(60, 3));
  assert.ok(parseFloat(tip.style.top) >= 0, 'near the top edge the bubble goes under the point');
});

test('on the English page the bubble speaks English from the translated caption', async () => {
  const env = world({ lang: 'en', captions: { KR: ['South Korea', 'UniQdata live'] }, next: 'Next to light' });
  await (await load())();
  const [name, status] = env.tip().kids;
  env.canvas.fire('click', at(171, 27));
  assert.deepEqual([name.textContent, status.textContent], ['South Korea', 'UniQdata live']);
  env.canvas.fire('click', at(155, 20));
  assert.deepEqual([name.textContent, status.textContent], ['Mongolia', 'Next to light']);
});

test('without the grid or a 2D context it gives up quietly and leaves the caption', async () => {
  const offline = world({ fetchOk: false });
  await (await load())();
  assert.equal(offline.figure.dataset.worldLights, 'unavailable');
  assert.equal(offline.requested, 0);
  const blind = world({ context: false });
  await (await load())();
  assert.equal(blind.figure.dataset.worldLights, 'unavailable');
  assert.equal(blind.requested, 0);
});

test('a ring crosses the dark land and each dot goes back to its own brightness once it has passed', async () => {
  const env = world();
  await (await load())();
  const [cx, cy] = grid.centers[grid.codes.indexOf('KR')];
  // A land cell of another country about 38 cells from Korea (the ring front travels 30 cells a second).
  const target = ['CN', 'MN', 'RU'].flatMap(code => cellsOf(code)).find(c => Math.abs(Math.hypot(c.col - cx, c.row - cy) - 38) < 1);
  assert.ok(target, 'a land cell about 38 cells away');
  const hit = frame => frame.filter(d => Math.abs(d.x - (target.col + 0.5) * PITCH) < 1e-6 && Math.abs(d.y - (target.row + 0.5) * PITCH) < 1e-6);

  env.see();
  const lifted = [];
  // 0.12 s steps would skip frames; use the loop's own pace.
  for (let n = 0; n < 900 && env.frames.length; n++) {
    env.run(0.034, 17);
    const frame = env.log.frames.at(-1);
    lifted.push(frame ? hit(frame).reduce((sum, d) => sum + d.alpha, 0) : 0);
  }
  const first = lifted.findIndex(a => a > 0);
  assert.ok(first > 0, 'nothing is lifted before the ring arrives');
  const peak = Math.max(...lifted);
  assert.ok(peak > 0.3 && peak <= 1, `lifted at most to ${peak}`);
  // The ring arrives, passes, and the dot is not touched again until the next ring (5.2 s later), so a long quiet stretch follows.
  const last = lifted.findLastIndex(a => a > 0);
  assert.ok(last > first, 'the ring passed over it');
  const quiet = lifted.slice(first, last + 1).filter(a => a === 0).length;
  assert.ok(quiet > 30, `the dot returns to its own brightness between rings (${quiet} quiet frames)`);
  // Never more than 30 frames a second.
  assert.ok(env.log.clearRect <= 900 * 0.034 * 30 + 10);
});

test('the name tag sits beside its country, hides until the country lights, and stays inside the map', async () => {
  const env = world({ pinWidth: 100 });
  await (await load())();
  const [pin] = env.pins;
  assert.ok(!pin.classes.has('is-on'), 'hidden before the lights come on');
  const [cx, cy] = grid.centers[grid.codes.indexOf('KR')];
  assert.equal(parseFloat(pin.style.left), (cx + 0.5) * PITCH + 28);
  assert.equal(parseFloat(pin.style.top), (cy + 0.5) * PITCH - 28);
  env.see();
  env.run(2);
  assert.ok(pin.classes.has('is-on'));

  const edge = world({ lit: [{ code: 'FJ', order: 1 }], captions: { FJ: ['피지', 'UniQdata 서비스 중'] } });
  await (await load())();
  const [tag] = edge.pins;
  const left = parseFloat(tag.style.left), top = parseFloat(tag.style.top);
  assert.ok(tag.classes.has('is-left'), 'flipped to the left at the right edge');
  assert.ok(left >= 0 && left + 150 <= WIDTH, `inside the map: ${left}`);
  assert.ok(top - 32 >= 0, `inside the map: ${top}`);
});

// --- Countries in preparation (Mongolia and the United States next to a lit Korea) ---
const SOON = { MN: ['몽골', '준비 중'], US: ['미국', '준비 중'] };
const centreOf = (code, pitch = PITCH) => { const [cx, cy] = grid.centers[grid.codes.indexOf(code)]; return [(cx + 0.5) * pitch, (cy + 0.5) * pitch]; };
const near = (entry, code, cells = 3) => { const [x, y] = centreOf(code); return Math.hypot(entry.x - x, entry.y - y) <= cells * PITCH; };
// The beacon level of one country per painted frame (the brightest of its core dots).
const levels = (log, code) => {
  const byFrame = new Map();
  for (const dot of log.cores.filter(entry => near(entry, code))) byFrame.set(dot.frame, Math.max(byFrame.get(dot.frame) ?? 0, dot.alpha));
  return byFrame;
};

test('countries in preparation get a tint and a beacon but no people, ties, ripple or glow of their own', async () => {
  const env = world({ soon: SOON });
  await (await load())();
  env.see();
  env.run(9);
  const { log } = env;
  const last = log.clearRect;

  // The lit country is unchanged: one glow per painted frame at its centre, its people dots on its own land, no arcs.
  const [kx, ky] = centreOf('KR');
  const glows = place => log.gradients.filter(g => g.frame === last && Math.hypot(g.x - place[0], g.y - place[1]) < 0.5);
  assert.equal(glows([kx, ky]).length, 1);
  assert.ok(glows([kx, ky])[0].r > 7 * PITCH, 'the lit glow is the wide one');
  assert.ok(log[PEOPLE] > 0 && log[RECORDS] > 0);
  const korea = new Set(cellsOf('KR').map(c => `${c.col},${c.row}`));
  assert.ok(log.whites.length > 0 && log.whites.every(w => korea.has(`${Math.floor(w.x / PITCH)},${Math.floor(w.y / PITCH)}`)), 'people only in the lit country');
  assert.ok(!log[ARCS], 'nothing to tie across: one lit country');

  // Each country in preparation: one halo (not a lit glow), a core of dots, a ring. No other glow.
  for (const code of ['MN', 'US']) {
    const own = glows(centreOf(code));
    assert.equal(own.length, 1, `${code}: one halo`);
    assert.equal(own[0].r, 7 * PITCH, `${code}: the halo, not a lit glow`);
    const core = log.cores.filter(entry => entry.frame === last && near(entry, code));
    assert.ok(core.length >= 3, `${code}: core of at least 3 dots`);
    const ring = log.rings.filter(entry => entry.frame === last && near(entry, code, 0.01));
    assert.equal(ring.length, 1, `${code}: one ring`);
    assert.equal(ring[0].r, 3.2 * PITCH);
  }
  assert.equal(log.gradients.filter(g => g.frame === last).length, 3, 'one glow for Korea and two halos');
  assert.equal(log.rings.filter(entry => entry.frame === last).length, 2, 'lit countries have no ring');

  // No ripple starts in the United States (Korea's ring takes about 4 s to get that far): nothing near it in the first seconds.
  const fresh = world({ soon: SOON });
  await (await load())();
  fresh.see();
  fresh.run(3);
  const [ux, uy] = centreOf('US');
  assert.ok(!fresh.log.frames.flat().some(d => Math.hypot(d.x - ux, d.y - uy) < 12 * PITCH), 'no ring of its own');
});

test('the beacons blink: their level moves between low and high while the tint of the country stays put', async () => {
  const env = world({ soon: SOON });
  await (await load())();
  env.see();
  env.run(3.4); // lights on (about 2.3 s), beacons faded in (0.6 s)
  const from = env.log.clearRect;
  env.run(6);
  const { log } = env;
  const mn = [...levels(log, 'MN')].filter(([frame]) => frame > from).map(([, level]) => level);
  const us = [...levels(log, 'US')].filter(([frame]) => frame > from).map(([, level]) => level);
  assert.ok(mn.length > 100);
  for (const list of [mn, us]) {
    assert.ok(Math.max(...list) >= 0.99, `high: ${Math.max(...list)}`);
    assert.ok(Math.min(...list) <= 0.13, `low: ${Math.min(...list)}`);
    assert.ok(list.every(level => level >= 0.11 && level <= 1));
    // High for a good part of the period, dark for a third of it.
    assert.ok(list.filter(level => level >= 0.99).length > list.length * 0.3);
    assert.ok(list.filter(level => level <= 0.13).length > list.length * 0.25);
  }
  // The ring and the halo follow the same level.
  const ringAlpha = log.rings.filter(entry => entry.frame > from && near(entry, 'MN', 0.01)).map(entry => entry.alpha);
  assert.ok(Math.max(...ringAlpha) >= 0.79 && Math.min(...ringAlpha) <= 0.41, `ring ${Math.min(...ringAlpha)}..${Math.max(...ringAlpha)}`);
  const halo = log.gradients.filter(g => g.frame > from && Math.hypot(g.x - centreOf('MN')[0], g.y - centreOf('MN')[1]) < 0.5).map(g => parseFloat(g.stops[0].split(',')[3]));
  assert.ok(Math.max(...halo) >= 0.299 && Math.min(...halo) <= 0.04, `halo ${Math.min(...halo)}..${Math.max(...halo)}`);

  // The tint is one constant alpha once the beacons are in; it never blinks.
  const tint = new Set(log.tints.filter(entry => entry.frame > from).map(entry => entry.alpha));
  assert.deepEqual([...tint], [0.34]);

  // The two beacons are never in unison: at some moment one is high while the other is low.
  const usAt = new Map([...levels(log, 'US')]);
  const apart = [...levels(log, 'MN')].filter(([frame]) => frame > from && usAt.has(frame)).map(([frame, level]) => Math.abs(level - usAt.get(frame)));
  assert.ok(Math.max(...apart) > 0.8, `largest gap ${Math.max(...apart)}`);
  assert.ok(apart.filter(gap => gap > 0.5).length > apart.length * 0.2);
});

test('the beacons appear after the lights are on, and nothing about them paints before the map is seen', async () => {
  const env = world({ soon: SOON });
  await (await load())();
  assert.equal(env.log.cores.length, 0);
  assert.equal(env.log.tints.length, 0);
  env.see();
  env.run(2);
  assert.equal(env.log.cores.length, 0, 'the lit country comes first');
  assert.ok(!env.soonPins.some(pin => pin.classes.has('is-on')));
  env.run(1.6);
  assert.ok(env.log.cores.length > 0);
  env.run(1);
  assert.ok(env.soonPins.every(pin => pin.classes.has('is-on')), 'the tags show with the beacons');
});

test('still mode: one frame, the beacons at a fixed level, and nothing changes on a later tick', async () => {
  const env = world({ soon: SOON, reduced: true });
  await (await load())();
  assert.equal(env.log.clearRect, 1);
  assert.equal(env.requested, 0);
  for (const code of ['MN', 'US']) {
    const core = env.log.cores.filter(entry => near(entry, code));
    assert.ok(core.length >= 3 && core.every(entry => entry.alpha === 0.7), code);
    assert.equal(env.log.rings.filter(entry => near(entry, code, 0.01)).length, 1);
  }
  assert.deepEqual(env.log.rings.map(entry => entry.alpha), [0.665, 0.665]);
  assert.deepEqual([...new Set(env.log.tints.map(entry => entry.alpha))], [0.34]);
  assert.ok(env.soonPins.every(pin => pin.classes.has('is-on')), 'tags show at once');
  const painted = env.log.cores.length;
  env.see();
  env.doc.fire('visibilitychange');
  env.media.change();
  assert.equal(env.requested, 0);
  assert.equal(env.log.clearRect, 1, 'a still picture is not painted again');
  assert.equal(env.log.cores.length, painted);
});

test('the motion switch turns the blinking on and off again without losing the beacons', async () => {
  const env = world({ soon: SOON, motion: 'off' });
  await (await load())();
  env.see();
  assert.equal(env.requested, 0);
  assert.equal(env.log.clearRect, 1);
  assert.ok(env.log.cores.length > 0 && env.log.cores.every(entry => entry.alpha === 0.7));

  delete env.root.dataset.motion;
  env.observers.mutation();
  assert.equal(env.requested, 1, 'motion back on starts the loop');
  env.run(6);
  const moving = levels(env.log, 'MN');
  assert.ok(Math.max(...moving.values()) >= 0.99 && Math.min(...moving.values()) <= 0.13, 'it blinks again');

  env.root.dataset.motion = 'off';
  env.observers.mutation();
  assert.equal(env.frames.length, 0);
  const frame = env.log.clearRect;
  assert.equal(levels(env.log, 'MN').get(frame), 0.7, 'one still picture at the fixed level');
  env.run(1);
  assert.equal(env.log.clearRect, frame, 'and no loop');
});

test('pointing at a country in preparation says so, in the words of the page', async () => {
  const env = world({ soon: SOON });
  await (await load())();
  const [name, status] = env.tip().kids;
  env.canvas.fire('pointermove', { pointerType: 'mouse', ...at(155, 20) });
  assert.deepEqual([name.textContent, status.textContent], ['몽골', '준비 중']);
  const us = cellsOf('US')[10];
  env.canvas.fire('pointermove', { pointerType: 'mouse', ...at(us.col, us.row) });
  assert.deepEqual([name.textContent, status.textContent], ['미국', '준비 중']);
  env.canvas.fire('pointermove', { pointerType: 'mouse', ...at(170, 26) });
  assert.deepEqual([name.textContent, status.textContent], ['대한민국', 'UniQdata 서비스 중']);
  const brazil = cellsOf('BR')[10];
  env.canvas.fire('pointermove', { pointerType: 'mouse', ...at(brazil.col, brazil.row) });
  assert.equal(status.textContent, '앞으로 켤 곳', 'other land is still next to light');

  const en = world({ lang: 'en', captions: { KR: ['South Korea', 'UniQdata live'] }, soon: { MN: ['Mongolia', 'In preparation'], US: ['United States', 'In preparation'] }, next: 'Next to light' });
  await (await load())();
  const [enName, enStatus] = en.tip().kids;
  en.canvas.fire('click', at(155, 20));
  assert.deepEqual([enName.textContent, enStatus.textContent], ['Mongolia', 'In preparation']);
});

test('with three name tags on a 1216px map no tag covers another country, none overlap, all stay inside', async () => {
  const mapWidth = 1216, pitch = mapWidth / 200;
  const env = world({ width: mapWidth, soon: SOON, pinWidths: { KR: 185, MN: 110, US: 110 } });
  await (await load())();
  const tags = [['KR', env.pins[0]], ['MN', env.soonPins[0]], ['US', env.soonPins[1]]];
  const boxes = tags.map(([code, pin]) => {
    const left = parseFloat(pin.style.left), top = parseFloat(pin.style.top), w = pin.offsetWidth, h = pin.offsetHeight;
    const below = pin.classes.has('is-below');
    return { code, left, right: left + w, top: below ? top : top - h, bottom: below ? top + h : top, pin };
  });
  for (const box of boxes) {
    assert.ok(box.left >= 0 && box.right <= mapWidth, `${box.code} inside the map sideways`);
    assert.ok(box.top >= 0, `${box.code} inside the map at the top`);
    for (const other of ['KR', 'MN', 'US'].filter(code => code !== box.code)) {
      const [x, y] = centreOf(other, pitch);
      assert.ok(!(x >= box.left && x <= box.right && y >= box.top && y <= box.bottom), `${box.code} covers ${other}`);
    }
  }
  for (const [i, a] of boxes.entries()) for (const b of boxes.slice(i + 1)) {
    assert.ok(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top, `${a.code} overlaps ${b.code}`);
  }
  // Korea would reach past the right edge beside its light and would cover Mongolia above it: it goes to the left, below.
  const korea = boxes[0];
  assert.ok(korea.pin.classes.has('is-left') && korea.pin.classes.has('is-below'));
  const [kx, ky] = centreOf('KR', pitch);
  assert.equal(korea.top, ky + 28);
  assert.equal(korea.right, kx - 28);
  // Mongolia stays on its preferred side (right half of the map), the United States on the left.
  assert.ok(!boxes[1].pin.classes.has('is-left') && !boxes[1].pin.classes.has('is-below'));
  assert.ok(boxes[2].pin.classes.has('is-left') && !boxes[2].pin.classes.has('is-below'));
  // The leader line points from the tag's near corner at the light, whichever way the tag sits.
  for (const [code, pin] of tags) {
    const angle = parseFloat(pin.style['--lead-angle']);
    const below = pin.classes.has('is-below');
    assert.ok(below ? angle < 0 : angle > 0, `${code}: leader angle ${angle}`);
  }
});
