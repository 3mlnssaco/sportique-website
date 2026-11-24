// The English pages are the Korean pages with their words swapped: same markup, same hooks, no Korean left behind.
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, count, block, mainOf, visibleText, fileOf, paths, productIds, HANGUL } from './support.mjs';

const tags = html => [...html.matchAll(/<[^>]+>/g)].map(match => match[0])
  .filter(tag => !tag.includes('hreflang='))
  .map(tag => tag.replace(/\s(?:alt|aria-label|content|href|lang|title)="[^"]*"/g, ''));

test('Every English page retains the Korean page structure, media and interaction hooks', () => {
  for (const path of paths) {
    const korean = read(fileOf('', path)), english = read(fileOf('en/', path));
    assert.deepEqual(tags(english), tags(korean), path || 'home');
    assert.match(korean, /<html lang="ko">/);
    assert.match(english, /<html lang="en">/);
    assert.ok(korean.includes(`<link rel="canonical" href="https://www.sportique.biz/${path}">`), path);
    assert.ok(english.includes(`<link rel="canonical" href="https://www.sportique.biz/en/${path}">`), path);
    assert.ok(korean.includes(`<link rel="alternate" hreflang="ko" href="https://www.sportique.biz/${path}"><link rel="alternate" hreflang="en" href="https://www.sportique.biz/en/${path}"></head>`), `${path}: the Korean page names its English twin`);
    assert.ok(english.includes(`<link rel="alternate" hreflang="ko" href="https://www.sportique.biz/${path}"><link rel="alternate" hreflang="en" href="https://www.sportique.biz/en/${path}">`), path);
    // Each language switch stays on the matching page.
    assert.equal(count(korean, /class="language-switch"/g), 1, path);
    assert.equal(count(english, /class="language-switch"/g), 1, path);
    assert.ok(english.includes(`class="language-switch" href="/${path}" hreflang="ko" aria-label="Switch to Korean"`), path);
    assert.ok(english.includes('<span>KO</span>'));
    assert.ok(korean.includes(`class="language-switch" href="/en/${path}" lang="en" hreflang="en" aria-label="Switch to English"`), path);
    assert.ok(korean.includes('<span>EN</span>'));
    // No Korean anywhere in an English page: text, attributes, inline scripts and mail subjects.
    assert.doesNotMatch(english, HANGUL, path || 'home');
    assert.doesNotMatch(english, /guaranteed participants|integrated with Teladoc|unlimited recruitment/i);
    // Apart from the switch, an English page links only to English pages.
    const withoutSwitch = english.replace(block(english, 'class="language-switch"'), '');
    for (const [, target] of withoutSwitch.matchAll(/<a\b[^>]*\shref="(\/[^"]*)"/g)) assert.ok(target.startsWith('/en/'), `en/${path}: ${target}`);
  }
});

test('English home and product pages state personal choice and lead to the English product pages', () => {
  const home = read('en/index.html'), products = read('en/products/index.html');
  // The old headline of the concept diagram ("Scattered records. Choices that are yours.") left with the diagram;
  // the statement is the page heading.
  assert.equal(visibleText(block(home, '<h1')), 'Health records together. Decisions with you.');
  assert.ok(home.includes('<title>SportiQue — Health records together, decisions with the individual</title>'));
  assert.ok(home.includes('href="https://uniqdata.io/?lang=en"'));
  assert.doesNotMatch(products, /yakson/i);
  for (const asset of ['uniqdata-home-dev-20260916.png', 'uniqlab-data-table-20260513.png', 'bodab-screen-20260922.png', 'value-visual']) assert.ok(!products.includes(asset), asset);
  assert.ok(products.includes('Individuals') || products.includes('individuals'));
  for (const id of productIds) {
    assert.ok(block(products, `id="${id}"`).includes(`href="/en/products/${id}/"`), id);
    assert.ok(read(`en/products/${id}/index.html`).includes('href="/en/products/"'), id);
  }
});

test('English contact retains Gmail, mail app, copy-address and onboarding actions', () => {
  const contact = read('en/contact/index.html'), main = mainOf(contact);
  const ways = [...main.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(match => match[0]);
  assert.equal(ways.length, 3);
  for (const [index, [address, subject]] of [['hello@sportique.biz', 'SportiQue%20partnership%20inquiry'], ['support@sportique.biz', 'SportiQue%20product%20support']].entries()) {
    const way = ways[index];
    assert.ok(visibleText(way).includes(address), address);
    assert.ok(way.includes(`data-copy-email="${address}"`), address);
    assert.ok(way.includes(`href="mailto:${address}?subject=${subject}"`), address);
    assert.ok(way.includes(`to=${address.replace('@', '%40')}&amp;su=${subject}"`), address);
    for (const label of ['Compose in Gmail', 'Compose in your mail app', 'Copy address']) assert.ok(way.includes(label), `${address}: ${label}`);
  }
  assert.equal(visibleText(block(main, 'class="address-display"')), 'hello@sportique.biz');
  assert.ok(ways[2].includes('href="https://org.sportique.biz/onboarding"'));
  assert.ok(contact.includes('href="https://org.sportique.biz/workspace?lang=en"'));
  // The page scripts answer in the page's language.
  assert.match(main, /<script type="module" src="\/assets\/page-contact-20261124\.js\?v=[0-9a-f]{12}"><\/script>/);
  assert.ok(read('assets/page-contact-20261124.js').includes('Email address copied.'));
  assert.match(read('en/awards/index.html'), /<script type="module" src="\/assets\/page-awards-20261124\.js\?v=[0-9a-f]{12}"><\/script>/);
  assert.ok(read('assets/page-awards-20261124.js').includes('${count} public record${count === 1 ? \'\' : \'s\'}'));
});

test('institution guide explains both login roles without a UniQLab-only entry', () => {
  const korean = read('institutions/index.html'), english = read('en/institutions/index.html');
  assert.ok(korean.includes('기관 관리자·직원은 기관 계정으로 관리 업무를 이어갑니다.'));
  assert.ok(korean.includes('서비스 실무자는 UniQdata 개인 계정으로 로그인해 현재 연결된 업무 플랫폼을 확인합니다.'));
  assert.ok(korean.includes('기관 운영 계정과 UniQdata 개인 계정의 권한은 다릅니다.'));
  assert.ok(mainOf(korean).includes('href="https://org.sportique.biz/workspace"'));
  assert.ok(mainOf(korean).includes('href="https://org.sportique.biz/onboarding"'));
  assert.ok(!korean.includes('UniQLab 기관 로그인'));
  assert.ok(!korean.includes('href="https://web.uniqlab.io/"'));
  assert.ok(english.includes('Institution administrators and staff use their institution account'));
  assert.ok(english.includes('a personal UniQdata.io account'));
  assert.ok(mainOf(english).includes('href="https://org.sportique.biz/workspace?lang=en"'));
  assert.ok(mainOf(english).includes('href="https://org.sportique.biz/onboarding"'));
  assert.ok(!english.includes('UniQLab.io institutional login'));
});
