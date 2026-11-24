// The live UniQdata app (store links and the next-version screens) and who is behind the company.
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, count, block, said, fileOf, languages } from './support.mjs';

const appStore = 'https://apps.apple.com/kr/app/uniqdata/id6760312240';
const playStore = 'https://play.google.com/store/apps/details?id=io.uniqdata.app';
const shots = ['connect', 'routine', 'report', 'vault'].map(id => `/assets/verified/uniqdata-next-${id}-20261124.png`);
const oldShots = ['home', 'ai-chat', 'report', 'routine', 'checkin'].map(id => `/assets/verified/uniqdata-appstore-${id}-20260926.webp`);
const exampleNotice = '준비 중인 다음 버전의 디자인이며, 지금 스토어의 앱(버전 1.0.18)과 화면이 다릅니다. 화면 속 이름과 수치는 예시이며 실제 사용자의 기록이 아닙니다.';
const notDiagnosis = '리포트와 AI 답변은 진단을 대신하지 않습니다.';
const shortNotice = '준비 중인 다음 버전의 화면입니다. 화면 속 이름과 수치는 예시입니다.';
const lead = 'UniQdata는 2026년 7월 App Store와 Google Play에 출시해 운영 중인 개인 건강관리 앱입니다. 아래는 준비 중인 다음 버전의 화면입니다.';
const profiles = ['https://www.linkedin.com/in/seunghun-daniel-lee/', 'https://github.com/3mlnssaco'];

test('home, products and UniQdata detail show the four next-version screens labelled as not yet released, both store links and the example-screen notice', () => {
  const provenance = read('assets/verified/asset-provenance.json');
  for (const shot of shots) { assert.ok(exists(shot.slice(1)), shot); assert.ok(provenance.includes(`"public_path": "${shot}"`), shot); }
  // The hashes themselves are compared with the files in the landing test (published media hashes match the provenance manifest).
  for (const { prefix, lang } of languages) for (const path of ['', 'products/', 'products/uniqdata/']) {
    const file = fileOf(prefix, path), page = read(file);
    // The old hook was class="live-app"; the section is found by its id now.
    assert.equal(count(page, /id="uniqdata-app"/g), 1, file);
    const app = block(page, 'id="uniqdata-app"');
    for (const url of [appStore, playStore]) assert.ok(page.includes(`href="${url}"`), `${file} ${url}`);
    // The four next-version screens, each with a text alternative, the label that they are next-version screens that are
    // in preparation, and the notice that they differ from the store app and are examples, all in one section.
    const shown = [...app.matchAll(/<img\b[^>]*\ssrc="([^"]+)" alt="([^"]*)"/g)].map(match => match.slice(1));
    assert.deepEqual(shown.map(([src]) => src), shots, file);
    for (const [src, alt] of shown) assert.ok(alt.trim().length > 0, `${file}: ${src} needs a text alternative`);
    for (const [index, [, alt]] of shown.entries()) assert.equal(alt, said(`UniQdata 다음 버전 화면: ${['연결', '루틴', '리포트', '보관함'][index]}`, lang), file);
    assert.equal(count(app, /class="phone"/g), 4, file);
    assert.ok(app.includes(`>${said('다음 버전 화면', lang)}</span><span>${said('준비 중', lang)}</span>`), `${file}: next-version label`);
    assert.ok(app.includes(said(lead, lang)), `${file}: the lead says these are next-version screens`);
    assert.ok(!page.includes('스토어에 공개된 실제 앱 화면') && !page.includes('actual app screens'), `${file}: not presented as the store's screens`);
    assert.ok(app.includes(said(exampleNotice, lang)), `${file}: example-screen notice`);
    if (lang === 'en') assert.ok(app.includes('This is the design of the next version, which is in preparation, and its screens differ from the app now in the store (version 1.0.18). Names and values shown are examples, not real user records.'), `${file}: English notice word for word`);
    assert.ok(app.indexOf(said(exampleNotice, lang)) > app.indexOf(shots.at(-1)), `${file}: the notice follows the screens`);
    assert.ok(app.includes(said(notDiagnosis, lang)), `${file}: the report is not a diagnosis`);
    assert.ok(app.indexOf(said(notDiagnosis, lang)) > app.indexOf(shots.at(-1)), `${file}: the diagnosis notice follows the screens`);
    for (const old of oldShots) assert.ok(!page.includes(old), `${file}: ${old} is the released app's screen`);
  }
  for (const { prefix, lang } of languages) {
    const home = read(fileOf(prefix, ''));
    assert.ok(block(home, 'id="products"').includes(said(shortNotice, lang)), `${prefix}home: the product tile says its phones are next-version examples`);
    for (const url of [appStore, playStore]) assert.ok(block(home, 'id="uniqdata-app"').includes(`href="${url}"`), `${prefix}home ${url}`);
    assert.ok(home.indexOf('id="uniqdata-app"') < home.indexOf('id="problem"'), `${prefix}home: the live app comes before the problem`);
  }
});

test('founder page links to public external profiles', () => {
  for (const { prefix } of languages) {
    const html = read(fileOf(prefix, 'founder/'));
    for (const url of profiles) assert.ok(html.includes(`href="${url}"`), prefix + url);
    assert.ok(!html.includes('href=""'));
  }
});

test('company page presents SportiQue as a solo-founder company with public profile links', () => {
  for (const { prefix, lang } of languages) {
    const about = read(fileOf(prefix, 'about/'));
    // The old hooks were class="team-section" up to class="company-facts"; the founder block is the section with id="team".
    const team = block(about, 'id="team"');
    assert.ok(team.includes(`>${said('이승헌', lang)}</p>`), `${prefix}: the founder is named`);
    assert.ok(team.includes('Founder, CEO &amp; CTO'), prefix);
    assert.ok(team.includes(said('SportiQue를 혼자 창업해 UniQdata의 제품 방향, 앱·서버·AI 구현, 기관 협업을 직접 이끌고 있습니다.', lang)), prefix);
    for (const url of [...profiles, `/${prefix}founder/`]) assert.ok(team.includes(`href="${url}"`), prefix + url);
    for (const name of ['손준', '조이환', '김지연', '최유민', '김형태', 'Jun Son', 'Ihwan Jo']) assert.ok(!about.includes(name), name);
    assert.doesNotMatch(about, /010-|tel:/, prefix);
  }
});
