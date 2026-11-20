import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('UniQdata dashboard reads only the public counts and makes no points promise', () => {
 for (const file of ['products/uniqdata/now/index.html', 'en/products/uniqdata/now/index.html']) {
  const page = readFileSync(file, 'utf8');
  assert.ok(page.includes("fetch('https://api.kr.uniqdata.io/v1/public/stats',{credentials:'omit'})"), file);
  for (const key of ['recording_members', 'members', 'confirmed_records', 'as_of']) assert.ok(page.includes(`data-stat="${key}"`), key);
  assert.ok(!/포인트|point|budget|예산|보상|reward/i.test(page.replace(/<script[\s\S]*?<\/script>/g, '')), file + ' stage 1 only');
  assert.ok(page.includes('data-stats-error hidden'), file);
 }
 assert.ok(readFileSync('products/uniqdata/index.html', 'utf8').includes('href="/products/uniqdata/now/"'));
});
