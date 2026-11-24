// Site runtime for the 2026-11-24 design (pages built by scripts/site/shell.mjs).
// No scroll listeners and no 3D: the backdrop and the world map are separate modules loaded on demand.
const root = document.documentElement;
const english = root.lang === 'en';

// Background motion: the visitor's choice is stored and marked on <html data-motion="off"> before anything mounts.
// Listeners can read that attribute or the `sq-motion` event on window.
const MOTION_KEY = 'sq-motion';
const motionLabel = off => (english
  ? (off ? 'Resume background motion' : 'Pause background motion')
  : (off ? '배경 움직임 켜기' : '배경 움직임 멈추기'));
function storedOff() {
  try { return localStorage.getItem(MOTION_KEY) === 'off'; } catch { return false; }
}
function setMotion(off, { store = false } = {}) {
  if (off) root.dataset.motion = 'off';
  else delete root.dataset.motion;
  if (store) {
    try { localStorage.setItem(MOTION_KEY, off ? 'off' : 'on'); } catch { /* private mode: the choice lasts for this page only */ }
  }
  for (const button of document.querySelectorAll('[data-motion-toggle]')) {
    button.dataset.ready = '';
    button.textContent = motionLabel(off);
  }
  dispatchEvent(new CustomEvent('sq-motion', { detail: { off } }));
}
setMotion(storedOff());
for (const button of document.querySelectorAll('[data-motion-toggle]')) {
  button.addEventListener('click', () => setMotion(root.dataset.motion !== 'off', { store: true }));
}

// The page loads this file as site-….js?v=<hash>; the modules get the same ?v so a changed file changes its own address.
const v = new URL(import.meta.url).search;
import('./stage-field-20261124.js' + v).then(m => m.mountStage()).catch(() => {});
if (document.querySelector('[data-world-lights]')) {
  import('./world-lights-20261124.js' + v).then(m => m.mountWorldLights()).catch(() => {});
}

// Mobile menu: Escape closes it and returns focus to the button; following a link closes it.
for (const menu of document.querySelectorAll('details.mobile-menu')) {
  menu.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.open) return;
    menu.open = false;
    menu.querySelector('summary').focus();
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) menu.open = false;
  });
  // Pressing outside the menu, or moving the focus out of it, closes it.
  document.addEventListener('pointerdown', event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  menu.addEventListener('focusout', event => {
    if (menu.open && event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false;
  });
}
