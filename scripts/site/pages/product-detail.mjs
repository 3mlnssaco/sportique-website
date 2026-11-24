// Product details /products/<id>/ (2026-11-24 design), one page per product in assets/public-records.json
// (YAKSON is not published). Korean text is the original from build-site.mjs (productDetailContent,
// productDetailPage, liveApp), unchanged.
import { esc, lines, tag, head, section, split, button, link, appTile, pageHero, appStore, playStore, statusTag, researchFlow, researchFlowNote } from '../ui.mjs';
import { data } from '../data.mjs';
import { detailSharing, productStatus, featureItem } from '../products-parts.mjs';

const detailContent = {
  uniqdata: {
    exampleTitle: '검진 뒤 기록을 확인할 때',
    example: '검진 결과를 가져와 원본과 정리된 항목을 함께 확인하고, 이전 기록과 비교합니다. 가족이나 연구에 기록을 공유할지는 개인이 대상과 범위를 정합니다.',
    status: '개인 건강기록 관리의 출발점입니다. DataQ는 기록 반입과 정리 과정을 맡는 내부 단계입니다.',
    links: [['https://uniqdata.io', 'UniQdata로 이동'], [appStore, 'App Store에서 받기'], [playStore, 'Google Play에서 받기']],
  },
  uniqlab: {
    exampleTitle: '반복 체크인이 필요한 연구',
    example: '연구팀은 연구 기간과 수집 항목을 정리하고, 참여자가 동의한 범위에서 체크인을 운영합니다. 빠진 응답과 출처를 확인해 연구별 자료를 정리합니다.',
    status: '연구팀과 기관을 위한 운영 도구로 개발하고 있습니다. 개인의 기록은 동의한 목적과 범위 밖으로 자동 공유되지 않습니다.',
    links: [['https://org.sportique.biz/products/uniqlab', '기관용 기능·예시 보기'], ['https://org.sportique.biz/onboarding?product=uniqlab', '기관 온보딩 안내']],
  },
  bodab: {
    exampleTitle: '어르신의 하루를 확인할 때',
    example: '어르신은 앱에서 복약 일정과 병원 방문 일정을 보고 직접 체크인합니다. 가족은 어르신이 허용한 내용만 FamilyCare에서 확인합니다.',
    status: 'Bodab은 어르신이 직접 쓰는 앱으로, 지금은 준비 중이라 스토어에서 내려받을 수 없습니다. 기관의 돌봄 요청·담당자 배정 업무는 이 앱의 범위가 아닙니다.',
    links: [['https://org.sportique.biz/products/bodab', 'Bodab Senior 기관용 상세 보기']],
  },
};

function page(p) {
  const detail = detailContent[p.id];
  const back = '<div class="wrap product-back"><a class="back-link" href="/products/">← 제품 소개</a></div>';
  const hero = pageHero({ tag: p.label, title: esc(p.name), lead: p.description }).replace(`<h1 id="page-title">${esc(p.name)}</h1>`, `<div class="name-line"><h1 id="page-title">${esc(p.name)}</h1>${statusTag(productStatus[p.id])}</div>`).replace('</div></section>', `<p class="lead lead--support">${esc(p.detail)}</p></div></section>`);
  const app = p.id === 'uniqdata'
    ? section({ id: 'uniqdata-app', label: 'live-app-title', body: head({ tag: 'UniQdata 앱', id: 'live-app-title', title: lines('스토어의 UniQdata,', '다음 버전을 준비합니다.'), lead: 'UniQdata는 2026년 7월 App Store와 Google Play에 출시해 운영 중인 개인 건강관리 앱입니다. 아래는 준비 중인 다음 버전의 화면입니다.' }) + appTile() + `<p class="product-now">${link({ href: '/products/uniqdata/now/', label: 'UniQdata 현황판: 지금 함께 기록하는 사람들', mark: '↗' })}</p>` })
    : '';
  const features = section({ label: `features-${p.id}`, body: `<h2 id="features-${p.id}" class="h2-sm">어떤 일을 할 수 있나요?</h2><ul class="feature-rows">${p.features.map(f => `${featureItem(f)}`).join('')}</ul>${p.modules.length ? `<p class="note">${p.modules.map(esc).join(' · ')}</p><div class="note-status">${statusTag('계획')}</div>` : ''}` });
  const flow = p.id === 'uniqlab' ? section({ label: 'flow-title-detail', body: `<h2 id="flow-title-detail" class="h2-sm flow-title">연구가 진행되는 순서</h2>${researchFlow()}<p class="note">${esc(researchFlowNote)}</p>` }) : '';
  const use = section({ label: `example-${p.id}`, body: split(`${tag('활용 예시')}<h2 id="example-${p.id}">${esc(detail.exampleTitle)}</h2><p>${esc(detail.example)}</p>`, `<h2 id="status-${p.id}" class="h2-sm">현재 범위</h2><p>${esc(detail.status)}</p>`) });
  const actions = section({ className: 'product-actions', body: `<div class="actions">${detail.links.map(([href, label], index) => button({ href, label, variant: index ? 'ghost' : 'primary', arrow: '↗' })).join('')}</div>` });
  return [back, hero, app, features, flow, use, detailSharing(p.id), actions].join('\n');
}

export default data.products.map(p => ({
  path: `/products/${p.id}/`,
  title: `${p.name} — 상세 보기`,
  description: p.description,
  body: () => page(p),
}));
