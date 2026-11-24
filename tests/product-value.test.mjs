// What the product pages claim about personal choice, consent and the sharing design.
// The old concept diagrams, the sharing animation and the UniQLab 3D scene are gone; their checks now protect the
// sentences that carry the same distinctions, and that the old pictures are not brought back.
import test from 'node:test';
import assert from 'node:assert/strict';
import { withoutLegendBlink, read, count, block, mainOf, said, fileOf, languages, productIds, allFiles } from './support.mjs';

const contexts = {
  uniqdata: 'UniQdata.io에서는 개인이 자신의 기록을 관리하고, 누구에게 어떤 기록을 공유할지 선택합니다.',
  uniqlab: 'UniQLab.io에서는 참여자가 동의한 연구 목적과 범위 안에서 기록을 연결합니다. 기관 계정만으로 개인 기록에 접근할 수 있는 것은 아닙니다.',
  bodab: 'Bodab에서 남긴 기록은 어르신이 허용한 범위 안에서 가족과 연결됩니다. 가족 공유와 기관의 돌봄 업무 권한은 구분됩니다.',
};
const separation = 'SportiQue의 공유 아키텍처는 개인의 기록 보관, 동의와 권한, 블록체인 기반 증빙 검증을 분리합니다. 건강기록 원문과 복호화 키를 공개 원장에 올리는 방식이 아닙니다.';
const steps = ['개인이 정하는 범위', '권한에 맞춘 전달', '원문과 분리된 증빙', '철회와 이력 확인'];
const stepTitles = html => [...block(html, '<ol').matchAll(/<h3>([^<]+)<\/h3>/g)].map(match => match[1]);

test('Product pages keep personal choice, study consent and family sharing distinct', () => {
  // The diagram labels this test used to read (Personal records, Participant choice, Family stays informed ...) left with
  // the diagrams. The same three distinctions are sentences now: one per product, on the list and on its own page.
  for (const { prefix, lang } of languages) {
    const listing = read(fileOf(prefix, 'products/'));
    for (const id of productIds) {
      assert.ok(block(listing, 'id="sharing"').includes(said(contexts[id], lang)), `${prefix}products: ${id}`);
      assert.ok(read(fileOf(prefix, `products/${id}/`)).includes(said(contexts[id], lang)), `${prefix}${id}`);
    }
    assert.ok(block(listing, 'id="uniqlab"').includes(said('개인이 연구 참여와 공유 범위를 선택한 뒤 연결되는 활용처입니다.', lang)), prefix);
    assert.ok(block(listing, 'id="bodab"').includes(said('가족 공유 범위 선택', lang)), prefix);
  }
  const english = read('en/products/index.html');
  for (const text of ['individuals manage their records and choose which records to share and with whom', 'within the study purpose and scope agreed to by participants', 'An institutional account alone does not grant access to personal records', 'Family sharing and institutional care permissions are separate', 'Choose what to share with family']) assert.ok(english.includes(text), text);
  for (const file of allFiles) assert.doesNotMatch(read(file), /value-visual|value-diagram|value-connection|value-flow/, `${file}: the concept diagram is not brought back`);
});

test('About explains the public company scope without IR commercial or competitor details', () => {
  const about = read('en/about/index.html');
  for (const text of ['Personal health record management', 'Consented records connected to research', 'Everyday care and medication', 'Record use adapted to the setting', 'Scope', 'new consent']) {
    assert.ok(about.toLowerCase().includes(text.toLowerCase()), text);
  }
  // Four product roles and three principles, as before, and nothing else in that form.
  for (const prefix of ['', 'en/']) {
    const page = read(`${prefix}about/index.html`);
    assert.equal(count(page, /<article\b/g), 7, prefix);
    assert.equal(count(block(page, 'id="work"'), /<article\b/g), 4, prefix);
    assert.equal(count(block(page, 'id="principles"'), /<article\b/g), 3, prefix);
  }
  assert.ok(about.includes('decided from the trial results'));
  assert.doesNotMatch(about, /Evidation|PicnicHealth|Citizen Health|Patientory|revenue model|unit economics|gross margin|subscription pricing|fundraising target|\bKRW\b|\bUSD\b/i);
});

test('UniQLab is explained in words about consent, with no app screen, mock UI or 3D scene', () => {
  for (const { prefix, lang } of languages) {
    const listing = block(read(fileOf(prefix, 'products/')), 'id="uniqlab"');
    const detail = mainOf(read(fileOf(prefix, 'products/uniqlab/')));
    for (const html of [listing, detail]) {
      assert.doesNotMatch(html, /uniqlab-data-table-20260513\.png|uniqlab-screen|data-research-3d|research-core|research-consent-badge|research-3d-concept/, prefix);
      assert.doesNotMatch(html, /<(?:img|canvas|video|picture|svg)\b/, `${prefix}: UniQLab shows no picture`);
    }
    assert.ok(detail.includes(said('연구팀과 기관을 위한 운영 도구로 개발하고 있습니다. 개인의 기록은 동의한 목적과 범위 밖으로 자동 공유되지 않습니다.', lang)), prefix);
    assert.ok(detail.includes(said(contexts.uniqlab, lang)), prefix);
  }
  // The 3D scene's pointer and reduced-motion guards went with it. The two canvases that still move are covered by
  // tests/motion.test.mjs (backdrop, motion switch) and tests/world-lights.test.mjs (map).
  for (const file of allFiles) assert.doesNotMatch(read(file), /data-research-3d|research-3d/, file);
});

test('Every public product explains the designed sharing architecture without completion claims', () => {
  for (const { prefix, lang } of languages) {
    // The list explains the design once for all three products (it used to repeat it per product) and names each product's case.
    const listing = read(fileOf(prefix, 'products/'));
    assert.equal(count(listing, /<section class="section sharing"/g), 1, prefix);
    const shared = block(listing, 'id="sharing"');
    assert.ok(shared.includes(said(separation, lang)), prefix);
    assert.deepEqual(stepTitles(shared), steps.map(step => said(step, lang)), prefix);
    assert.deepEqual([...shared.matchAll(/<article\b[^>]*><h3>([^<]+)<\/h3>/g)].map(match => match[1]), ['UniQdata', 'UniQLab', 'Bodab'], prefix);
    for (const id of productIds) {
      const detail = read(fileOf(prefix, `products/${id}/`));
      assert.equal(count(detail, /<section class="section sharing"/g), 1, prefix + id);
      const sharing = block(detail, 'class="section sharing"');
      assert.ok(sharing.includes(prefix ? 'sharing architecture separates' : '공유 아키텍처는'), prefix + id);
      assert.ok(sharing.includes(prefix ? 'decryption keys stay outside the public ledger' : '복호화 키를 공개 원장에 올리는 방식이 아닙니다'), prefix + id);
      assert.ok(sharing.includes(said(separation, lang)), prefix + id);
      // One ordered list of the four steps: scope, delivery, evidence, revocation.
      assert.equal(count(sharing, /<ol\b/g), 1, prefix + id);
      assert.deepEqual(stepTitles(sharing), steps.map(step => said(step, lang)), prefix + id);
      // Delivery is described as a design, not as something finished.
      assert.ok(sharing.includes(said('수신자의 권한과 키를 확인하고, 허용된 범위의 암호화 전달을 연결하는 설계입니다.', lang)), prefix + id);
      assert.doesNotMatch(detail, /We are developing a blockchain|블록체인 기반 구조를 개발하고|구현 예정/);
      assert.doesNotMatch(detail, /all events are on-chain|blockchain guarantees|100% secure/i);
    }
    assert.doesNotMatch(listing, /We are developing a blockchain|블록체인 기반 구조를 개발하고|구현 예정|all events are on-chain|blockchain guarantees|100% secure/i);
  }
});

test('The sharing design is a numbered list of words: the old animation is gone and nothing on a product page moves by itself', () => {
  // The old check: three animated diagrams, each with a pause button and a reduced-motion rule. With no animation there is
  // nothing to pause; what stays is that it is not brought back and that the recipient is still named per product.
  for (const file of allFiles) assert.doesNotMatch(read(file), /data-sharing-motion|data-sharing-pause|sharing-travel-bundle|sharing-depth|sharing-architecture/, file);
  assert.doesNotMatch(withoutLegendBlink(read('assets/site-20261124.css')), /@keyframes|animation(?:-name|-play-state)?\s*:/);
  for (const { prefix } of languages) for (const path of ['products/', ...productIds.map(id => `products/${id}/`)]) {
    const main = mainOf(read(fileOf(prefix, path)));
    assert.doesNotMatch(main, /<(?:canvas|video|marquee)\b|<svg\b[^>]*>\s*<animate|autoplay/, `${prefix}${path}`);
    assert.equal(count(main, /<script\b/g), 0, `${prefix}${path}: no page script`);
  }
});
