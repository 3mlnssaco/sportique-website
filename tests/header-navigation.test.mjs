// The header of every page in both languages: main menu, collapsed menu, language switch and institution login.
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, count, block, said, fileOf, paths, languages } from './support.mjs';

const menuRoutes = ['', 'products/', 'about/', 'vision/', 'founder/', 'awards/', 'contact/'];

test('Collapsed navigation retains every company route and direct institution login on every page in both languages', () => {
  for (const { prefix, lang } of languages) for (const path of paths) {
    const file = fileOf(prefix, path), page = read(file);
    assert.equal(count(page, /<details class="mobile-menu">/g), 1, file);
    const menu = block(page, '<details class="mobile-menu"');
    for (const route of [...menuRoutes, 'institutions/']) assert.ok(menu.includes(`href="/${prefix}${route}"`), `${file}: ${route}`);
    assert.ok(menu.includes(`class="mobile-only-login" href="https://org.sportique.biz/workspace${prefix ? '?lang=en' : ''}"`), file);
    assert.ok(menu.includes(`<summary aria-label="${said('전체 메뉴 열기', lang)}">`), file);
    assert.ok(menu.includes(`<nav aria-label="${said('모바일 메뉴', lang)}">`), file);
    assert.doesNotMatch(menu, /<input|type="password"/, file);
  }
});

test('Every page has the main menu with its own route marked, the language switch and the institution login in its header', () => {
  for (const { prefix, lang } of languages) for (const path of paths) {
    const file = fileOf(prefix, path), page = read(file);
    assert.equal(count(page, /<header\b/g), 1, file);
    const header = block(page, '<header');
    const nav = block(header, `<nav class="site-nav" aria-label="${said('주 메뉴', lang)}"`);
    assert.deepEqual([...nav.matchAll(/<a href="([^"]+)"/g)].map(match => match[1]), menuRoutes.map(route => `/${prefix}${route}`), file);
    // The page's own entry is marked in both menus; a page outside the menu marks none.
    const current = [...header.matchAll(/<a href="([^"]+)" aria-current="page">/g)].map(match => match[1]);
    assert.deepEqual(current, menuRoutes.includes(path) ? [`/${prefix}${path}`, `/${prefix}${path}`] : [], file);
    assert.ok(header.includes(`<a class="header-login" href="https://org.sportique.biz/workspace${prefix ? '?lang=en' : ''}">`), file);
    assert.ok(header.includes('class="language-switch"'), file);
    assert.doesNotMatch(header, /<input|type="password"/, file);
    assert.ok(page.indexOf('<a class="skip-link" href="#main">') < page.indexOf('<header'), `${file}: the skip link comes first`);
  }
});
