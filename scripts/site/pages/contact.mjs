// /contact/ (2026-11-24 design). Korean text is the original text of the old page in scripts/build-site.mjs.
// Mail addresses and subject lines are unchanged; the English build swaps the subject lines by exact string.
import { esc, lines, section } from '../ui.mjs';
import { heroTwoLine } from '../small.mjs';
import { assetVersion } from '../shell.mjs';

const arrow = '<span class="btn-arrow" aria-hidden="true">↗</span>';
const copyButton = (address, label) => `<button type="button" class="btn btn--ghost" data-copy-email="${address}">${label}</button>`;
const status = '<span class="copy-status" role="status" aria-live="polite" data-copy-status></span>';

const ways = [
  {
    title: '함께 만들고 싶어요.',
    body: '기관·연구 협업, 현장 적용과 제품 파트너십',
    address: 'hello@sportique.biz',
    gmail: 'https://mail.google.com/mail/?view=cm&amp;fs=1&amp;to=hello%40sportique.biz&amp;su=SportiQue%20협업%20문의',
    mailto: 'mailto:hello@sportique.biz?subject=SportiQue%20협업%20문의',
  },
  {
    title: '제품을 사용하고 있어요.',
    body: 'UniQdata · UniQLab · Bodab 이용 문의',
    address: 'support@sportique.biz',
    gmail: 'https://mail.google.com/mail/?view=cm&amp;fs=1&amp;to=support%40sportique.biz&amp;su=SportiQue%20제품%20이용%20문의',
    mailto: 'mailto:support@sportique.biz?subject=SportiQue%20제품%20이용%20문의',
  },
];

const mailActions = way => `<a class="btn btn--ghost btn--arrow" href="${way.gmail}" target="_blank" rel="noopener noreferrer">Gmail로 작성 ${arrow}</a><a class="btn btn--ghost btn--arrow" href="${way.mailto}">메일 앱에서 작성 ${arrow}</a>${copyButton(way.address, '주소 복사')}`;

const wayRow = (way, actions, address) => `<article class="way" data-copy-group><div class="way-text"><h2>${esc(way.title)}</h2><p>${esc(way.body)}</p>${address ? `<p class="way-address">${address}</p>` : ''}</div><div class="way-actions">${actions}${status}</div></article>`;

const address = `<section class="section contact-address" aria-label="hello@sportique.biz"><div class="wrap" data-copy-group><p class="address-display">hello@sportique.biz</p><div class="address-tools">${copyButton('hello@sportique.biz', '이메일 주소 복사')}${status}</div><p class="note">제품 · 파트너십 · 기관 및 연구 협업</p></div></section>`;

const orgWay = { title: '기관에 도입하고 싶어요.', body: '기관 정보와 필요한 제품으로 도입 절차 시작하기' };

export default {
  path: '/contact/',
  title: 'Contact — 다음 이야기는, 함께',
  description: 'SportiQue 제품, 돌봄 현장, 기관·연구 협업 문의.',
  body() {
    const hero = heroTwoLine({
      tag: '문의',
      title: lines('어떤 연결을', '만들고 싶으세요?'),
      leadLines: ['제품에 대한 질문도, 현장에서 만난 문제도 좋습니다.', '여러분의 이야기를 들려주세요.'],
    });
    const list = section({ body: `<div class="ways">${ways.map(way => wayRow(way, mailActions(way), way.address)).join('')}${wayRow(orgWay, `<a class="btn btn--primary btn--arrow" href="https://org.sportique.biz/onboarding">기관 도입 신청하기 ${arrow}</a>`, '')}</div>` });
    return `${hero}${address}${list}<script type="module" src="/assets/page-contact-20261124.js?v=${assetVersion()}"></script>`;
  },
};
