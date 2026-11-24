// Turns the country outlines in assets/world-countries-20260921.json (1000x500 equirectangular,
// M/L/Z paths) into a 200-column grid of land cells for assets/world-lights-20261124.js.
// Run once and commit the result: node scripts/make-world-grid.mjs
//
// Output (assets/world-grid-20261124.json):
//   cols, rows  grid size; row 0 is the northernmost row
//   cell, y0    one cell is `cell` source units square; row 0 starts at source y = y0
//   codes       country codes; cell value n (n > 0) means codes[n - 1], 0 means sea
//   cells       row-major run lengths, comma separated: "<value>" or "<value>*<count>", both base 36
//   centers     per country [col, row, size]: centre and radius (in cells) of its largest land mass
import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE = new URL('../assets/world-countries-20260921.json', import.meta.url);
const OUTPUT = new URL('../assets/world-grid-20261124.json', import.meta.url);

const COLS = 200;
const CELL = 1000 / COLS;
const LAT_NORTH = 84, LAT_SOUTH = -58;
const SKIP = new Set(['AQ']);
// A country too small to contain any cell centre gets the one cell it covers most (SUB x SUB samples),
// unless that would leave another country with fewer than KEEP cells.
const SUB = 7, KEEP = 3;

const latToY = lat => (90 - lat) / 180 * 500;
const firstRow = Math.ceil((latToY(LAT_NORTH) - CELL / 2) / CELL);
const lastRow = Math.floor((latToY(LAT_SOUTH) - CELL / 2) / CELL);
const ROWS = lastRow - firstRow + 1;
const Y0 = firstRow * CELL;

function parsePath(path) {
  const rings = [];
  let ring = null;
  for (const [, command, args] of path.matchAll(/([MLZ])([^MLZ]*)/g)) {
    if (command === 'Z') { ring = null; continue; }
    const [x, y] = args.split(',').map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`Bad path segment: ${command}${args}`);
    if (command === 'M') { ring = []; rings.push(ring); }
    ring.push(x, y);
  }
  return rings.filter(points => points.length >= 6).map(points => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, area = 0;
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i], y = points[i + 1];
      const nx = points[(i + 2) % points.length], ny = points[(i + 3) % points.length];
      area += x * ny - nx * y;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    return { points, minX, minY, maxX, maxY, area: Math.abs(area) / 2 };
  });
}

// Even-odd rule over every ring of the country, so holes cut out.
function inside(country, px, py) {
  let hit = false;
  for (const ring of country.rings) {
    if (py < ring.minY || py >= ring.maxY || px > ring.maxX) continue;
    const p = ring.points;
    for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
      const y1 = p[i + 1], y2 = p[j + 1];
      if ((y1 > py) !== (y2 > py) && px < (p[j] - p[i]) * (py - y1) / (y2 - y1) + p[i]) hit = !hit;
    }
  }
  return hit;
}

const atlas = JSON.parse(readFileSync(SOURCE, 'utf8'));
const countries = atlas.countries.filter(c => !SKIP.has(c.code)).map(c => {
  const rings = parsePath(c.path);
  return {
    code: c.code,
    rings,
    area: rings.reduce((sum, ring) => sum + ring.area, 0),
    minX: Math.min(...rings.map(r => r.minX)), maxX: Math.max(...rings.map(r => r.maxX)),
    minY: Math.min(...rings.map(r => r.minY)), maxY: Math.max(...rings.map(r => r.maxY)),
    count: 0,
  };
});

const owner = new Array(COLS * ROWS).fill(null);
const centreX = col => (col + 0.5) * CELL;
const centreY = row => Y0 + (row + 0.5) * CELL;
const clampCol = v => Math.min(COLS - 1, Math.max(0, v));
const clampRow = v => Math.min(ROWS - 1, Math.max(0, v));
let contested = 0;

// Pass 1: a cell belongs to the country that contains its centre (the smaller country wins an overlap).
for (const country of countries) {
  const c0 = clampCol(Math.floor(country.minX / CELL)), c1 = clampCol(Math.floor(country.maxX / CELL));
  const r0 = clampRow(Math.floor((country.minY - Y0) / CELL)), r1 = clampRow(Math.floor((country.maxY - Y0) / CELL));
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      if (!inside(country, centreX(col), centreY(row))) continue;
      const i = row * COLS + col, held = owner[i];
      if (held) {
        contested++;
        if (held.area <= country.area) continue;
        held.count--;
      }
      owner[i] = country;
      country.count++;
    }
  }
}

// Pass 2: countries that contain no cell centre.
const rescued = [], missing = [];
for (const country of countries.filter(c => c.count === 0).sort((a, b) => b.area - a.area)) {
  const c0 = Math.floor(country.minX / CELL), c1 = Math.floor(country.maxX / CELL);
  const r0 = Math.floor((country.minY - Y0) / CELL), r1 = Math.floor((country.maxY - Y0) / CELL);
  const options = [];
  for (let row = Math.max(0, r0); row <= Math.min(ROWS - 1, r1); row++) {
    for (let col = Math.max(0, c0); col <= Math.min(COLS - 1, c1); col++) {
      let cover = 0;
      for (let sy = 0; sy < SUB; sy++) for (let sx = 0; sx < SUB; sx++) {
        if (inside(country, (col + (sx + 0.5) / SUB) * CELL, Y0 + (row + (sy + 0.5) / SUB) * CELL)) cover++;
      }
      if (cover) options.push({ i: row * COLS + col, cover });
    }
  }
  options.sort((a, b) => b.cover - a.cover || a.i - b.i);
  const pick = options.find(o => !owner[o.i] || owner[o.i].count > KEEP);
  if (!pick) { missing.push(country.code); continue; }
  if (owner[pick.i]) owner[pick.i].count--;
  owner[pick.i] = country;
  country.count = 1;
  rescued.push(country.code);
}

// Centre and size of each country's largest land mass (8-connected cells).
function largestMass(country) {
  const seen = new Set();
  let best = [];
  for (let start = 0; start < owner.length; start++) {
    if (owner[start] !== country || seen.has(start)) continue;
    const mass = [], queue = [start];
    seen.add(start);
    while (queue.length) {
      const i = queue.pop(), col = i % COLS, row = (i - col) / COLS;
      mass.push(i);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const c = col + dx, r = row + dy;
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
        const n = r * COLS + c;
        if (owner[n] === country && !seen.has(n)) { seen.add(n); queue.push(n); }
      }
    }
    if (mass.length > best.length) best = mass;
  }
  let sx = 0, sy = 0;
  for (const i of best) { sx += i % COLS; sy += Math.floor(i / COLS); }
  const cx = sx / best.length, cy = sy / best.length;
  let spread = 0;
  for (const i of best) spread += (i % COLS - cx) ** 2 + (Math.floor(i / COLS) - cy) ** 2;
  // sqrt(2 * mean squared distance) is the radius of a disc with the same spread; half a cell covers the dots themselves.
  const size = Math.sqrt(2 * spread / best.length) + 0.5;
  return [cx, cy, size].map(v => Math.round(v * 10) / 10);
}

const listed = countries.filter(c => c.count > 0);
const index = new Map(listed.map((c, i) => [c, i + 1]));
const values = owner.map(c => (c ? index.get(c) : 0));
const runs = [];
for (let i = 0; i < values.length;) {
  let n = 1;
  while (i + n < values.length && values[i + n] === values[i]) n++;
  runs.push(n === 1 ? values[i].toString(36) : `${values[i].toString(36)}*${n.toString(36)}`);
  i += n;
}

const grid = {
  cols: COLS,
  rows: ROWS,
  cell: CELL,
  y0: Y0,
  codes: listed.map(c => c.code),
  cells: runs.join(','),
  centers: listed.map(largestMass),
};
const json = JSON.stringify(grid) + '\n';
writeFileSync(OUTPUT, json);

const land = values.filter(Boolean).length;
console.log(`Wrote assets/world-grid-20261124.json: ${Buffer.byteLength(json)} bytes, ${COLS}x${ROWS} cells, ${land} land cells, ${listed.length} countries, ${runs.length} runs.`);
console.log(`Overlapping claims settled: ${contested}. Given one cell because no cell centre fell inside (${rescued.length}): ${rescued.join(' ') || '-'}.`);
if (missing.length) console.log(`No cell at all (${missing.length}): ${missing.join(' ')}.`);
