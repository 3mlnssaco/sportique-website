import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const copy = JSON.parse(readFileSync('scripts/english-copy.json', 'utf8'));
// Copy added with the 2026-11-24 design: one flat {"한국어": "English"} file per piece in scripts/english-copy.d/.
// The same Korean string must not get two different English strings.
const extraCopy = 'scripts/english-copy.d';
for (const name of existsSync(extraCopy) ? readdirSync(extraCopy).filter(file => file.endsWith('.json')).sort() : []) {
  for (const [korean, english] of Object.entries(JSON.parse(readFileSync(`${extraCopy}/${name}`, 'utf8')))) {
    if (typeof english !== 'string') throw new Error(`${extraCopy}/${name}: "${korean}" must map to a string`);
    if (Object.hasOwn(copy, korean) && copy[korean] !== english) throw new Error(`${extraCopy}/${name}: "${korean}" already has a different English string ("${copy[korean]}")`);
    copy[korean] = english;
  }
}
const decode = value => value.replace(/&(amp|quot|apos|lt|gt|#39);/g, (_, key) => ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', '#39': "'" })[key]);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const route = path => `/en${path}`;
function translate(value) {
  const text = decode(value.trim());
  if (/[가-힣]/u.test(text) && !Object.hasOwn(copy, text)) throw new Error(`Missing English translation: ${text}`);
  const translated = copy[text] ?? text;
  return value.replace(value.trim(), escape(translated));
}
function destination(value) {
  if (value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/assets/')) return route(value);
  if (/^https:\/\/www\.sportique\.biz\//.test(value)) return value.replace('https://www.sportique.biz/', 'https://www.sportique.biz/en/');
  if (value === 'https://org.sportique.biz/workspace') return `${value}?lang=en`;
  if (/^https:\/\/(uniqdata|uniqlab)\.io\/?$/.test(value)) return `${value.replace(/\/$/, '')}/?lang=en`;
  return value.replace('SportiQue%20협업%20문의', 'SportiQue%20partnership%20inquiry').replace('SportiQue%20제품%20이용%20문의', 'SportiQue%20product%20support');
}
// Translate the Korean build, keeping its markup, media and interaction hooks intact.
export function buildEnglish(paths) {
  for (const path of paths) {
    const input = path === '/' ? 'index.html' : path === '/404.html' ? '404.html' : `${path.slice(1)}index.html`;
    const output = `en/${input}`;
    let html = readFileSync(input, 'utf8').replace(/<[^>]+>|[^<]+/g, token => {
      if (!token.startsWith('<')) return translate(token);
      return token.replace(/(alt|aria-label|content|href|lang)="([^"]*)"/g, (attribute, key, value) => {
        if (key === 'href') return `${key}="${destination(value)}"`;
        if (key === 'lang' && value === 'ko') return 'lang="en"';
        if (key === 'lang') return attribute;
        return `${key}="${translate(value)}"`;
      });
    });
    // Each language switch stays on the matching page.
    html = html.replace(/<a class="language-switch"[^>]*>[\s\S]*?<\/a>/, link => link
      .replace(`href="/en/en${path}"`, `href="${path}"`)
      .replace(' lang="en"', '')
      .replace('hreflang="en"', 'hreflang="ko"')
      .replaceAll('Switch to English', 'Switch to Korean')
      .replace('<span>EN</span>', '<span>KO</span>'));
    html = html.replace('</head>', `<link rel="alternate" hreflang="ko" href="https://www.sportique.biz${path}"><link rel="alternate" hreflang="en" href="https://www.sportique.biz${route(path)}"></head>`);
    mkdirSync(output.slice(0, output.lastIndexOf('/')), { recursive: true });
    writeFileSync(output, html);
  }
  // The Korean pages name their English twin too (the English pass above rewrites every href, so this comes after it).
  for (const path of paths) {
    const input = path === '/' ? 'index.html' : path === '/404.html' ? '404.html' : `${path.slice(1)}index.html`;
    const html = readFileSync(input, 'utf8');
    if (html.includes('rel="alternate" hreflang=')) continue;
    writeFileSync(input, html.replace('</head>', `<link rel="alternate" hreflang="ko" href="https://www.sportique.biz${path}"><link rel="alternate" hreflang="en" href="https://www.sportique.biz${route(path)}"></head>`));
  }
  console.log(`Translated ${paths.length} company pages with the original UI and media.`);
}
