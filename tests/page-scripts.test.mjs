// The two page scripts, run against stand-ins built from the pages they are loaded on:
// the filter on /awards/ (assets/page-awards-20261124.js) and the copy buttons on /contact/ (assets/page-contact-20261124.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, blocks, mainOf, visibleText, publicRecords, languages, fileOf } from './support.mjs';

let loads = 0;
// Runs a page script as a module, as the page does, against the current stand-in globals.
const run = file => import(`data:text/javascript;charset=utf-8,${encodeURIComponent(`${read(file)}\n// run ${++loads}`)}`);
const define = (name, value) => Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
const element = extra => {
  const listeners = [];
  return { attributes: {}, hidden: false, textContent: '', setAttribute(name, value) { this.attributes[name] = value; }, addEventListener(type, fn) { assert.equal(type, 'click'); listeners.push(fn); }, press: () => Promise.all(listeners.map(fn => fn({}))), ...extra };
};

test('awards filter shows one category at a time and announces the count in the page language', async () => {
  for (const { prefix, lang } of languages) {
    const file = fileOf(prefix, 'awards/'), page = read(file);
    const pills = [...page.matchAll(/<button type="button" class="pill" data-filter="([^"]+)" aria-pressed="(true|false)">([^<]+)<\/button>/g)].map(([, filter, pressed, label]) => element({ dataset: { filter }, attributes: { 'aria-pressed': pressed }, label }));
    const items = [...page.matchAll(/<li class="tl-item" data-category="([^"]+)"/g)].map(([, category]) => element({ dataset: { category } }));
    const counter = { textContent: page.match(/<p\b[^>]* id="record-count"[^>]*>([^<]*)<\/p>/)[1] };
    assert.equal(items.length, publicRecords.awards.length, file);
    assert.ok(pills.length > 2, file);
    define('document', {
      documentElement: { lang },
      querySelectorAll: selector => ({ '.pill[data-filter]': pills, '.tl-item[data-category]': items })[selector] ?? assert.fail(`the stand-in has no ${selector}`),
      querySelector: selector => (selector === '#record-count' ? counter : assert.fail(`the stand-in has no ${selector}`)),
    });
    await run('assets/page-awards-20261124.js');
    const says = total => (lang === 'en' ? `${total} public record${total === 1 ? '' : 's'}` : `공개 기록 ${total}건`);
    const all = says(items.length);
    assert.equal(counter.textContent, all, `${file}: the count as built reads as the script writes it`);

    for (const pill of pills.filter(one => one.dataset.filter !== 'all')) {
      await pill.press();
      const visible = items.filter(item => !item.hidden);
      assert.ok(visible.length > 0 && visible.every(item => item.dataset.category === pill.dataset.filter), `${file}: ${pill.dataset.filter}`);
      assert.equal(visible.length, items.filter(item => item.dataset.category === pill.dataset.filter).length, file);
      // The number on the button is the number of records it shows.
      assert.ok(pill.label.endsWith(` ${visible.length}`), `${file}: "${pill.label}" shows ${visible.length}`);
      assert.equal(counter.textContent, says(visible.length), file);
      assert.deepEqual(pills.filter(one => one.attributes['aria-pressed'] === 'true'), [pill], `${file}: one filter is pressed`);
    }
    await pills.find(one => one.dataset.filter === 'all').press();
    assert.ok(items.every(item => !item.hidden), `${file}: all records are back`);
    assert.equal(counter.textContent, all, file);
  }
});

test('contact copy buttons copy the address beside them and say so, or ask to copy by hand when the browser refuses', async () => {
  for (const { prefix, lang } of languages) {
    const file = fileOf(prefix, 'contact/'), main = mainOf(read(file));
    const buttons = [];
    for (const html of blocks(main, 'data-copy-group')) {
      const status = /role="status"[^>]*data-copy-status/.test(html) ? { textContent: '' } : null;
      const group = { querySelector: selector => (selector === '[data-copy-status]' ? status : assert.fail(`the stand-in has no ${selector}`)) };
      for (const [, address] of html.matchAll(/<button type="button"[^>]* data-copy-email="([^"]+)">/g)) {
        assert.ok(status, `${file}: ${address} has a place to report the result`);
        assert.ok(visibleText(html).includes(address), `${file}: ${address} is also shown as text`);
        buttons.push(element({ dataset: { copyEmail: address }, status, closest: selector => (selector === '[data-copy-group]' ? group : assert.fail(`the stand-in has no ${selector}`)) }));
      }
    }
    assert.deepEqual(buttons.map(button => button.dataset.copyEmail), ['hello@sportique.biz', 'hello@sportique.biz', 'support@sportique.biz'], file);
    const statuses = [...new Set(buttons.map(button => button.status))];
    define('document', { documentElement: { lang }, querySelectorAll: selector => (selector === '[data-copy-email]' ? buttons : selector === '[data-copy-status]' ? statuses : assert.fail(`the stand-in has no ${selector}`)) });
    // The script clears every status and writes the result a moment later, so a repeated result is announced again.
    const settled = () => new Promise(resolve => setTimeout(resolve, 80));
    const copied = [];
    let allowed = true;
    define('navigator', { clipboard: { writeText: async text => { if (!allowed) throw new Error('denied'); copied.push(text); } } });
    await run('assets/page-contact-20261124.js');

    for (const button of buttons) {
      await button.press();
      assert.equal(button.status.textContent, '', 'cleared first');
      await settled();
      assert.equal(copied.at(-1), button.dataset.copyEmail, file);
      assert.equal(button.status.textContent, lang === 'en' ? 'Email address copied.' : '이메일 주소를 복사했습니다.', file);
    }
    assert.equal(copied.length, buttons.length, file);
    allowed = false;
    for (const button of buttons) {
      await button.press();
      await settled();
      assert.equal(button.status.textContent, lang === 'en' ? 'Could not copy. Please copy the displayed address manually.' : '복사하지 못했습니다. 표시된 주소를 직접 복사해 주세요.', file);
    }
    assert.equal(copied.length, buttons.length, `${file}: nothing was copied when the browser refused`);
  }
});
