// The UniQdata dashboard page (/products/uniqdata/now/): what it reads, what it shows and what it must not promise.
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, inlineScripts } from './support.mjs';

const files = ['products/uniqdata/now/index.html', 'en/products/uniqdata/now/index.html'];
const api = 'https://api.kr.uniqdata.io/v1/public/stats';

test('UniQdata dashboard reads only the public counts and makes no points promise', () => {
 for (const file of files) {
  const page = read(file);
  assert.ok(page.includes(`fetch('${api}',{credentials:'omit'})`), file);
  for (const key of ['recording_members', 'members', 'confirmed_records', 'as_of']) assert.ok(page.includes(`data-stat="${key}"`), key);
  assert.ok(!/포인트|point|budget|예산|보상|reward/i.test(page.replace(/<script[\s\S]*?<\/script>/g, '')), file + ' stage 1 only');
  assert.ok(page.includes('data-stats-error hidden'), file);
  // 영어 빌드가 스크립트 안의 따옴표·부등호를 HTML 문자로 바꾸면 스크립트가 깨진다.
  assert.ok(!/&(quot|gt|lt|amp);/.test(page.match(/<script>\(function[\s\S]*?<\/script>/)[0]), file + ' script intact');
  // 기록을 시작한 사람이 0명이면 숫자 대신 안내를 보인다(2026-11-20).
  assert.ok(page.includes('data-stats-wait hidden') && page.includes('if(!Number(s.recording_members))'), file);
  // The numbers are announced when they arrive, and each one starts as a dash, never as a made-up figure.
  assert.match(page, /<section\b[^>]*\saria-live="polite" data-stats-facts>/, file);
  assert.deepEqual([...page.matchAll(/<span data-stat="[a-z_]+">([^<]*)<\/span>/g)].map(match => match[1]), ['—', '—', '—', '—'], file);
 }
 assert.ok(read('products/uniqdata/index.html').includes('href="/products/uniqdata/now/"'));
 assert.ok(read('en/products/uniqdata/index.html').includes('href="/en/products/uniqdata/now/"'));
});

// Runs the page's own inline script against stand-ins for the elements it looks up and for fetch.
async function open(file, respond) {
 const page = read(file);
 const scripts = inlineScripts(page);
 assert.equal(scripts.length, 1, file);
 for (const hook of ['data-stats-facts', 'data-stats-wait hidden', 'data-stats-error hidden']) assert.ok(page.includes(hook), `${file}: ${hook}`);
 const stats = Object.fromEntries([...page.matchAll(/data-stat="([a-z_]+)"/g)].map(match => [match[1], { textContent: '—' }]));
 const facts = { style: {} }, wait = { hidden: true }, error = { hidden: true }, requests = [];
 const document = {
  documentElement: { lang: page.includes('<html lang="en">') ? 'en' : 'ko' },
  querySelector: selector => selector.startsWith('[data-stat=') ? stats[selector.slice(11, -1)] ?? null : ({ '[data-stats-facts]': facts, '[data-stats-wait]': wait, '[data-stats-error]': error })[selector] ?? null,
 };
 const fetch = (url, options) => { requests.push([url, options]); return respond(); };
 new Function('document', 'fetch', scripts[0])(document, fetch);
 await new Promise(resolve => setImmediate(resolve));
 return { stats, facts, wait, error, requests };
}
const answer = body => async () => ({ ok: true, json: async () => body });
const shown = view => Object.values(view.stats).map(stat => stat.textContent);

test('UniQdata dashboard shows the server counts, a waiting line while nobody has recorded, and an error line when the counts cannot be read', async () => {
 for (const file of files) {
  const counted = await open(file, answer({ recording_members: 1234, members: 5678, confirmed_records: 91011, as_of: '2026-11-24T00:00:00Z' }));
  assert.deepEqual(counted.requests, [[api, { credentials: 'omit' }]], `${file}: one request, without cookies`);
  assert.deepEqual([counted.stats.recording_members.textContent, counted.stats.members.textContent, counted.stats.confirmed_records.textContent], ['1,234', '5,678', '91,011'], file);
  // 2026-11-24 00:00 UTC is 9 in the morning of the 24th in Seoul, whatever the visitor's time zone.
  assert.match(counted.stats.as_of.textContent, /24\D+9/, file);
  assert.match(counted.stats.as_of.textContent, file.startsWith('en/') ? /^[\x20-\x7e ]+$/ : /11월 24일/, file);
  assert.ok(counted.wait.hidden && counted.error.hidden && counted.facts.style.display !== 'none', file);

  for (const nobody of [{ recording_members: 0, members: 3, confirmed_records: 0, as_of: '2026-11-24T00:00:00Z' }, { members: 3 }]) {
   const waiting = await open(file, answer(nobody));
   assert.equal(waiting.facts.style.display, 'none', `${file}: the numbers are put away`);
   assert.equal(waiting.wait.hidden, false, `${file}: the waiting line shows`);
   assert.ok(waiting.error.hidden, file);
   assert.deepEqual(shown(waiting), ['—', '—', '—', '—'], `${file}: no number is filled in`);
  }

  for (const failure of [async () => ({ ok: false, status: 503 }), async () => { throw new Error('offline'); }, answer(null)]) {
   const failed = await open(file, failure);
   assert.equal(failed.error.hidden, false, `${file}: the error line shows`);
   assert.ok(failed.wait.hidden, file);
   assert.deepEqual(shown(failed), ['—', '—', '—', '—'], `${file}: no number is filled in`);
  }
 }
});
