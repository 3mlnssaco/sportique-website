// Page frame for the 2026-11-24 design: head, fixed backdrop, floating header bar, main, footer.
// scripts/build-site.mjs uses this for every path that has a module in scripts/site/pages/.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { esc } from './ui.mjs';

export const routes = [['/', '홈'], ['/products/', '제품'], ['/about/', '회사'], ['/vision/', '비전'], ['/founder/', '대표'], ['/awards/', '이력'], ['/contact/', '문의']];
const login = 'https://org.sportique.biz/workspace';
const arrow = '<span aria-hidden="true">↗</span>';
const brand = '<a class="brand" href="/" aria-label="SportiQue 홈"><img src="/assets/sportique-emblem-fallback.svg" alt="" width="24" height="30"><span>SportiQue</span></a>';

// One cache key for the stylesheet, the page script and the modules and data it loads (all share ?v=); the
// stylesheet is written by the build just before pages are rendered.
const versioned = ['assets/site-20261124.css', 'assets/site-20261124.js', 'assets/stage-field-20261124.js', 'assets/world-lights-20261124.js', 'assets/world-grid-20261124.json', 'assets/page-awards-20261124.js', 'assets/page-contact-20261124.js'];
let version;
export function assetVersion() {
  if (!version) {
    const hash = createHash('sha256');
    for (const file of versioned) hash.update(readFileSync(file));
    version = hash.digest('hex').slice(0, 12);
  }
  return version;
}

export function header(path) {
  const links = routes.map(([url, name]) => `<a href="${url}"${path === url ? ' aria-current="page"' : ''}>${name}</a>`).join('');
  // The English build finds the switch by its exact opening `<a class="language-switch"`; keep that attribute order.
  const language = `<a class="language-switch" href="/en${path}" lang="en" hreflang="en" aria-label="Switch to English" title="Switch to English"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg><span>EN</span></a>`;
  const menu = `<details class="mobile-menu"><summary aria-label="전체 메뉴 열기"><span></span><span></span></summary><nav aria-label="모바일 메뉴">${links}<a href="/institutions/">기관 포털 안내</a><a class="mobile-only-login" href="${login}">기관 로그인 ${arrow}</a></nav></details>`;
  return `<a class="skip-link" href="#main">본문으로 이동</a><header class="site-header">${brand}<nav class="site-nav" aria-label="주 메뉴">${links}</nav><div class="header-actions">${language}<a class="header-login" href="${login}">기관 로그인 ${arrow}</a>${menu}</div></header>`;
}

export function footer() {
  const links = routes.slice(1).map(([url, name]) => `<a href="${url}">${name}</a>`).join('') + '<a href="/institutions/">기관 포털</a>';
  return `<footer class="site-footer"><div class="wrap footer-top"><div class="footer-brand">${brand}<p>개인이 관리하는 건강기록,<br>활용도 직접 선택합니다.</p></div><nav class="footer-nav" aria-label="추가 정보">${links}</nav><a class="footer-mail" href="mailto:hello@sportique.biz">hello@sportique.biz</a></div><div class="wrap footer-bottom"><span>© 2026 SportiQue. All rights reserved.</span><button type="button" class="motion-toggle" data-motion-toggle>배경 움직임 멈추기</button></div></footer>`;
}

export function page({ path, title, description, body, lang = 'ko' }) {
  const v = assetVersion();
  return `<!doctype html>\n<html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#050609"><meta property="og:title" content="SportiQue — ${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="https://www.sportique.biz/assets/sportique-header.jpg"><link rel="canonical" href="https://www.sportique.biz${path}"><link rel="icon" href="/assets/sportique-icon.jpg"><title>SportiQue — ${esc(title)}</title><link rel="stylesheet" href="/assets/site-20261124.css?v=${v}"><script type="module" src="/assets/site-20261124.js?v=${v}"></script></head><body data-page="${path === '/' ? 'home' : esc(path)}"><div class="stage" data-stage aria-hidden="true"><canvas></canvas></div>${header(path)}<main id="main">${body}</main>${footer()}</body></html>\n`;
}
