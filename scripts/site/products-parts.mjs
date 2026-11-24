// Pieces the product list (pages/products.mjs) and the product details (pages/product-detail.mjs) share.
// Korean text is the original text from scripts/build-site.mjs (productSharing, sharingContexts), unchanged.
import { esc, lines, tag, statusTag, head, section, rows } from './ui.mjs';

// Status next to each product's name, and the one feature that is only planned.
export const productStatus = { uniqdata: '서비스 중', uniqlab: '개발 중', bodab: '준비 중' };
const planned = new Set(['진료 전 질문 준비', '가족 공유 범위 선택']);
export const featureItem = text => (planned.has(text) ? `<li class="with-status"><span>${esc(text)}</span>${statusTag('계획')}</li>` : `<li>${esc(text)}</li>`);


export const sharingContexts = {
  uniqdata: 'UniQdata.io에서는 개인이 자신의 기록을 관리하고, 누구에게 어떤 기록을 공유할지 선택합니다.',
  uniqlab: 'UniQLab.io에서는 참여자가 동의한 연구 목적과 범위 안에서 기록을 연결합니다. 기관 계정만으로 개인 기록에 접근할 수 있는 것은 아닙니다.',
  bodab: 'Bodab에서 남긴 기록은 어르신이 허용한 범위 안에서 가족과 연결됩니다. 가족 공유와 기관의 돌봄 업무 권한은 구분됩니다.',
};

export const sharingTag = '개인 통제 · 블록체인 기반 검증';
export const sharingTitle = '공유의 기준은 개인에게.';
export const sharingSeparation = 'SportiQue의 공유 아키텍처는 개인의 기록 보관, 동의와 권한, 블록체인 기반 증빙 검증을 분리합니다. 건강기록 원문과 복호화 키를 공개 원장에 올리는 방식이 아닙니다.';

// A real sequence (range, delivery, proof, withdrawal), so it is numbered.
export const sharingSteps = [
  ['개인이 정하는 범위', '공유 대상·목적·기록 범위를 동의에 연결합니다.'],
  ['권한에 맞춘 전달', '수신자의 권한과 키를 확인하고, 허용된 범위의 암호화 전달을 연결하는 설계입니다.'],
  ['원문과 분리된 증빙', '동의·접근·공유 이력의 증빙을 배치로 묶고, 원문을 공개하지 않는 블록체인 검증 구조에 연결합니다.'],
  ['철회와 이력 확인', '새로운 접근을 차단하는 철회와, 이미 남은 이력의 증빙 확인을 구분합니다.'],
];

export const stepsList = () => `<ol class="steps steps--four">${sharingSteps.map(([title, body], index) => `<li><span class="step-n" aria-hidden="true">${index + 1}</span><div class="step-body"><h3>${esc(title)}</h3><p>${esc(body)}</p></div></li>`).join('')}</ol>`;

// Detail page: this product's context line, the separation paragraph, then the four steps.
export const detailSharing = id => section({
  className: 'sharing', label: `sharing-${id}`,
  body: `${head({ tag: sharingTag, id: `sharing-${id}`, title: esc(sharingTitle), lead: sharingContexts[id] })}<p class="sharing-separation">${esc(sharingSeparation)}</p>${stepsList()}`,
});

// List page: once for all products, with each product's context as a one-line row.
export const listSharing = products => section({
  id: 'sharing', className: 'sharing', label: 'sharing-title',
  body: `${head({ tag: sharingTag, id: 'sharing-title', title: esc(sharingTitle), lead: sharingSeparation })}${stepsList()}${rows(products.map(p => ({ title: p.name, body: sharingContexts[p.id] })), { level: 'h3' })}`,
});
