// What is live, being built or planned: every status mark on the home and product pages, in Korean and English.
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, count, block, blocks, mainOf, visibleText, twoLines, said, fileOf, languages } from './support.mjs';

// Status tags inside a piece of html: [{ label, live }] in page order.
const marks = html => [...html.matchAll(/<p class="tag">(<span class="tag-dot" aria-hidden="true"><\/span>)?([^<]+)<\/p>/g)].map(match => ({ label: match[2], live: Boolean(match[1]) }));
const mark = (label, lang) => ({ label: said(label, lang), live: label === '서비스 중' });
const text = (html, lang, korean) => visibleText(html).includes(visibleText(said(korean, lang)));

const sectionOrder = ['id="hero-title"', 'id="world"', 'id="shift"', 'id="problem"', 'id="system"', 'id="value"', 'id="products"', 'id="uniqdata-app"', 'id="research"', 'id="story"', 'id="collaboration"'];
const shiftRows = [
  ['기록은 병원과 서비스마다 따로 남습니다.', '개인이 한곳에 모아 관리합니다.', '서비스 중'],
  ['연구가 끝나면 참여자와의 연결도 끝납니다.', '연구가 끝나도 기록은 개인에게 남습니다.', '개발 중'],
  ['병원이나 나라를 옮기면 기록이 끊깁니다.', '옮겨도 이어 쓰는 기록을 목표로 합니다.', '계획'],
];
const uses = [
  ['개인은 기록을 리포트로 확인합니다.', '쌓인 기록을 기간별 비진단 요약으로 다시 확인합니다.', '서비스 중'],
  ['개인은 자신의 기록을 바탕으로 AI에 질문합니다.', '궁금한 건강정보를 대화로 확인합니다. 진단을 대신하지 않습니다.', '서비스 중'],
  ['보호자에게 필요한 기록만 공유합니다.', null, '계획'],
  ['해외에서도 필요한 기록을 꺼내 씁니다.', null, '계획'],
  ['참여할 연구와 공유할 기록을 고릅니다.', null, '개발 중'],
  ['돌봄·복약 앱에 기록을 연결합니다.', null, '계획'],
  ['이용 이력을 다시 확인합니다.', null, '개발 중'],
];
const productStatus = { uniqdata: '서비스 중', uniqlab: '개발 중', bodab: '준비 중' };
const oldSentences = ['MediQ와 MindQ는 UniQdata 안에서 열리는 인앱 경험', '운영 도구입니다.', 'MediQ and MindQ are in-app experiences within', 'An operations tool for research teams'];

test('home sections run hero, world, vision, problem, system, value, products, app, study flow, story, collaboration', () => {
  for (const { prefix } of languages) {
    const home = read(fileOf(prefix, ''));
    let last = -1;
    for (const marker of sectionOrder) { const at = home.indexOf(marker); assert.ok(at > last, `${prefix}${marker}`); last = at; }
  }
});

test('the vision section sets three contrasts in order, each with its status', () => {
  for (const { prefix, lang } of languages) {
    const home = read(fileOf(prefix, ''));
    const shift = block(home, 'id="shift"');
    assert.match(shift, twoLines(said('기관 중심에서,', lang), said('개인 중심으로.', lang).replaceAll('&amp;', '&')));
    assert.deepEqual(marks(shift.split('<ul class="shift"')[0]).map(m => m.label), [said('비전', lang)], prefix);
    assert.ok(shift.includes(`aria-label="${said('지금까지와 SportiQue가 만드는 것', lang)}"`), prefix);
    assert.ok(text(shift, lang, '건강기록은 지금까지 기관마다 따로 쌓였습니다. SportiQue는 그 중심을 기록의 주인인 개인으로 옮깁니다.'), prefix);
    const items = blocks(shift, '<li>');
    assert.equal(items.length, 3, prefix);
    items.forEach((item, index) => {
      const [from, to, status] = shiftRows[index];
      assert.equal(visibleText(block(item, 'class="shift-from"')), `${said('지금까지', lang)} ${said(from, lang)}`, `${prefix}row ${index}`);
      assert.equal(visibleText(block(item, 'class="shift-to"')), `${said('SportiQue가 만드는 것', lang)} ${said(to, lang)} ${said(status, lang)}`, `${prefix}row ${index}`);
      assert.deepEqual(marks(item), [mark(status, lang)], `${prefix}row ${index}`);
    });
  }
});

test('the three steps carry DataQ in development, UniQdata live and the choice in development', () => {
  for (const { prefix, lang } of languages) {
    const system = block(read(fileOf(prefix, '')), 'id="system"');
    const steps = blocks(system, '<li>').map(item => marks(item));
    assert.deepEqual(steps, [['개발 중'], ['서비스 중'], ['개발 중']].map(([label]) => [mark(label, lang)]), prefix);
  }
});

test('each of the seven uses carries its own status: two live, two in development, three planned', () => {
  for (const { prefix, lang } of languages) {
    const value = block(read(fileOf(prefix, '')), 'id="value"');
    const items = blocks(value, '<li>');
    assert.equal(items.length, 7, prefix);
    items.forEach((item, index) => {
      const [title, body, status] = uses[index];
      assert.ok(text(block(item, '<h3'), lang, title), `${prefix}${title}`);
      if (body) assert.ok(text(item, lang, body), `${prefix}${body}`);
      assert.deepEqual(marks(item), [mark(status, lang)], `${prefix}${title}`);
    });
    assert.ok(text(value, lang, '기록이 모이면 쓸 수 있는 길이 늘어납니다.'), prefix);
    assert.ok(text(value, lang, '모든 활용은 개인이 정한 대상·목적·범위·기간과 국가별 정책 조건 안에서만 이뤄집니다.'), prefix);
  }
});

test('the product section has four tiles with their status; the sub-app and SDK tile is not a link', () => {
  for (const { prefix, lang } of languages) {
    const products = block(read(fileOf(prefix, '')), 'id="products"');
    const tiles = blocks(products, 'class="tile tile--link');
    assert.equal(tiles.length, 4, prefix);
    const expected = [['uniqdata', '서비스 중'], ['uniqlab', '개발 중'], ['bodab', '준비 중'], [null, '개발 중']];
    tiles.forEach((tile, index) => {
      assert.deepEqual(marks(tile), [mark(expected[index][1], lang)], `${prefix}tile ${index}`);
      if (expected[index][0]) assert.ok(tile.startsWith(`<a class="tile tile--link" href="/${prefix}products/${expected[index][0]}/"`), `${prefix}tile ${index}`);
    });
    const last = tiles[3];
    assert.ok(last.startsWith('<div class="tile tile--link tile--static">') && !last.includes('href='), prefix);
    assert.equal(visibleText(block(last, '<h3')), said('서브앱과 SDK', lang));
    assert.ok(text(last, lang, '다른 개발사의 서비스가 같은 동의 구조 위에서 열리는 길을 만들고 있습니다.'), prefix);
  }
});

test('the live mark appears only on what is live: UniQdata and the items that work today', () => {
  for (const { prefix, lang } of languages) {
    const home = mainOf(read(fileOf(prefix, '')));
    const live = marks(block(home, 'id="shift"')).filter(m => m.live).length + marks(block(home, 'id="value"')).filter(m => m.live).length;
    assert.equal(live, 1 + 2, `${prefix}shift 1, value 2`);
    for (const id of ['uniqlab', 'bodab']) {
      // The study-flow lanes name UniQdata (live) beside UniQLab; they are the only live mark a UniQLab page may hold.
      const page = mainOf(read(fileOf(prefix, `products/${id}/`))).replace(/<div class="flow-lanes"[\s\S]*?<\/div><\/div>(?=<ol)/, '');
      assert.ok(marks(page).every(m => !m.live), `${prefix}${id} page has no live mark`);
    }
    const list = read(fileOf(prefix, 'products/'));
    for (const id of ['uniqlab', 'bodab']) {
      const section = block(list, `id="${id}"`);
      assert.ok(marks(section.replace(/<div class="flow-lanes"[\s\S]*?<\/div><\/div>(?=<ol)/, '')).every(m => !m.live), `${prefix}${id} block has no live mark`);
      assert.deepEqual(marks(block(section, 'class="name-line"')), [mark(productStatus[id], lang)], `${prefix}${id}`);
    }
    assert.deepEqual(marks(block(block(list, 'id="uniqdata"'), 'class="name-line"')), [mark('서비스 중', lang)], prefix);
  }
});

test('product list and details show each product status, the planned MediQ and MindQ line and the new scope sentences', () => {
  const scope = {
    uniqlab: '연구팀과 기관을 위한 운영 도구로 개발하고 있습니다. 개인의 기록은 동의한 목적과 범위 밖으로 자동 공유되지 않습니다.',
    bodab: 'Bodab은 어르신이 직접 쓰는 앱으로, 지금은 준비 중이라 스토어에서 내려받을 수 없습니다.',
  };
  for (const { prefix, lang } of languages) {
    const list = read(fileOf(prefix, 'products/'));
    for (const [id, status] of Object.entries(productStatus)) {
      assert.deepEqual(marks(block(block(list, `id="${id}"`), 'class="name-line"')), [mark(status, lang)], `${prefix}list ${id}`);
      const detail = mainOf(read(fileOf(prefix, `products/${id}/`)));
      assert.deepEqual(marks(block(detail, 'class="name-line"')), [mark(status, lang)], `${prefix}detail ${id}`);
      assert.ok(detail.indexOf('class="name-line"') < detail.indexOf('class="lead'), `${prefix}${id}: status sits at the product name`);
    }
    for (const html of [block(list, 'id="uniqdata"'), mainOf(read(fileOf(prefix, 'products/uniqdata/')))]) {
      assert.ok(text(html, lang, 'DataQ는 원본과 출처를 보존하면서 기록의 형식·항목·단위를 맞추는 단계입니다. MediQ와 MindQ는 이후 UniQdata 안에서 열 인앱 경험으로 계획하고 있습니다.'), prefix);
      const modules = block(html, 'class="note-status"');
      assert.deepEqual(marks(modules), [mark('계획', lang)], prefix);
      assert.ok(html.indexOf('class="note"') < html.indexOf('class="note-status"'), prefix);
      const question = blocks(html, 'class="with-status"');
      assert.equal(question.length, 1, prefix);
      assert.equal(visibleText(question[0]), `${said('진료 전 질문 준비', lang)} ${said('계획', lang)}`, prefix);
    }
    for (const [id, sentence] of Object.entries(scope)) assert.ok(text(mainOf(read(fileOf(prefix, `products/${id}/`))), lang, sentence), `${prefix}${id}`);
  }
});

test('the old present-tense sentences are gone from the home and product pages', () => {
  for (const { prefix } of languages) for (const path of ['', 'products/', 'products/uniqdata/', 'products/uniqlab/', 'products/bodab/']) {
    const html = read(fileOf(prefix, path));
    for (const old of oldSentences) assert.ok(!html.includes(old), `${prefix}${path}: ${old}`);
  }
});

test('the status helper knows four words and only "서비스 중" is live', async () => {
  const { statusTag, statuses } = await import('../scripts/site/ui.mjs');
  assert.deepEqual(statuses, ['서비스 중', '개발 중', '준비 중', '계획']);
  assert.equal(statusTag('서비스 중'), '<p class="tag"><span class="tag-dot" aria-hidden="true"></span>서비스 중</p>');
  for (const label of ['개발 중', '준비 중', '계획']) assert.equal(statusTag(label), `<p class="tag">${label}</p>`);
  assert.throws(() => statusTag('운영 중'));
  assert.equal(count(statusTag('계획'), /tag-dot/g), 0);
});

test('the home network section states the hourly evidence record once, as a live fact under a planned heading', () => {
  const sentences = {
    ko: '동의와 이용 이력의 증빙은 한 시간 단위로 묶어, 그 요약값만 XRPL 메인넷에 기록합니다. 건강기록 원문과 개인별 기록은 올리지 않습니다.',
    en: 'Evidence of consent and use history is grouped into hourly batches, and only a digest of each batch is recorded on the XRPL mainnet. Original health records and per-person records are not uploaded.',
  };
  for (const { prefix, lang } of languages) {
    const home = read(fileOf(prefix, ''));
    const world = block(home, 'id="world"');
    assert.equal(count(world, /class="ledger-fact"/g), 1, prefix);
    const fact = block(world, 'class="ledger-fact"');
    assert.deepEqual(marks(fact), [mark('서비스 중', lang)], prefix);
    assert.equal(visibleText(fact.match(/<p>([^<]*)<\/p>/)[1]), visibleText(sentences[lang]), prefix);
    const at = world.indexOf('class="ledger-fact"');
    assert.ok(world.lastIndexOf('</p>', at) > world.indexOf('<h2'), `${prefix} after the section paragraph`);
    assert.ok(at < world.indexOf('/vision/'), `${prefix} before the vision link`);
    assert.deepEqual(marks(block(world, 'class="name-line"')), [{ label: said('네트워크', lang), live: false }, mark('계획', lang)], `${prefix} heading stays planned`);
    assert.equal(count(visibleText(home), new RegExp(sentences[lang].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')), 1, `${prefix} once`);
    const plain = visibleText(fact);
    for (const word of ['보상', '코인', '토큰', '지갑', 'reward', 'coin', 'token', 'wallet']) assert.ok(!plain.toLowerCase().includes(word), `${prefix} ${word}`);
    assert.ok(!/XRP(?!L)/.test(plain), `${prefix} bare XRP`);
  }
});

test('the 2025 demo is told without a reward claim, and no paragraph that names the ledger mentions rewards or coins', () => {
  const demo = {
    '': { ko: '2025년 XRPL 데모에서 사용자는 공유할 기록과 열람 기간을 선택하고, 허용된 접근·활용 이력을 확인했습니다.', en: 'In our 2025 XRPL demo, users selected which records to share and how long others could view them, and reviewed authorized access and use history.' },
    'about/': { ko: '2025년 XRPL 데모에서는 사용자가 공유 범위와 열람 기간을 직접 정하고, 접근·활용 이력을 확인하는 흐름을 구현했습니다. 건강기록 원문은 개인 DB에 두었습니다.', en: 'Our 2025 XRPL demo let users choose sharing scope and access duration and review access and use history. Original health records remained in the personal database.' },
  };
  for (const { prefix, lang } of languages) {
    for (const [page, sentence] of Object.entries(demo)) {
      const html = read(fileOf(prefix, page));
      assert.ok(visibleText(html).includes(visibleText(sentence[lang])), `${prefix}${page} demo sentence`);
      const named = [...html.matchAll(/<p[^>]*>([^<]*XRPL[^<]*)<\/p>/g)].map(match => match[1]);
      assert.ok(named.length > 0, `${prefix}${page} has a paragraph naming the ledger`);
      for (const paragraph of named) assert.doesNotMatch(paragraph, /보상|코인|토큰|지갑|reward|compensation|payout|coin|token|wallet|XRP(?!L)/i, `${prefix}${page}`);
    }
  }
});
