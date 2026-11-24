// YAKSON is withdrawn from the public site; its source records and original files stay in the repository.
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, count, allFiles, sourceRecords, publicRecords } from './support.mjs';

test('YAKSON is withdrawn from all public company pages while original records and assets remain', () => {
  for (const file of allFiles) assert.doesNotMatch(read(file), /YAKSON|약손|\/products\/#?yakson|yakson-evt/i, file);
  // Old links to the product page lead to the remaining products and are kept out of search results.
  for (const prefix of ['', 'en/']) {
    const retired = read(`${prefix}products/yakson/index.html`);
    assert.ok(retired.includes(`<meta http-equiv="refresh" content="0;url=/${prefix}products/">`), prefix);
    assert.ok(retired.includes('<meta name="robots" content="noindex">'), prefix);
    assert.ok(retired.includes(`<a href="/${prefix}products/">`), prefix);
    assert.doesNotMatch(retired, /YAKSON|약손/i, prefix);
  }
  assert.doesNotMatch(read('en/products/yakson/index.html'), /[가-힣]/u);
  // Three products on the list, one section each (the old hook was class="product-panel product-...").
  const products = read('products/index.html');
  assert.equal(count(products, /<section class="section product-block"/g), 3);
  assert.deepEqual([...products.matchAll(/<section class="section product-block" id="([^"]+)"/g)].map(match => match[1]), publicRecords.products.map(product => product.id));
  assert.ok(sourceRecords.products.some(product => product.id === 'yakson'));
  assert.ok(sourceRecords.awards.some(record => record.title.includes('약손')));
  for (const file of ['yakson-evt-v3-frame-20260916.png', 'yakson-evt-v3-preview-20260916.mp4']) assert.ok(exists(`assets/verified/${file}`), file);
});
