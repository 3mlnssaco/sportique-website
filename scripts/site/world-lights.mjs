// Markup for the "lights of the world" map. assets/world-lights-20261124.js draws into the canvas;
// the caption under it carries the same facts as words, so the page reads without the drawing.
//
// Lit countries come from scripts/world-lights.json: adding one line there lights one more country.
// The English build only translates text nodes and alt/aria-label/content, so no Korean goes into
// data attributes: the script reads the status from the caption list and the "next" label from [data-next].
import { readFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const LABEL = '세계 지도. 불이 켜진 나라는 지금 서비스가 닿은 곳이고, 나머지는 앞으로 켤 곳입니다.';

export function worldLights() {
  const names = new Map(read('../../assets/world-countries-20260921.json').countries.map(c => [c.code, c.name]));
  const onGrid = new Set(read('../../assets/world-grid-20261124.json').codes);
  const entries = read('../world-lights.json').lit;
  if (!Array.isArray(entries)) throw new Error('scripts/world-lights.json: "lit" must be a list.');

  const seen = new Set();
  const lit = entries.map((entry, listed) => {
    const { code, status, since = '' } = entry ?? {};
    if (!names.has(code)) throw new Error(`scripts/world-lights.json: unknown country code ${JSON.stringify(code)}.`);
    if (!onGrid.has(code)) throw new Error(`scripts/world-lights.json: ${code} has no cell in assets/world-grid-20261124.json, so it cannot be lit.`);
    if (seen.has(code)) throw new Error(`scripts/world-lights.json: ${code} is listed twice.`);
    if (typeof status !== 'string' || !status.trim()) throw new Error(`scripts/world-lights.json: ${code} needs a status.`);
    seen.add(code);
    return { code, name: names.get(code), status: status.trim(), since: String(since), listed };
  });
  // Lights come on in the order the countries were reached.
  lit.sort((a, b) => (a.since || '9999').localeCompare(b.since || '9999') || a.listed - b.listed);

  const data = JSON.stringify(lit.map(({ code }, i) => ({ code, order: i + 1 })));
  const legend = '<ul class="world-lights-legend">'
    + '<li><i class="world-lights-dot world-lights-dot--lit" aria-hidden="true"></i><span>켜진 곳</span></li>'
    + '<li><i class="world-lights-dot" aria-hidden="true"></i><span data-next>앞으로 켤 곳</span></li>'
    + '</ul>';
  const list = lit.length
    ? `<ul class="world-lights-list">${lit.map(c => `<li data-code="${esc(c.code)}"><b>${esc(c.name)}</b> <span>${esc(c.status)}</span></li>`).join('')}</ul>`
    : '';
  // Name tags the script places beside each lit country (wide screens); the list above stays the text for screen readers.
  const pins = lit.map(c => `<div class="world-lights-pin" data-code="${esc(c.code)}" aria-hidden="true"><b>${esc(c.name)}</b><span>${esc(c.status)}</span></div>`).join('');
  return `<figure class="world-lights" data-world-lights data-lit='${esc(data).replaceAll('&quot;', '"')}'>`
    + `<canvas role="img" aria-label="${esc(LABEL)}"></canvas>${pins}`
    + `<figcaption>${legend}${list}</figcaption></figure>`;
}
