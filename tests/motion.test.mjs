// What moves on its own and how a visitor stops it: the backdrop (assets/stage-field-20261124.js) and the footer
// switch in the page script (assets/site-20261124.js), both run against stand-in browser objects.
// The world map follows the same switch; that is covered in tests/world-lights.test.mjs.
// These replace the old checks that every animated diagram had a pause control and a reduced-motion rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, copy, allFiles } from './support.mjs';

const REDUCED = '(prefers-reduced-motion: reduce)';

function browser({ lang = 'ko', reduced = false, motion, forced = false, stored, storage = true } = {}) {
  const env = { listened: [], frames: [], requested: 0, paints: 0, observers: {}, events: [], kept: new Map(stored ? [['sq-motion', stored]] : []), now: 0 };
  const target = name => {
    const listeners = {};
    return {
      addEventListener(type, fn) { env.listened.push(`${name}:${type}`); (listeners[type] ??= []).push(fn); },
      fire(type, event = {}) { for (const fn of listeners[type] || []) fn(event); },
    };
  };
  const context = paint => ({ createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }), putImageData: paint });
  const canvas = { classes: new Set(), classList: { add: name => canvas.classes.add(name) }, style: {}, getContext: () => (canvas.context ??= context(image => { env.paints++; env.picture = image; })) };
  const host = { querySelector: selector => (selector === 'canvas' ? canvas : null), insertBefore: node => { env.haze = node; } };
  const root = { lang, dataset: motion ? { motion } : {}, scrollHeight: 4000 };
  const button = { ...target('switch'), attributes: {}, dataset: {}, textContent: '', setAttribute(name, value) { this.attributes[name] = value; } };
  const summary = { focused: 0, focus() { this.focused++; } };
  const menu = { ...target('menu'), open: false, querySelector: selector => (selector === 'summary' ? summary : null), contains: node => node === menu.inside };
  menu.inside = { closest: selector => (selector === 'a' ? {} : null) };
  const queries = new Map();
  const media = query => queries.get(query) ?? queries.set(query, { ...target(query), matches: query === REDUCED ? reduced : forced && query === '(forced-colors: active)' }).get(query);
  const document = {
    ...target('document'), documentElement: root, body: {}, hidden: false,
    querySelector: selector => ({ '[data-stage]': host, '.product-hero': {}, '[data-world-lights]': null })[selector] ?? null,
    querySelectorAll: selector => ({ '[data-motion-toggle]': [button], 'details.mobile-menu': [menu] })[selector] ?? [],
    createElement: () => ({ getContext: () => context(() => {}), style: {} }),
  };
  const observer = name => class { constructor(fn) { env.observers[name] = fn; } observe(_, options) { env.observers[`${name} options`] = options; } };
  const window = target('window');
  const define = (name, value) => Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  define('document', document);
  define('matchMedia', media);
  define('innerWidth', 1200);
  define('innerHeight', 800);
  define('scrollY', 0);
  define('addEventListener', window.addEventListener);
  define('dispatchEvent', event => { env.events.push([event.type, event.detail]); return true; });
  define('CustomEvent', class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } });
  define('requestAnimationFrame', fn => { env.requested++; env.frames.push(fn); return env.requested; });
  define('cancelAnimationFrame', () => { env.frames.length = 0; });
  define('ResizeObserver', observer('resize'));
  define('MutationObserver', observer('mutation'));
  define('localStorage', storage
    ? { getItem: key => env.kept.get(key) ?? null, setItem: (key, value) => { env.kept.set(key, value); } }
    : { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });
  // Runs the animation loop for `seconds` of animated time in steps of 16 ms.
  env.run = seconds => {
    env.now ||= performance.now();
    for (let passed = 0; passed < seconds * 1000 && env.frames.length; passed += 16) { env.now += 16; env.frames.shift()(env.now); }
  };
  // What the browser does when <html data-motion> changes.
  env.setMotion = value => { if (value) root.dataset.motion = value; else delete root.dataset.motion; env.observers.mutation(); };
  return Object.assign(env, { canvas, root, button, menu, summary, document, window, media });
}

let loads = 0;
const stage = async () => (await import(`../assets/stage-field-20261124.js?stage=${++loads}`)).mountStage;
// Loads the page script as a page does, then waits for the backdrop module it asks for.
async function openPage() {
  const run = `?page=${++loads}`;
  await import(`../assets/site-20261124.js${run}`);
  await import(`../assets/stage-field-20261124.js${run}`);
  await new Promise(resolve => setImmediate(resolve));
}

test('backdrop: one picture at once, then at most 20 pictures a second, and it follows the page without a scroll listener', async () => {
  const env = browser();
  (await stage())();
  assert.ok(env.canvas.classes.has('stage-dots'));
  assert.equal(env.paints, 1, 'the first picture is drawn at once');
  assert.equal(env.requested, 1, 'and the loop starts');
  env.run(2);
  assert.ok(env.paints > 2 && env.paints - 1 <= 43, `${env.paints - 1} pictures in 2 s`);
  // The loop reads the scroll position itself, so the picture follows a moved page with no scroll event involved.
  const before = env.canvas.style.transform;
  globalThis.scrollY = 610;
  env.run(0.5);
  assert.notEqual(env.canvas.style.transform, before, 'the dots moved with the page');
  assert.deepEqual(env.listened.filter(entry => /scroll|wheel|touchmove/.test(entry)), []);
  assert.deepEqual(env.listened.filter(entry => entry.startsWith('window:')).sort(), ['window:load', 'window:resize']);

  env.document.hidden = true;
  env.document.fire('visibilitychange');
  assert.equal(env.frames.length, 0, 'a hidden tab stops the loop');
  env.document.hidden = false;
  env.document.fire('visibilitychange');
  assert.equal(env.frames.length, 1);
});

test('backdrop: reduced motion gets one still picture and no loop', async () => {
  const env = browser({ reduced: true });
  (await stage())();
  assert.equal(env.paints, 1);
  assert.equal(env.requested, 0);
  globalThis.scrollY = 900;
  env.document.fire('visibilitychange');
  assert.equal(env.requested, 0, 'nothing starts it later');
  assert.equal(env.paints, 1);
  // Asking for motion again while the page is open starts it; asking to reduce it stops it with one still picture.
  const query = env.media(REDUCED);
  query.matches = false;
  query.fire('change');
  assert.equal(env.frames.length, 1);
  env.run(0.5);
  const moving = env.paints;
  assert.ok(moving > 1);
  query.matches = true;
  query.fire('change');
  assert.equal(env.frames.length, 0);
  assert.equal(env.paints, moving + 1);
});

test('backdrop: the motion switch (html[data-motion=off]) is followed both ways', async () => {
  const env = browser({ motion: 'off' });
  (await stage())();
  assert.equal(env.paints, 1);
  assert.equal(env.requested, 0);
  assert.deepEqual(env.observers['mutation options'], { attributes: true, attributeFilter: ['data-motion'] });

  env.setMotion();
  assert.equal(env.frames.length, 1, 'motion back on starts the loop');
  env.run(0.5);
  const moving = env.paints;
  assert.ok(moving > 1);

  env.setMotion('off');
  assert.equal(env.frames.length, 0);
  assert.equal(env.paints, moving + 1, 'one still picture');
  env.run(1);
  assert.equal(env.paints, moving + 1);
});

test('backdrop: single dots switch on while it moves, and a still picture has none', async () => {
  // The colours sparks and links are painted in; the slow lights only ever give blends of other colours.
  const colours = [[237, 243, 255], [89, 223, 241], [164, 135, 255]];
  const lit = ({ data }) => { let n = 0; for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 60 && colours.some(([r, g, b]) => data[i] === r && data[i + 1] === g && data[i + 2] === b)) n++; return n; };
  const moving = browser();
  (await stage())();
  assert.equal(lit(moving.picture), 0, 'the first picture, before anything has moved');
  moving.run(4);
  assert.ok(lit(moving.picture) > 0, 'dots are lit after four seconds');
  // Stopping the motion while dots are lit leaves a still picture without them, and so does starting still.
  moving.setMotion('off');
  assert.equal(lit(moving.picture), 0, 'none left after the switch');
  moving.setMotion();
  moving.run(4);
  assert.ok(lit(moving.picture) > 0, 'and they come back with the motion');
  for (const options of [{ reduced: true }, { motion: 'off' }]) {
    const still = browser(options);
    (await stage())();
    still.run(4);
    assert.equal(lit(still.picture), 0, JSON.stringify(options));
  }
});

test('backdrop: nothing is drawn in forced colours', async () => {
  const env = browser({ forced: true });
  (await stage())();
  assert.equal(env.paints, 0);
  assert.equal(env.requested, 0);
  assert.equal(env.canvas.classes.size, 0);
});

test('the footer switch stops the background motion, says what it will do next and remembers the choice', async () => {
  for (const [lang, pause, resume] of [['ko', '배경 움직임 멈추기', '배경 움직임 켜기'], ['en', 'Pause background motion', 'Resume background motion']]) {
    const env = browser({ lang });
    await openPage();
    assert.equal(env.root.dataset.motion, undefined, lang);
    assert.deepEqual([env.button.attributes['aria-pressed'], env.button.textContent], [undefined, pause], lang);
    assert.equal(env.button.dataset.ready, '', `${lang}: the button is shown once its label is right`);
    assert.equal(env.frames.length, 1, `${lang}: the page script started the backdrop`);

    env.button.fire('click');
    assert.equal(env.root.dataset.motion, 'off', lang);
    assert.deepEqual([env.button.attributes['aria-pressed'], env.button.textContent], [undefined, resume], lang);
    assert.equal(env.kept.get('sq-motion'), 'off', lang);
    assert.deepEqual(env.events.at(-1), ['sq-motion', { off: true }], lang);
    env.observers.mutation();
    assert.equal(env.frames.length, 0, `${lang}: the backdrop stopped`);

    env.button.fire('click');
    assert.equal(env.root.dataset.motion, undefined, lang);
    assert.deepEqual([env.button.attributes['aria-pressed'], env.button.textContent], [undefined, pause], lang);
    assert.equal(env.kept.get('sq-motion'), 'on', lang);
    env.observers.mutation();
    assert.equal(env.frames.length, 1, `${lang}: and started again`);
  }
  // The button as built says the same as the script, in each language, so its words do not change when the script arrives.
  assert.equal(copy['배경 움직임 멈추기'], 'Pause background motion');
  for (const file of allFiles) assert.ok(read(file).includes(`data-motion-toggle>${file.startsWith('en/') ? 'Pause background motion' : '배경 움직임 멈추기'}</button>`), file);

  // A remembered "off" is applied before the backdrop mounts: one still picture, no loop.
  const returning = browser({ stored: 'off' });
  await openPage();
  assert.equal(returning.root.dataset.motion, 'off');
  assert.deepEqual([returning.button.attributes['aria-pressed'], returning.button.textContent], [undefined, '배경 움직임 켜기']);
  assert.equal(returning.paints, 1);
  assert.equal(returning.requested, 0);

  // Where storage is blocked the switch still works for the page that is open.
  const blocked = browser({ storage: false });
  await openPage();
  assert.equal(blocked.root.dataset.motion, undefined);
  blocked.button.fire('click');
  assert.equal(blocked.root.dataset.motion, 'off');
  assert.equal(blocked.button.attributes['aria-pressed'], undefined, 'the label carries the state, not aria-pressed');
});

test('the collapsed menu closes on Escape, on a link and on a press outside it, and the page script listens to no scrolling', async () => {
  const env = browser();
  await openPage();
  env.menu.open = true;
  env.menu.fire('keydown', { key: 'Tab' });
  assert.equal(env.menu.open, true);
  env.menu.fire('keydown', { key: 'Escape' });
  assert.equal(env.menu.open, false);
  assert.equal(env.summary.focused, 1, 'focus returns to the menu button');

  env.menu.open = true;
  env.menu.fire('click', { target: { closest: () => null } });
  assert.equal(env.menu.open, true, 'a press on the panel itself keeps it open');
  env.menu.fire('click', { target: env.menu.inside });
  assert.equal(env.menu.open, false, 'following a link closes it');

  env.menu.open = true;
  env.document.fire('pointerdown', { target: env.menu.inside });
  assert.equal(env.menu.open, true);
  env.document.fire('pointerdown', { target: {} });
  assert.equal(env.menu.open, false, 'a press outside closes it');

  env.menu.open = true;
  env.menu.fire('focusout', { relatedTarget: {} });
  assert.equal(env.menu.open, false, 'moving the focus out closes it');
  assert.deepEqual(env.listened.filter(entry => /scroll|wheel|touchmove/.test(entry)), []);
});
