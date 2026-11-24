// Shared helpers for the page tests. Not a test file: `node --test tests/*.test.mjs` does not run it.
// The tests read the built pages, so run `node scripts/build-site.mjs` first (the deploy workflow does).
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Every path in the tests is relative to the repository root, wherever the tests are started from.
process.chdir(fileURLToPath(new URL('../', import.meta.url)));

export const read = path => readFileSync(path, 'utf8');
export const json = path => JSON.parse(read(path));
export const exists = path => existsSync(path);
export const count = (text, pattern) => (text.match(pattern) || []).length;
export const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The public pages. A route is the path without the leading slash; '' is the home page.
export const SITE_CSS = 'assets/site-20261124.css';
export const SITE_JS = 'assets/site-20261124.js';
export const routes = ['', 'products/', 'products/uniqdata/', 'products/uniqdata/now/', 'products/uniqlab/', 'products/bodab/', 'about/', 'vision/', 'founder/', 'awards/', 'contact/', 'institutions/'];
export const paths = [...routes, '404.html'];
export const fileOf = (prefix, path) => `${prefix}${path}${path.endsWith('.html') ? '' : 'index.html'}`;
export const koreanFiles = paths.map(path => fileOf('', path));
export const englishFiles = paths.map(path => fileOf('en/', path));
export const allFiles = [...koreanFiles, ...englishFiles];
export const languages = [{ prefix: '', lang: 'ko' }, { prefix: 'en/', lang: 'en' }];
export const productIds = ['uniqdata', 'uniqlab', 'bodab'];
export const HANGUL = /[가-힣]/u;

// Records as the site publishes them: YAKSON stays in the source file and off the pages.
const source = json('assets/public-records.json');
const published = records => records.filter(record => !/YAKSON|약손/i.test(JSON.stringify(record)));
export const sourceRecords = source;
export const publicRecords = { products: source.products.filter(product => product.id !== 'yakson'), founder: published(source.founder), awards: published(source.awards) };

// Korean to English, as the English build reads it (the base file plus one file per piece).
export const copy = Object.assign(json('scripts/english-copy.json'), ...readdirSync('scripts/english-copy.d').filter(name => name.endsWith('.json')).sort().map(name => json(`scripts/english-copy.d/${name}`)));
// A text node or attribute value as the page of that language shows it (text without Korean is not translated).
export const said = (korean, lang) => {
  if (lang === 'ko') return escapeHtml(korean);
  assert.ok(!HANGUL.test(korean) || Object.hasOwn(copy, korean), `no English for: ${korean}`);
  return escapeHtml(copy[korean] ?? korean);
};

// The whole element whose opening tag holds `marker` (for example 'id="story"'), up to its matching closing tag.
export function block(html, marker) {
  const at = html.indexOf(marker);
  assert.ok(at >= 0, `missing ${marker}`);
  const start = html.lastIndexOf('<', at);
  const name = html.slice(start + 1).match(/^[a-z0-9]+/)[0];
  const tags = new RegExp(`<(/?)${name}\\b[^>]*>`, 'g');
  tags.lastIndex = start;
  let depth = 0;
  for (let tag; (tag = tags.exec(html));) {
    depth += tag[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, tags.lastIndex);
  }
  throw new Error(`unclosed <${name}> for ${marker}`);
}
export const mainOf = html => block(html, '<main');
// Every element whose opening tag holds `marker`.
export function blocks(html, marker) {
  const found = [];
  for (let from = 0, at; (at = html.indexOf(marker, from)) >= 0; from = at + marker.length) found.push(block(html.slice(html.lastIndexOf('<', at)), marker));
  return found;
}

// What a reader sees: no scripts or styles, and every tag boundary reads as a space.
export const visibleText = html => html.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// A two-line heading: the first line, a line break, then the line that carries the statement in <em>.
// (The old pages wrote `first<br><em>second</em>`; the new ones wrap the first line in a span.)
export const twoLines = (first, second) => new RegExp(`<h[1-3]\\b[^>]*>(?:<span\\b[^>]*>)?${escapeRegExp(escapeHtml(first))}(?:</span>)?<br><em>${escapeRegExp(escapeHtml(second))}</em></h[1-3]>`);

// Style rules of a stylesheet as { selector, body, context }, where context lists the enclosing @media/@supports.
export function cssRules(css) {
  const rules = [], open = [];
  let text = '';
  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (char === '{') {
      if (open.length) open.at(-1).group = true;
      open.push({ prelude: text.split(';').pop().trim(), group: false });
      text = '';
    } else if (char === '}') {
      const closed = open.pop();
      if (!closed.group) rules.push({ selector: closed.prelude, body: text.trim(), context: open.map(rule => rule.prelude) });
      text = '';
    } else text += char;
  }
  assert.equal(open.length, 0, 'unbalanced braces in the stylesheet');
  return rules;
}

// Local files a page loads or links to: [attribute, path without query or fragment].
export const localReferences = html => [...html.matchAll(/\s(src|href)="(\/[^"?#]*)[^"]*"/g)].map(match => [match[1], match[2]]);

// Scripts that run on the pages: every <script src> of every page and the modules those import.
export function runtimeScripts() {
  const found = new Set();
  const visit = file => {
    if (found.has(file)) return;
    assert.ok(exists(file), `${file} is loaded by a page but does not exist`);
    found.add(file);
    for (const [, specifier] of read(file).matchAll(/(?:import\s*\(\s*|from\s+|import\s+)['"`]\.\/([\w.-]+\.js)['"`]/g)) visit(`assets/${specifier}`);
  };
  for (const file of allFiles) for (const [, src] of read(file).matchAll(/<script\b[^>]*\ssrc="\/([^"?]+)[^"]*"/g)) visit(src);
  return [...found].sort();
}
export const inlineScripts = html => [...html.matchAll(/<script\b(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]);
