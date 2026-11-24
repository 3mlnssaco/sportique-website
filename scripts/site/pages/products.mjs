// Product list /products/ (2026-11-24 design). Korean text is the original from build-site.mjs
// (productCards, liveApp, the old products hero) and public-records.json, unchanged.
import { esc, lines, tag, head, section, link, storeButtons, appTile, pageHero, cta } from '../ui.mjs';
import { data } from '../data.mjs';
import { listSharing } from '../products-parts.mjs';

const hero = pageHero({
  tag: '제품',
  title: lines('개인이 기록을 모으고,', '활용을 선택합니다.'),
  lead: 'UniQdata는 흩어진 건강기록을 개인 DB에서 관리하는 출발점입니다.',
}).replace('</div></section>', `<p class="lead">같은 기반의 어르신용 앱 Bodab과 동의한 연구를 운영하는 UniQLab을 소개합니다.</p></div></section>`);

const app = section({
  id: 'uniqdata-app', label: 'live-app-title',
  body: head({ tag: 'UniQdata 앱', id: 'live-app-title', title: lines('지금 스토어에서', '내려받는 UniQdata.'), lead: 'UniQdata는 2026년 7월 App Store와 Google Play에 출시해 운영 중인 개인 건강관리 앱입니다. 아래는 스토어에 공개된 실제 앱 화면입니다.', extra: storeButtons }) + appTile(),
});

const product = p => section({
  id: p.id, label: `${p.id}-title`, className: 'product-block',
  body: `<div class="split split--top"><div class="split-main">${tag(p.label)}<h2 id="${p.id}-title">${esc(p.name)}</h2><p class="lead">${esc(p.description)}</p><p>${esc(p.detail)}</p><a class="link" href="/products/${p.id}/" aria-label="${esc(p.name)} 상세 보기">상세 보기 <span aria-hidden="true">↗</span></a></div><div class="split-side"><ul class="feature-rows">${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>${p.modules.length ? `<p class="note">${p.modules.map(esc).join(' · ')}</p>` : ''}${p.id === 'uniqlab' ? '<p class="note">개인이 연구 참여와 공유 범위를 선택한 뒤 연결되는 활용처입니다.</p>' : ''}</div></div>`,
});

export default {
  path: '/products/',
  title: 'Products — 개인의 기록에서 선택한 활용까지',
  description: 'UniQdata를 출발점으로 한 개인 건강관리, Bodab 어르신용 앱과 UniQLab 연구 운영.',
  body() {
    return [hero, app, ...data.products.map(product), listSharing(data.products), cta()].join('\n');
  },
};
