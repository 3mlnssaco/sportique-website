// The Korean pages: what each one must say, link to and leave out. The frame checks cover both languages.
// Rewritten for the 2026-11-24 design. Where an old check was tied to old markup, the comment says what it protected.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { read, json, exists, count, escapeHtml, block, blocks, mainOf, visibleText, twoLines, cssRules, localReferences, runtimeScripts, inlineScripts, said, fileOf, paths, koreanFiles, allFiles, languages, productIds, publicRecords, SITE_CSS, SITE_JS } from './support.mjs';

const home = read('index.html');
const css = read(SITE_CSS);
const rules = cssRules(css);
const firstScreen = block(mainOf(home), '<section');
const nextShot = /^\/assets\/verified\/uniqdata-next-(?:connect|routine|report|vault)-20261124\.png$/;
const images = html => [...html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)].map(match => match[1]);

test('home leads with the UniQdata statement and keeps every company route, the product site and the institution login', () => {
  assert.ok(firstScreen.includes('<h1'), 'the first section holds the page heading');
  assert.ok(home.indexOf(firstScreen) < home.indexOf('id="problem"'), 'the statement comes before the problem');
  for (const url of ['/products/', '/about/', '/vision/', '/founder/', '/awards/', '/contact/', '/institutions/', 'https://org.sportique.biz/workspace', 'https://uniqdata.io/']) assert.ok(home.includes(`href="${url}"`), url);
  for (const route of ['about', 'products', 'vision', 'founder', 'awards', 'contact']) assert.ok(exists(`${route}/index.html`), route);
  for (const asset of ['sportique-icon.jpg', 'verified/uniqdata-home-dev-20260916.png']) assert.ok(exists(`assets/${asset}`), asset);
  // The old caption "기록은 한곳에, 활용과 공유의 선택은 개인에게" left with the concept diagram; the statement itself is the title and the h1.
  assert.ok(home.includes('<title>SportiQue — 건강기록은 한곳에, 선택은 개인에게</title>'));
  assert.match(firstScreen, twoLines('건강기록은 한곳에.', '선택은 개인에게.'));
  // The big UniQdata tile with two phones is gone (the app section above already shows the screens). The product section is
  // three equal link tiles with the same structure and no pictures.
  const products = block(home, 'id="products"');
  assert.match(products, twoLines('하나의 기록,', '활용은 자유롭게.'));
  assert.equal(count(products, /<a class="tile tile--link" href="\/products\/(?:uniqdata|uniqlab|bodab)\/"><div class="name-line"><h3>[^<]+<\/h3><p class="tag">(?:<span class="tag-dot" aria-hidden="true"><\/span>)?[^<]+<\/p><\/div><p>[^<]+<\/p><span class="tile-mark" aria-hidden="true">↗<\/span><\/a>/g), 3);
  assert.equal(count(products, /<div class="tile tile--link tile--static">/g), 1, 'the fourth tile is the sub-app and SDK tile, not a link');
  assert.deepEqual([...products.matchAll(/<a class="tile tile--link" href="([^"]+)"/g)].map(match => match[1]), ['/products/uniqdata/', '/products/uniqlab/', '/products/bodab/']);
  assert.ok(products.includes('href="/products/"'));
  assert.doesNotMatch(products, /<(?:img|canvas|video|picture|svg)\b|class="phone"/, 'the product tiles carry no picture');
  for (const retired of ['/assets/verified/uniqdata-home-dev-20260916.png', '/assets/verified/uniqdata-screen-20260922.webp', '/assets/generated/personal-data-vault-v1.png', 'class="assembly-links"', 'class="record-fragment"', 'hero-3d-phase', 'class="world-hero"', 'id="footprint-map"', 'holo-stage', 'value-visual', 'value-diagram']) assert.ok(!home.includes(retired), retired);
  assert.ok(!exists('assets/generated/personal-data-vault-v1.png'));
  assert.ok(home.includes('id="world"'));
  assert.equal(read('CNAME').trim(), 'www.sportique.biz');
});

test('first screen states the personal benefit without a 3D network scene, a scroll listener or more than one screen of height', () => {
  for (const text of ['건강기록은 한곳에.', '선택은 개인에게.', '그 시작이 UniQdata입니다.', 'UniQLab 흐름 보기']) assert.ok(firstScreen.includes(text), text);
  assert.ok(!firstScreen.includes('DataQ'));
  assert.match(firstScreen, /<a class="btn btn--ghost btn--arrow" href="#research">UniQLab 흐름 보기 <span class="btn-arrow" aria-hidden="true">↓<\/span><\/a>/);
  assert.doesNotMatch(firstScreen, /hero-network|class="hero-scene"|hero-flow|data-reveal|data-personal-network|hero-3d/);
  // The old rule was "no canvas in the first screen", written to keep the dense 3D network scene out. The new first screen
  // holds the 2D world map canvas, so the rule is now: that one labelled canvas only, and no WebGL or three.js anywhere.
  assert.equal(count(firstScreen, /<canvas\b/g), 1);
  assert.match(block(firstScreen, 'data-world-lights'), /<canvas role="img" aria-label="[^"]+"><\/canvas>/);
  const scripts = new Set([...runtimeScripts(), ...readdirSync('assets').filter(name => /^(?:site|stage-field|world-lights|page-[\w-]+)-20261124\.js$/.test(name)).map(name => `assets/${name}`)]);
  for (const required of [SITE_JS, 'assets/stage-field-20261124.js', 'assets/world-lights-20261124.js', 'assets/page-awards-20261124.js', 'assets/page-contact-20261124.js']) assert.ok(scripts.has(required), required);
  const sources = [...[...scripts].map(file => [file, read(file)]), ...allFiles.flatMap(file => inlineScripts(read(file)).map(code => [`${file} (inline)`, code]))];
  for (const [name, code] of sources) {
    assert.doesNotMatch(code, /addEventListener\(\s*['"`]scroll(?:end)?['"`]|\bonscroll\b/, `${name}: scroll listener`);
    assert.doesNotMatch(code, /WebGLRenderer|getContext\(\s*['"`](?:webgl2?|experimental-webgl)['"`]|three\.(?:module|core)|personal-network-hero-3d|hero-3d|hero-network/, `${name}: 3D`);
  }
  const heroRules = rules.filter(rule => /\.(?:[\w-]+-)?hero(?![\w])/.test(rule.selector));
  assert.ok(heroRules.length > 0);
  for (const { selector, body } of heroRules) {
    assert.doesNotMatch(body, /position:\s*(?:sticky|fixed)/, selector);
    for (const [, height] of body.matchAll(/(?:min-)?height:[^;]*?(\d+(?:\.\d+)?)(?:d|s|l)?vh/g)) assert.ok(Number(height) <= 100, `${selector} exceeds one viewport`);
  }
});

test('the world map sits under the statement and lights only the countries listed in scripts/world-lights.json', () => {
  // The old check: the world section puts its copy above the map on desktop (one column). Now the map is in the first screen.
  assert.ok(firstScreen.indexOf('<h1') < firstScreen.indexOf('data-world-lights'), 'statement first, map second');
  for (const { selector, body } of rules.filter(rule => rule.selector.split(',').some(one => /^\.(?:hero|product-hero)$/.test(one.trim())))) assert.doesNotMatch(body, /grid-template-columns|display:\s*(?:inline-)?flex|float:/, `${selector} must stay one column`);
  // A country may be lit only when scripts/world-lights.json says so, so a goal cannot be drawn as a result.
  const lit = json('scripts/world-lights.json').lit;
  assert.ok(lit.length > 0);
  const names = new Map(json('assets/world-countries-20260921.json').countries.map(country => [country.code, country.name]));
  for (const { prefix, lang } of languages) for (const path of ['', 'vision/']) {
    const file = fileOf(prefix, path), page = read(file);
    assert.equal(count(page, /data-world-lights/g), 1, file);
    const figure = block(page, 'data-world-lights');
    const shown = JSON.parse(figure.match(/data-lit='([^']*)'/)[1]);
    assert.deepEqual(shown.map(entry => entry.code).sort(), lit.map(entry => entry.code).sort(), file);
    assert.deepEqual(shown.map(entry => entry.order), shown.map((_, index) => index + 1), file);
    const expected = shown.map(({ code }) => [code, said(names.get(code), lang), said(lit.find(entry => entry.code === code).status, lang)]);
    // The same facts as words: the map's caption lists each lit country and its status, so the page reads without the drawing.
    const listed = [...block(figure, '<figcaption').matchAll(/<li data-code="([^"]+)"><b>([^<]+)<\/b> <span>([^<]+)<\/span><\/li>/g)].map(match => match.slice(1));
    assert.deepEqual(listed, expected, file);
    const pinned = [...figure.matchAll(/<div class="world-lights-pin" data-code="([^"]+)" aria-hidden="true"><b>([^<]+)<\/b><span>([^<]+)<\/span><\/div>/g)].map(match => match.slice(1));
    assert.deepEqual(pinned, expected, file);
    assert.equal(count(figure, /data-code="/g), expected.length * 2, `${file}: no other country is marked`);
    assert.match(figure, /<canvas role="img" aria-label="[^"]+"><\/canvas>/, file);
  }
});

test('care story starts from the family problem', () => {
  const story = block(home, 'id="story"');
  const family = story.indexOf('가족이 어르신의 복약·활동·진료를 함께 챙기려 해도');
  assert.ok(family > story.indexOf('id="care-title"'), 'the family problem follows the story heading');
  assert.ok(family < story.indexOf('Bodab 한 앱에 그치지 않고') && family < story.indexOf('XRPL'), 'and comes before the company answer and the 2025 demo');
  assert.ok(!story.includes('Bodab을 만들며'));
  // Not carried over: the old check that this section is a single column on desktop. The new home sets the story
  // beside the 2025 demo on wide screens (scripts/site/styles/20-home.css, .story).
});

test('home defines scattered records as the problem and leaves the choice of AI and sharing with the individual', () => {
  // Order of the new home. The world section moved up next to the map in the first screen, and the 2025 demo now follows
  // the care story inside one section. The vision section follows the world; the app and the study flow come after the products.
  const order = ['id="hero-title"', 'id="world"', 'id="shift"', 'id="problem"', 'id="system"', 'id="value"', 'id="products"', 'id="products-title"', 'id="uniqdata-app"', 'id="research"', 'id="story"', 'id="care-title"', 'id="journey-title"', 'id="collaboration"'];
  let last = -1;
  for (const marker of order) { const at = home.indexOf(marker); assert.ok(at > last, marker); last = at; }
  // The old English caps label "DATA FRAGMENTATION" is gone; the section says it in its own heading.
  assert.match(block(home, 'id="problem"'), twoLines('흩어진 기록은', '개인의 선택을 막습니다.'));
  for (const text of ['건강기록은 한곳에.', '선택은 개인에게.', '개인의 선택을 막습니다.', 'AI 모델이나 플랫폼', 'DataQ', '형식을 표준화합니다.', '개인 DB로 쌓습니다.', 'AI·공유를 선택합니다.', '국가가 달라도,', '개인의 기록을 이어 씁니다.', '국가별 정책·데이터 레지던시 조건', '가족이 어르신의 복약·활동·진료', '더 큰 문제를 찾았습니다.', '복약 확인 상태', '여러 곳의 기록을 대조하고 서로 다시 물어야', '2025년 XRPL', '건강기록 원문은 개인 DB에', '나라가 달라도 이어지도록.']) assert.ok(home.includes(text), text);
  // Three steps in a real order (standardise, store, choose) and no confirmation step.
  const system = block(home, 'id="system"');
  const steps = [...block(system, '<ol').matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => visibleText(match[1]));
  assert.equal(steps.length, 3);
  for (const [index, start] of ['1 DataQ 개발 중 형식을 표준화합니다.', '2 UniQdata 서비스 중 개인 DB로 쌓습니다.', '3 선택 개발 중 AI·공유를 선택합니다.'].entries()) assert.ok(steps[index].startsWith(start), steps[index]);
  assert.doesNotMatch(system, /confirm/i);
  assert.ok(!home.includes('다시 입력하지'));
  assert.ok(visibleText(block(home, 'id="products-title"')).includes('자유'));
  for (const rejected of ['한 사람의 이야기', '이야기의 시작', '돌봄이었습니다.', '정리할 후보', '정리 후보', '내 기준은', '기록의 기준점', '세계는 서버의 지도', 'NOT A COVERAGE MAP', '보호자와 함께 봅니다.', '문제를 먼저 봤습니다.', '문제를 먼저 만났습니다.', '상단 롤에서 약포를 아래 수령부로']) assert.ok(!home.includes(rejected), rejected);
});

test('assembled records open the full personal-use path without converting research compensation into a SportiQue payout claim', () => {
  for (const text of ['개인은 기록을 리포트로 확인합니다.', '쌓인 기록을 기간별 비진단 요약으로 다시 확인합니다.', '개인은 자신의 기록을 바탕으로 AI에 질문합니다.', '궁금한 건강정보를 대화로 확인합니다. 진단을 대신하지 않습니다.', '보호자에게 필요한 기록만 공유합니다.', '해외에서도 필요한 기록을 꺼내 씁니다.', '참여할 연구와 공유할 기록을 고릅니다.', '돌봄·복약 앱에 기록을 연결합니다.', '이용 이력을 다시 확인합니다.', '지급 주체가 정한 방식으로 처리', '국가별 정책·데이터 레지던시 조건']) assert.ok(home.includes(text), text);
  for (const rejected of ['데이터 판매', '토큰 보상', 'SportiQue가 직접 지급']) assert.ok(!home.includes(rejected), rejected);
});

test('every public page uses the same frame, one cache key for its shared files, and none of the retired files or markup', async () => {
  // One key for the stylesheet, the page script and what that script loads, as scripts/site/shell.mjs computes it.
  const versioned = [SITE_CSS, SITE_JS, 'assets/stage-field-20261124.js', 'assets/world-lights-20261124.js', 'assets/world-grid-20261124.json', 'assets/page-awards-20261124.js', 'assets/page-contact-20261124.js'];
  const hash = createHash('sha256');
  for (const file of versioned) hash.update(readFileSync(file));
  const version = hash.digest('hex').slice(0, 12);
  assert.equal((await import('../scripts/site/shell.mjs')).assetVersion(), version);
  // Everything the page script passes its ?v on to is part of the key.
  const passedOn = [...read(SITE_JS).matchAll(/import\(\s*'\.\/([\w.-]+)'\s*\+\s*v\s*\)/g)].map(match => `assets/${match[1]}`);
  assert.ok(passedOn.length >= 2);
  for (const file of [...passedOn, ...passedOn.flatMap(module => [...read(module).matchAll(/'\/(assets\/[\w.-]+)'\s*\+\s*new URL\(import\.meta\.url\)\.search/g)].map(match => match[1]))]) assert.ok(versioned.includes(file), `${file} is loaded with the shared key but is not hashed`);

  // Page-only scripts carry the same key, so editing one of them reaches visitors without a stale copy.
  for (const { prefix } of languages) for (const [path, script] of [['awards/', 'page-awards-20261124.js'], ['contact/', 'page-contact-20261124.js']]) {
    assert.ok(read(fileOf(prefix, path)).includes(`<script type="module" src="/assets/${script}?v=${version}"></script>`), `${prefix}${path} loads ${script} with the shared key`);
  }

  for (const { prefix, lang } of languages) for (const path of paths) {
    const file = fileOf(prefix, path), page = read(file);
    assert.ok(page.startsWith(`<!doctype html>\n<html lang="${lang}">`), file);
    assert.ok(page.includes(`<link rel="stylesheet" href="/${SITE_CSS}?v=${version}">`), file);
    assert.equal(count(page, /rel="stylesheet"/g), 1, file);
    assert.ok(page.includes(`<script type="module" src="/${SITE_JS}?v=${version}"></script>`), file);
    // Backdrop slot, skip link and main.
    assert.equal(count(page, /data-stage/g), 1, file);
    assert.match(block(page, 'data-stage'), /^<div\b[^>]*\sdata-stage aria-hidden="true"><canvas><\/canvas><\/div>$/, file);
    assert.ok(page.includes('<a class="skip-link" href="#main">'), file);
    assert.equal(count(page, /<main id="main">/g), 1, file);
    assert.equal(count(page, /<h1(?:\s|>)/g), 1, file);
    // Brand: the emblem as a plain image linking home. The black square logo stays the browser icon only.
    const header = block(page, '<header');
    assert.match(header, new RegExp(`<a class="brand" href="/${prefix}" aria-label="[^"]+"><img src="/assets/sportique-emblem-fallback\\.svg" alt=""[^>]*><span>SportiQue</span></a>`), file);
    assert.doesNotMatch(page, /<img\b[^>]*sportique-icon\.jpg/, file);
    assert.ok(page.includes('<link rel="icon" href="/assets/sportique-icon.jpg">'), file);
    // Footer: routes, the contact address and the switch that stops the background motion.
    const footer = block(page, '<footer');
    for (const route of ['products/', 'about/', 'vision/', 'founder/', 'awards/', 'contact/', 'institutions/']) assert.ok(footer.includes(`href="/${prefix}${route}"`), `${file} footer ${route}`);
    assert.ok(footer.includes('href="mailto:hello@sportique.biz">hello@sportique.biz</a>'), file);
    assert.match(footer, /<button type="button"[^>]*\sdata-motion-toggle>[^<]+<\/button>/, file);
    assert.equal(count(page, /data-motion-toggle/g), 1, file);
    assert.ok(page.includes(`href="https://org.sportique.biz/workspace${prefix ? '?lang=en' : ''}"`), file);
    assert.ok(page.includes(`aria-label="${said('모바일 메뉴', lang)}"`), file);
    // The old frame's files stay in the repository but no page points at them, and its markup hooks are gone.
    assert.doesNotMatch(page, /neon-site-|index-org-|sportique-emblem-3d|world-home-|world-hologram-|\/assets\/vendor\/|three\.(?:module|core)\.js/, file);
    assert.doesNotMatch(page, /class="eyebrow"|data-reveal|class="page-marker"|data-brand-emblem|class="logo-canvas"/, file);
    assert.ok(!page.includes('admin.sportique.biz'), file);
  }
  for (const file of koreanFiles) {
    const page = read(file);
    assert.ok(!page.includes('정리할 후보') && !page.includes('정리 후보'), file);
    assert.doesNotMatch(page, /(?<![가-힣])(?:내가|내 개인|내 기록|내 선택|내 건강기록|내 역할|나의 기록|나의 일상|우리가|저희)|MY RECORD|MY CHOICE/, file);
  }
});

test('every internal link, fragment and local file a page points to exists', () => {
  for (const file of allFiles) {
    const page = read(file);
    for (const [attribute, path] of localReferences(page)) {
      const target = path.endsWith('/') ? `${path.slice(1)}index.html` : path.slice(1);
      assert.ok(exists(target), `${file}: ${attribute}="${path}"`);
    }
    for (const [, path, fragment] of page.matchAll(/\shref="(\/[^"#]*)?#([^"]+)"/g)) {
      const target = path ? read(path.endsWith('/') ? `${path.slice(1)}index.html` : path.slice(1)) : page;
      assert.ok(target.includes(`id="${fragment}"`), `${file}: ${path ?? ''}#${fragment}`);
    }
    for (const [, target] of page.matchAll(/\s(?:src|href)="([^"]*)"/g)) assert.match(target, /^(?:\/(?!\/)|#|https:\/\/|mailto:)/, `${file}: ${target}`);
  }
});

test('company page keeps its reason to build, product roles, principles and direction in the original words', () => {
  const about = read('about/index.html');
  assert.match(about, twoLines('건강기록의 중심을,', '개인에게 돌려줍니다.'));
  assert.match(about, twoLines('주도권을', '기업에서 개인으로.'));
  // The old English caps labels (WHAT WE BUILD TODAY, OUR DIRECTION) named these two sections; their headings do now.
  assert.match(block(about, 'id="work"'), twoLines('하나의 기록 기반,', '서로 다른 삶의 쓰임.'));
  assert.match(about, twoLines('서비스와 나라가 달라져도,', '기록은 개인에게 이어지도록.'));
  for (const text of ['DataQ가 원본과 출처를 보존하면서 형식·항목·단위를 표준화하고, UniQdata가 기록을 개인 DB에서 관리합니다.', '복약 정보·활동 이력·진료·처방 기록', '병원·약국·앱에 흩어져', '어떤 기록을 가족 중 누구와 공유할지 선택할 서비스가 부족', '공유의 결정도, 개인이 직접.']) assert.ok(about.includes(text), text);
  for (const rejected of ['누군가를 더 잘 돌보려면', '주도권의 방향을']) assert.ok(!about.includes(rejected), rejected);
});

test('remaining public founder and award records preserve dates and metadata without promoting status', () => {
  for (const [key, path] of [['founder', 'founder/'], ['awards', 'awards/']]) for (const { prefix, lang } of languages) {
    const file = fileOf(prefix, path), page = read(file);
    // One list item per record, holding that record's own date, source, place, text and preparation start.
    const items = blocks(page, '<li class="tl-item"');
    assert.equal(items.length, publicRecords[key].length, `${file} count`);
    for (const record of publicRecords[key]) {
      const own = items.filter(item => item.includes(`<${key === 'awards' ? 'h2' : 'h3'}>${said(record.title, lang)}</${key === 'awards' ? 'h2' : 'h3'}>`));
      assert.equal(own.length, 1, `${file}: ${record.title}`);
      for (const field of ['date', 'meta', 'organizer', 'venue', 'body']) if (record[field]) assert.ok(own[0].includes(`>${said(record[field], lang)}<`), `${file}: ${record[field]}`);
      assert.equal(own[0].includes('<small>'), Boolean(record.started), `${file}: ${record.title} preparation start`);
      if (record.started) assert.ok(own[0].includes(`<small>${said(`준비 시작 ${record.started}`, lang)}</small>`), `${file}: ${record.started}`);
    }
  }
  assert.ok(!JSON.stringify(publicRecords).includes('피우다'));
  assert.ok(!JSON.stringify(publicRecords).includes('(2등)'));
  for (const file of koreanFiles) assert.ok(!read(file).includes('피우다'), file);
});

test('each product on the list links to its own detail page, and each detail gives an example and an honest status', () => {
  const page = read('products/index.html');
  assert.ok(!page.includes('institution-product-links'));
  for (const product of publicRecords.products) {
    const panel = block(page, `id="${product.id}"`);
    assert.ok(panel.startsWith('<section'), product.id);
    assert.ok(panel.includes(`>${escapeHtml(product.name)}</h2>`), product.id);
    // The old check asked for a visible detail button, a whole-card link and copy before media. A product now has one
    // visible link to its own detail page and no media at all.
    assert.match(panel, new RegExp(`<a class="link" href="/products/${product.id}/" aria-label="${escapeHtml(product.name)} 상세 보기">상세 보기 `), product.id);
    assert.equal(count(panel, /href="\/products\/[a-z]+\/"/g), 1, `${product.id}: links only to its own detail`);
    assert.doesNotMatch(panel, /<(?:img|svg|canvas|video|picture)\b/, `${product.id}: text only`);
    for (const value of [product.description, product.detail, ...product.features, ...product.modules]) assert.ok(panel.includes(escapeHtml(value)), value);
    const detail = read(`products/${product.id}/index.html`);
    assert.equal(visibleText(block(detail, '<h1')), product.name);
    assert.ok(detail.includes('활용 예시'));
    assert.ok(detail.includes('현재 범위'));
    for (const value of [product.description, product.detail, ...product.features]) assert.ok(detail.includes(escapeHtml(value)), value);
    assert.ok(detail.includes('href="/products/"'));
  }
  assert.ok(read('products/bodab/index.html').includes('지금은 준비 중이라 스토어에서 내려받을 수 없습니다'));
  const institution = read('institutions/index.html');
  assert.ok(institution.includes('https://org.sportique.biz/onboarding'));
  assert.ok(institution.includes('https://org.sportique.biz/workspace'));
  assert.ok(!institution.includes('href="https://web.uniqlab.io/"'));
  assert.doesNotMatch(institution, /<input\b/);
});

test('public details lead to the relevant institution product without promoting SOVI', () => {
  assert.ok(!home.includes('기관용 제품 상세 보기'));
  for (const slug of ['uniqlab', 'bodab']) assert.ok(read(`products/${slug}/index.html`).includes(`href="https://org.sportique.biz/products/${slug}"`));
  for (const file of allFiles) assert.doesNotMatch(read(file), /sovi_data_intelligence/i, file);
});

test('product page states each role and stage without presenting four equal products', () => {
  const page = read('products/index.html');
  assert.match(block(page, '<h1'), twoLines('개인이 기록을 모으고,', '활용을 선택합니다.'));
  for (const text of ['UniQdata는 흩어진 건강기록을 개인 DB에서 관리하는 출발점입니다.', '같은 기반의 어르신용 앱 Bodab과 동의한 연구를 운영하는 UniQLab을 소개합니다.', 'DataQ는 원본과 출처를 보존하면서 반입·표준화 후보를 만드는 내부 단계입니다.', 'Bodab은 어르신이 큰 글씨와 짧은 단계로', 'FamilyCare에서 동의 범위 안에서 확인할 수 있습니다.', 'UniQLab은 연구자와 기관이 연구 준비']) assert.ok(page.includes(text), text);
  assert.ok(!page.includes('YAKSON'));
  for (const rejected of ['연결되는 네 가지 제품', '가족의 하루를 챙기는 일까지', '고령자와 가족이 복약, 일정, 생활 상태를 함께 챙기는 가족 돌봄 앱']) assert.ok(!page.includes(rejected), rejected);
});

test('vision page shows a global direction with its country qualifier and without presenting a server footprint', () => {
  const page = read('vision/index.html');
  assert.match(page, twoLines('개인의 기록으로,', '세계를 잇습니다.'));
  assert.match(page, twoLines('흩어진 기록을', '개인에게 돌려줍니다.'));
  assert.match(page, twoLines('기록의 출발점은,', 'UniQdata.'));
  for (const text of ['저장·활용·공유의 선택은 그 사람에게 남습니다.', '나라가 달라도,', '세계를 잇는 비전을 위해']) assert.ok(page.includes(text), text);
  // The old numbered caps labels (01 / STORE, 02 / USE, 03 / CHOOSE) sat over these three headings, which keep the order.
  assert.deepEqual([...block(page, 'id="principles"').matchAll(/<h3>([^<]+)<\/h3>/g)].map(match => match[1]), ['모으고.', '활용하고.', '결정합니다.']);
  // The old atlas with its PERSONAL DB, CARE, CLINIC, AI and RESEARCH nodes is replaced by the world-lights map.
  // The qualifier stays in the same section as the map, right after it.
  const map = block(page, 'data-world-lights');
  const section = block(page, 'class="vision-world"');
  assert.ok(section.includes(map));
  assert.ok(section.indexOf('국가별 제공은 현지 정책과 데이터 보관 조건에 맞춰 검증합니다.') > section.indexOf(map));
  assert.doesNotMatch(page, /data-vision-map|data-personal-world|<svg\b[^>]*\brole="img"/);
  for (const rejected of ['확인된 서버 거점', 'US WEST', '현재 서비스 제공 국가', '전 세계 서비스 중', '세계는 서버의 지도']) assert.ok(!page.includes(rejected), rejected);
  assert.ok(page.includes('href="/vision/" aria-current="page">비전</a>'));
  assert.ok(json('assets/world-countries-20260921.json').countries.length >= 150);
});

test('pages read without scripts and nothing moves for a visitor who asked for reduced motion', () => {
  // The old check covered the 3D logo and the old world layer as progressive enhancement. There is no 3D now:
  // the logo is an image, the map has its words, and the only moving parts are the two canvases behind the motion
  // switch (behaviour in tests/motion.test.mjs and tests/world-lights.test.mjs).
  assert.ok(exists('assets/sportique-emblem-fallback.svg'));
  for (const file of runtimeScripts()) {
    assert.doesNotMatch(file, /neon-site|emblem-3d|world-home|world-hologram|assets\/vendor\//, `${file} belongs to the old frame`);
    assert.doesNotMatch(read(file), /(?:from|import)\s*\(?\s*['"`][^'"`]*three/, file);
  }
  for (const file of allFiles) for (const [, tag] of read(file).matchAll(/(<script\b[^>]*\ssrc=[^>]*>)/g)) assert.ok(tag.includes('type="module"'), `${file}: ${tag} would block rendering`);
  // The three.js copy is no longer loaded; while it stays in the repository its licence stays with it.
  if (exists('assets/vendor/three.module.js') || exists('assets/vendor/three.core.js')) assert.ok(exists('assets/vendor/LICENSE'));
  // Stylesheet: no keyframe animation, and every transition is inside a no-preference block.
  assert.doesNotMatch(css, /@keyframes|animation(?:-name)?\s*:|scroll-timeline|view-timeline|scroll-behavior\s*:\s*smooth/);
  const moving = rules.filter(rule => /transition(?:-[a-z]+)?\s*:/.test(rule.body));
  assert.ok(moving.length > 0);
  for (const { selector, context } of moving) assert.ok(context.some(media => /prefers-reduced-motion:\s*no-preference/.test(media)), `${selector} moves without asking`);
  // Korean lines break between words, and keyboard focus stays visible.
  assert.match(rules.find(rule => rule.selector === 'body' && !rule.context.length).body, /word-break:\s*keep-all/);
  assert.match(rules.find(rule => rule.selector === ':focus-visible').body, /outline:\s*2px solid/);
  assert.doesNotMatch(css, /outline(?:-width)?\s*:\s*(?:none|0)\b/);
});

test('product pages show only the registered next-version screens: no withdrawn hardware, mock screen or concept diagram', () => {
  for (const asset of ['yakson-evt-v3-frame-20260916.png', 'yakson-evt-v3-preview-20260916.mp4']) assert.ok(exists(`assets/verified/${asset}`), asset);
  const withScreens = ['', 'products/', 'products/uniqdata/'];
  for (const { prefix } of languages) for (const path of ['', 'products/', ...productIds.map(id => `products/${id}/`), 'products/uniqdata/now/']) {
    const file = fileOf(prefix, path), page = read(file), main = mainOf(page);
    for (const rejected of ['lab-window', 'lab-chart', 'care-orbit', 'care-center', 'device-sculpture', 'product-jump', 'value-visual', 'value-diagram', '2026.09 개방형 기구 V3 · 디지털 검토본', '완성 외관·실물 반복 작동·제조 적합성은 검증 전입니다']) assert.ok(!page.includes(rejected), `${file}: ${rejected}`);
    // Nothing is drawn to look like an app: the only pictures are the next-version screens, on the pages that show UniQdata.
    for (const src of images(main)) assert.match(src, nextShot, file);
    assert.equal(images(main).length > 0, withScreens.includes(path), `${file}: screens`);
    if (path) {
      assert.doesNotMatch(main, /<(?:canvas|video|picture|object|iframe)\b/, file);
      assert.doesNotMatch(main, /<svg\b|clipPath/, `${file}: the phones are plain images in a css frame`);
    }
  }
  // The pictures set aside earlier (development captures, the UniQLab table, the Bodab capture, the withdrawn hardware) are on no page at all.
  for (const file of allFiles) for (const rejected of ['yakson-evt-v3', 'yakson-designer-', 'uniqdata-home-dev-20260916.png', 'uniqlab-data-table-20260513.png', 'bodab-screen-20260922.png', 'uniqlab-screen-20260922.png', 'uniqdata-screen-20260922.webp', 'uniqdata-phone-', 'personal-data-vault', 'personal-data-atmosphere']) assert.ok(!read(file).includes(rejected), `${file}: ${rejected}`);
  for (const gone of ['assets/verified/uniqlab-screen-20260922.png', 'assets/verified/yakson-designer-exterior-20260922.png', 'assets/verified/yakson-designer-motion-20260922.mp4', 'assets/uniqdata-phone-1.png', 'assets/uniqdata-phone-2.png']) assert.ok(!exists(gone), gone);
});

test('founder page shows the AI-retouched portrait with its label, the current role and the selected awards', () => {
  const founder = read('founder/index.html');
  const portrait = block(founder, 'class="founder-portrait"');
  assert.ok(portrait.startsWith('<figure'));
  assert.match(portrait, /<img src="\/assets\/verified\/founder-portrait-retouched-20260923\.jpg" alt="SportiQue 이승헌 대표 프로필 사진, AI 보정본"/);
  assert.match(portrait, /<figcaption[^>]*>이승헌 · SportiQue · AI 보정 사진<\/figcaption>/);
  assert.ok(exists('assets/verified/founder-portrait-retouched-20260923.jpg'));
  assert.ok(exists('assets/verified/founder-portrait-20260922.jpg'));
  assert.ok(founder.includes('이승헌 · Founder, CEO &amp; CTO'));
  assert.match(founder, twoLines('문제를 이해하고,', '제품으로 구현합니다.'));
  for (const focus of ['제품 방향과 설계', '앱·서버·AI 구현', '기관과 현장 협업']) assert.ok(founder.includes(`<h3>${focus}</h3>`), focus);
  for (const rejected of ['class="founder-symbol"', 'Founder &amp; Representative', '직접 <em>만드는 사람.</em>', 'UCL TIDH 2026 확장초록 제출', 'User-Journey and Information-Processing Design of an App–Server–Device Medication Platform for Older Adults', 'YAKSON', 'ACK 2026 약손 단독저자 논문 제출', '몽골 현장 조사와 기관 후속 협의', '2026.08 초', '베이징 PKU 창업·AI 교육 및 IR 캠프 참여', '8월 4일 IR 피칭', '샌프란시스코 SF Camp 참여', '한중 청년 창업훈련캠프 참가·수료', '북경대 창업훈련캠프 한국 교류일 참여', '2025 학생 창업유망팀 300+ 성장트랙 최종선정']) assert.ok(!founder.includes(rejected), rejected);
  for (const text of ['ZeroBase SF Camp 참여', '2026.02.03-02.05', '벤처프런티어 창업 활동', '2026 적정기술 기반 청년 창업 글로벌 실증 지원사업 몽골팀', '법인 설립 전인 4월부터 팀으로 신청을 준비했고', '산학협동재단 / 대학산업기술지원단 / 적정기술학회']) assert.ok(founder.includes(text), text);
  assert.ok(read('awards/index.html').includes('ZeroBase SF Camp 참가'));
  assert.equal(publicRecords.founder.filter(record => record.title === '북경대 창업훈련캠프').length, 1);
  assert.deepEqual([...block(founder, 'id="experience"').matchAll(/<time\b[^>]*>([^<]+)/g)].slice(0, 2).map(match => match[1]), ['현재', '현재']);
  const featured = publicRecords.awards.filter(record => record.founderHighlight);
  assert.equal(featured.length, 3);
  const honors = block(founder, 'class="honors"');
  assert.equal(count(honors, /<li>/g), featured.length);
  for (const record of featured) { assert.ok(honors.includes(escapeHtml(record.title)), record.title); assert.ok(honors.includes(escapeHtml(record.founderHighlight)), record.title); }
  assert.ok(honors.includes('href="/awards/"'));
  assert.ok(founder.includes('href="mailto:daniel@sportique.biz"'));
});

test('contact page shows every action without a disclosure and keeps institution login out of its content', () => {
  const contact = read('contact/index.html'), main = mainOf(contact);
  for (const rejected of ['기관 계정 로그인', 'https://org.sportique.biz/products/uniqlab', 'https://org.sportique.biz/workspace', 'mailto:daniel@sportique.biz', '<details']) assert.ok(!main.includes(rejected), rejected);
  // The old markup had two option cards and a filled onboarding link. Now: one row per way to reach us, each with its own actions.
  const ways = [...main.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(match => match[0]);
  assert.equal(ways.length, 3);
  for (const [index, address] of ['hello@sportique.biz', 'support@sportique.biz'].entries()) {
    const way = ways[index];
    assert.ok(visibleText(way).includes(address), `${address} is shown as text`);
    assert.ok(way.includes(`href="https://mail.google.com/mail/?view=cm&amp;fs=1&amp;to=${address.replace('@', '%40')}&amp;su=`), address);
    assert.ok(way.includes(`href="mailto:${address}?subject=`), address);
    assert.match(way, new RegExp(`<button type="button"[^>]* data-copy-email="${address}">`), address);
    // The result of copying is announced next to the button that was pressed.
    assert.ok(way.includes('data-copy-group') && /role="status"[^>]*data-copy-status/.test(way), address);
  }
  assert.match(ways[2], /<a class="btn btn--primary[^"]*" href="https:\/\/org\.sportique\.biz\/onboarding">기관 도입 신청하기 /);
  const address = block(main, 'class="address-display"');
  assert.equal(visibleText(address), 'hello@sportique.biz');
  for (const [, group] of main.matchAll(/data-copy-email="([^"]+)"/g)) assert.match(group, /^(?:hello|support)@sportique\.biz$/);
  assert.equal(count(main, /data-copy-email=/g), 3);
  assert.match(main, /<script type="module" src="\/assets\/page-contact-20261124\.js\?v=[0-9a-f]{12}"><\/script>/);
  assert.ok(read('assets/page-contact-20261124.js').includes('navigator.clipboard.writeText'));
  assert.ok(contact.includes('mailto:hello@sportique.biz">hello@sportique.biz</a>'));
});

test('awards swap the Mongolia visit and incorporation cards while preserving their dates', () => {
  const page = read('awards/index.html');
  assert.equal(count(page, /<ol class="timeline">/g), 1);
  const rendered = [...page.matchAll(/<time\b[^>]*>([^<]+)(?:<small>[^<]+<\/small>)?<\/time>/g)].map(match => match[1]);
  const expected = [...publicRecords.awards].sort((a, b) => b.sortDate - a.sortDate).map(record => record.date);
  const visit = expected.indexOf('2026.07.27-07.31'), incorporation = expected.indexOf('2026.06.01');
  assert.ok(visit >= 0 && incorporation >= 0);
  [expected[visit], expected[incorporation]] = [expected[incorporation], expected[visit]];
  assert.deepEqual(rendered, expected);
  assert.ok(page.indexOf('스포티큐 주식회사 설립') < page.indexOf('몽골 현지 프로그램 참가'));
  // The old caps label read "MILESTONES / HISTORY", never "LATEST FIRST": with the swap the list is not strictly newest first.
  assert.doesNotMatch(page, /LATEST FIRST|최신순/);
  assert.ok(rendered.includes('2026.05'));
  assert.ok(!page.includes('2026.05.01'));
  for (const text of ['준비 시작 2026.04 · 법인 설립 전', '준비 시작 2026.07', '법인 설립 전 SportiQue 팀 활동부터', `공개 기록 ${publicRecords.awards.length}건`]) assert.ok(page.includes(text), text);
  // One list item per record, each in a category that has a filter; the count is announced when the filter changes.
  const categories = [...page.matchAll(/<li class="tl-item" data-category="([^"]+)"/g)].map(match => match[1]);
  assert.equal(categories.length, publicRecords.awards.length);
  for (const category of new Set(categories)) assert.match(page, new RegExp(`<button type="button"[^>]* data-filter="${category}" aria-pressed="false">`), `${category} filter`);
  assert.match(page, /<button type="button"[^>]* data-filter="all" aria-pressed="true">/);
  assert.match(page, /<p\b[^>]* id="record-count" aria-live="polite">공개 기록 \d+건<\/p>/);
  assert.match(page, /<script type="module" src="\/assets\/page-awards-20261124\.js\?v=[0-9a-f]{12}"><\/script>/);
  // The filter hides records with the hidden attribute, so the list item's own display rule must not override it.
  assert.ok(rules.some(rule => rule.selector === '.tl-item[hidden]' && /display:\s*none/.test(rule.body)));
  // Evidence: the photo is shown, never linked, and keeps its proportions; outside links are https.
  const evidence = publicRecords.awards.filter(record => record.evidence);
  assert.equal(evidence.length, 4);
  assert.equal(count(page, /class="tl-evidence"/g), evidence.length);
  assert.match(rules.filter(rule => /\.tl-proof\s+img$/.test(rule.selector)).map(rule => rule.body).join(';'), /height:\s*auto|object-fit:\s*cover/);
  assert.ok(!page.includes('student-300plus-20251017.webp'));
  assert.ok(!exists('assets/verified/awards/student-300plus-20251017.webp'));
  for (const record of evidence) {
    if (record.evidence.image) {
      assert.ok(page.includes(`<img src="${record.evidence.image}" alt="${escapeHtml(record.evidence.imageAlt)}"`), record.title);
      assert.ok(!page.includes(`href="${record.evidence.image}"`), `${record.title} photo must not open`);
      assert.ok(exists(record.evidence.image.slice(1)));
    }
    for (const link of record.evidence.links ?? []) { assert.ok(link.href.startsWith('https://')); assert.ok(page.includes(`href="${link.href}"`), link.href); }
  }
  for (const [figure] of page.matchAll(/<figure\b[\s\S]*?<\/figure>/g)) assert.ok(!figure.includes('<a '), 'a proof photo is not a link');
  const preLeague = publicRecords.awards.find(record => record.title === '호서대학교 ‘모두의 창업 Pre-League’ 대상');
  assert.equal(preLeague?.category, 'award');
  assert.equal(preLeague?.date, '2026.09.14');
  assert.ok(preLeague?.body.includes('본사업 선정과는 별개의 수상'));
  assert.ok(!preLeague?.founderHighlight);
  assert.ok(page.includes('호서대학교 ‘모두의 창업 Pre-League’ 대상'));
  assert.ok(page.indexOf('호서대학교 ‘모두의 창업 Pre-League’ 대상') < page.indexOf('2026 AI·데이터 문제해결은행 DX 적용지원 선정'));
  assert.ok(page.includes('href="https://magazine.hankyung.com/job-joy/article/202609156830d"'));
});

test('legal and medical qualifiers stay on the pages they qualify, in Korean and in English', () => {
  const exampleScreens = '준비 중인 다음 버전의 디자인이며, 지금 스토어의 앱과 화면이 다릅니다. 화면 속 이름과 수치는 예시이며 실제 사용자의 기록이 아닙니다.';
  const notDiagnosis = '리포트와 AI 답변은 진단을 대신하지 않습니다.';
  const sharingDesign = ['SportiQue의 공유 아키텍처는 개인의 기록 보관, 동의와 권한, 블록체인 기반 증빙 검증을 분리합니다. 건강기록 원문과 복호화 키를 공개 원장에 올리는 방식이 아닙니다.', '수신자의 권한과 키를 확인하고, 허용된 범위의 암호화 전달을 연결하는 설계입니다.'];
  const studyAccess = 'UniQLab.io에서는 참여자가 동의한 연구 목적과 범위 안에서 기록을 연결합니다. 기관 계정만으로 개인 기록에 접근할 수 있는 것은 아닙니다.';
  const familyAccess = 'Bodab에서 남긴 기록은 어르신이 허용한 범위 안에서 가족과 연결됩니다. 가족 공유와 기관의 돌봄 업무 권한은 구분됩니다.';
  const qualifiers = {
    '': [exampleScreens, notDiagnosis, '모든 활용은 개인이 정한 대상·목적·범위·기간과 국가별 정책 조건 안에서만 이뤄집니다.', '국가별 정책·데이터 레지던시 조건을 통과한 범위에서, 허용한 기록만 필요한 곳에 연결합니다.', '연구 목적과 요청 항목·기간을 보고 직접 선택합니다. 참여 보상은 연구기관·PI 등 지급 주체가 정한 방식으로 처리되고, 개인은 관련 이력을 확인합니다.'],
    'products/': [exampleScreens, notDiagnosis, ...sharingDesign, studyAccess, familyAccess, '개인이 연구 참여와 공유 범위를 선택한 뒤 연결되는 활용처입니다.'],
    'products/uniqdata/': [exampleScreens, notDiagnosis, ...sharingDesign],
    'products/uniqlab/': [...sharingDesign, studyAccess, '연구팀과 기관을 위한 운영 도구로 개발하고 있습니다. 개인의 기록은 동의한 목적과 범위 밖으로 자동 공유되지 않습니다.'],
    'products/bodab/': [...sharingDesign, familyAccess, 'Bodab은 어르신이 직접 쓰는 앱으로, 지금은 준비 중이라 스토어에서 내려받을 수 없습니다. 기관의 돌봄 요청·담당자 배정 업무는 이 앱의 범위가 아닙니다.'],
    'products/uniqdata/now/': ['모든 숫자는 서버가 센 실제 값이에요. 개인을 알아볼 수 있는 정보는 없어요.'],
    'about/': ['대학·연구기관·기업이 보유한 자료와 기록 수집 업무를 확인하고, 개인의 동의와 기존 운영 환경에 맞는 적용을 함께 준비합니다. 현장별 범위와 연동 가능성은 협의와 실증으로 확인합니다.', '몽골의 대학·연구 환경을 대상으로 자료 정리와 연구 운영 실증을 준비하는 적용안을 만들고 있습니다. 실제 운영과 확대 범위는 실증에서 확인할 과제입니다.', '연구에서 생긴 개인 기록도 다시 개인에게 돌아오고, 다음 활용은 새로운 동의에서 시작하는 방향을 지향합니다. 국가별 적용은 현지 정책과 데이터 보관 조건에 맞춰 검증합니다.'],
    'vision/': ['연결의 방향을 보여 주는 비전 시각화입니다. 국가별 제공은 현지 정책과 데이터 보관 조건에 맞춰 검증합니다.'],
    'founder/': ['SportiQue 이승헌 대표 프로필 사진, AI 보정본', '이승헌 · SportiQue · AI 보정 사진'],
    'awards/': [publicRecords.awards.find(record => record.body.includes('본사업 선정과는 별개의 수상')).body],
  };
  for (const { prefix, lang } of languages) for (const [path, sentences] of Object.entries(qualifiers)) {
    const file = fileOf(prefix, path), page = read(file);
    for (const sentence of sentences) assert.ok(page.includes(said(sentence, lang)), `${file}: ${sentence}`);
  }
  // Wording the English must keep, whatever else changes in the translation. 'non-diagnostic' is not kept: that sentence left with the old report screen, and one sentence now qualifies the report and the AI answers together.
  for (const [path, phrases] of Object.entries({ '': ['not real user records', 'does not replace a diagnosis'], 'products/': ['does not replace a diagnosis'], 'products/uniqdata/': ['does not replace a diagnosis'], 'products/uniqlab/': ['decryption keys stay outside the public ledger', 'does not grant access to personal records', 'not automatically shared'], 'about/': ['remain to be tested in the pilot', 'assessed against local policies'], 'vision/': ['assessed against local policies and data storage requirements'], 'founder/': ['AI-retouched photo', 'retouched with AI'] })) {
    const page = read(fileOf('en/', path));
    for (const phrase of phrases) assert.ok(page.includes(phrase), `en/${path}: ${phrase}`);
  }
});

test('published media hashes match the provenance manifest and rejected mocks remain recorded', () => {
  const manifest = json('assets/verified/asset-provenance.json');
  const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
  for (const asset of manifest.assets) { const path = asset.public_path.slice(1); assert.ok(exists(path), path); assert.equal(sha(path), asset.sha256, path); }
  for (const blocked of ['934864ba68c485a9adf4470280316ab4b8cf84277cc4eedb783cd97d748800d6', 'f4db41857b81b5ac42d35140d22601acf512ad7291003d424309921185a812c9', 'ec8a1752a1c4128677de07c65bb3f84f497dff458e3fddc067f27a4772b9c67f', 'c11ead23eb8407fc8b98034ab5ffdd7dfa5426218f723a4d99b27df7cdc35952', 'be175158cab91f42a4465aa4181f96365062945147599403b5b0d80874bcc8de', '7fce453f8386d58fdfb936ae4127960d129d1071367e55ab13fd2be7eebd85be']) assert.ok(manifest.blocked_assets.some(asset => asset.sha256 === blocked), blocked);
  // Every verified picture a page shows is registered, and no page shows a blocked one under its old or a new name.
  const registered = new Set(manifest.assets.map(asset => asset.public_path));
  const blockedHashes = new Set(manifest.blocked_assets.map(asset => asset.sha256));
  for (const file of allFiles) {
    const page = read(file);
    for (const blocked of manifest.blocked_assets) assert.ok(!page.includes(blocked.former_path), `${file}: ${blocked.former_path} is a blocked asset`);
    for (const [, path] of localReferences(page)) {
      if (!/\.(?:png|jpe?g|webp|gif|avif|mp4|webm)$/.test(path)) continue;
      if (path.startsWith('/assets/verified/')) assert.ok(registered.has(path), `${file}: ${path} has no provenance entry`);
      assert.ok(!blockedHashes.has(sha(path.slice(1))), `${file}: ${path} is a blocked asset`);
    }
  }
});

// The order in which a study runs (UniQLab proposal, review, consent in UniQdata, connection, operation, records stay with the person).
const flowSteps = [
  ['연구기관이 UniQLab에서', '연구를 제안합니다.', '연구 목적, 요청 항목, 기간, 대상자 조건을 정해 제출합니다.'],
  ['SportiQue가', '제안을 검토합니다.', '검토를 마친 연구만 참여자에게 열립니다.'],
  ['개인이 UniQdata에서', '요청을 보고 동의합니다.', '연구 목적과 요청 항목·기간을 보고 직접 선택합니다. 연구마다 따로 동의하고, 철회하면 새로운 사용은 바로 멈춥니다.'],
  ['두 제품 사이에서', '동의한 범위의 기록만 연결됩니다.', '기관 계정만으로는 개인 기록에 접근할 수 없습니다.'],
  ['연구기관이 UniQLab에서', '참여와 기록 현황을 확인합니다.', '동의 현황, 과제와 알림, 기록이 들어온 현황을 한곳에서 봅니다.'],
  ['개인이 UniQdata에서', '연구가 끝나도 기록을 계속 가집니다.', '같은 기록으로 다음 연구나 다른 활용을 다시 선택합니다.'],
];
const flowNote = 'UniQLab과 앱의 연구 참여 기능은 개발 중이며, 위 순서는 현재 설계 기준입니다.';
function assertFlow(html, lang, where) {
  const list = block(html, 'class="flow"');
  assert.ok(list.includes(`aria-label="${said('연구가 진행되는 순서', lang)}"`), where);
  const items = [...list.matchAll(/<li class="flow-step flow-step--(lab|person|core)"><span class="flow-n" aria-hidden="true">(\d)<\/span><div class="flow-card"><p class="flow-who">([^<]*)<\/p><h3>([^<]*)<\/h3><p>([^<]*)<\/p><\/div><\/li>/g)].map(match => match.slice(1));
  assert.deepEqual(items, flowSteps.map(([who, title, body], index) => [['lab', 'core', 'person', 'core', 'lab', 'person'][index], String(index + 1), said(who, lang), said(title, lang), said(body, lang)]), where);
  assert.ok(html.includes(`>${said(flowNote, lang)}</p>`), `${where}: the flow says UniQLab is in development`);
  assert.ok(html.includes(said('기관 계정만으로는 개인 기록에 접근할 수 없습니다.', lang)), where);
  assert.doesNotMatch(list, /<(?:img|canvas|video|picture|svg)\b/, `${where}: the flow is words only`);
}

test('home shows the study flow after the app, below the products, with UniQLab marked as in development', () => {
  for (const { prefix, lang } of languages) {
    const page = read(fileOf(prefix, ''));
    assert.ok(page.indexOf('id="products"') < page.indexOf('id="uniqdata-app"') && page.indexOf('id="uniqdata-app"') < page.indexOf('id="research"') && page.indexOf('id="research"') < page.indexOf('id="story"'), `${prefix}home: order`);
    const research = block(page, 'id="research"');
    assert.match(research, twoLines(said('연구기관은 UniQLab에서,', lang).replaceAll('&amp;', '&'), said('개인은 UniQdata에서.', lang).replaceAll('&amp;', '&')));
    assertFlow(research, lang, `${prefix}home`);
    assert.ok(research.includes(`>${said('개발 중', lang)}</p>`), `${prefix}home: in development mark`);
    assert.ok(research.includes(`href="/${prefix}contact/"`) && research.includes(`href="/${prefix}products/uniqlab/"`), `${prefix}home: both ways on`);
    assert.doesNotMatch(research, /<(?:img|canvas|video|svg)\b/, prefix);
    assert.ok(block(page, '<section').includes('href="#research"'), `${prefix}home: the first screen leads to the flow`);
  }
});

test('the product list and the UniQLab page show the same study flow', () => {
  for (const { prefix, lang } of languages) {
    assertFlow(block(read(fileOf(prefix, 'products/')), 'id="uniqlab"'), lang, `${prefix}products`);
    assertFlow(mainOf(read(fileOf(prefix, 'products/uniqlab/'))), lang, `${prefix}products/uniqlab`);
  }
});
