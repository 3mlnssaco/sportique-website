// The live UniQdata app (store links and published screens) and who is behind the company.
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, count, block, said, fileOf, languages } from './support.mjs';

const appStore = 'https://apps.apple.com/kr/app/uniqdata/id6760312240';
const playStore = 'https://play.google.com/store/apps/details?id=io.uniqdata.app';
const shots = ['home', 'ai-chat', 'report', 'routine', 'checkin'].map(id => `/assets/verified/uniqdata-appstore-${id}-20260926.webp`);
const exampleNotice = 'App Store 등록 화면(버전 1.0.18). 화면 속 이름과 수치는 예시이며 실제 사용자의 기록이 아닙니다.';
const profiles = ['https://www.linkedin.com/in/seunghun-daniel-lee/', 'https://github.com/3mlnssaco'];

test('home, products and UniQdata detail show the live store screens, both store links and the example-screen notice', () => {
  const provenance = read('assets/verified/asset-provenance.json');
  for (const shot of shots) { assert.ok(exists(shot.slice(1)), shot); assert.ok(provenance.includes(`"public_path": "${shot}"`), shot); }
  for (const { prefix, lang } of languages) for (const path of ['', 'products/', 'products/uniqdata/']) {
    const file = fileOf(prefix, path), page = read(file);
    // The old hook was class="live-app"; the section is found by its id now.
    assert.equal(count(page, /id="uniqdata-app"/g), 1, file);
    const app = block(page, 'id="uniqdata-app"');
    for (const url of [appStore, playStore]) assert.ok(page.includes(`href="${url}"`), `${file} ${url}`);
    // The five published screens, each with its words, and the notice that they are examples, all in one section.
    const shown = [...app.matchAll(/<img\b[^>]*\ssrc="([^"]+)" alt="([^"]*)"/g)].map(match => match.slice(1));
    assert.deepEqual(shown.map(([src]) => src), shots, file);
    for (const [src, alt] of shown) assert.ok(alt.trim().length > 0, `${file}: ${src} needs a text alternative`);
    assert.ok(app.includes(said(exampleNotice, lang)), `${file}: example-screen notice`);
    assert.ok(app.indexOf(said(exampleNotice, lang)) > app.indexOf(shots.at(-1)), `${file}: the notice follows the screens`);
    assert.ok(app.includes(said('궁금한 건강정보를 대화로 확인합니다. 진단을 대신하지 않습니다.', lang)), `${file}: the AI screen is not a diagnosis`);
  }
  for (const { prefix } of languages) {
    const home = read(fileOf(prefix, ''));
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
