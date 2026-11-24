// Home page (2026-11-24 design). Every Korean sentence is the original text node from
// scripts/home-content.html and liveApp() in scripts/build-site.mjs, unchanged, so the existing
// English keys keep matching. New words are listed in scripts/english-copy.d/home.json.
import { esc, lines, button, link, tag, head, tile, storeButtons, phone, appTile, appShotShortNotice, rows } from '../ui.mjs';

const worldPlaceholder = '<figure class="world-lights" data-world-lights></figure>';

// The world map is a separate piece (scripts/site/world-lights.mjs). Until it exists the slot stays empty.
async function worldLights() {
  try {
    const piece = await import('../world-lights.mjs');
    return await piece.worldLights();
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') console.warn(`World lights piece failed; building the empty slot instead: ${error.message}`);
    return worldPlaceholder;
  }
}

// `product-hero` is the hook assets/stage-field-20261124.js uses to place the first-screen lights.
const hero = world => `<section class="hero product-hero" aria-labelledby="hero-title"><div class="wrap hero-inner">${tag('개인을 위한 건강데이터 네트워크', { live: true })}<h1 id="hero-title">${lines('건강기록은 한곳에.', '선택은 개인에게.')}</h1><p class="lead">SportiQue는 흩어진 건강기록을 개인이 모아 관리하고, 쓰거나 나눌 때 대상과 범위를 직접 정하는 기반을 만듭니다. 그 시작이 UniQdata입니다.</p><div class="actions">${button({ href: 'https://uniqdata.io/', label: 'UniQdata 알아보기', arrow: '↗' })}${link({ href: '#problem', label: '왜 필요한가요?', mark: '↓' })}</div></div><div class="hero-world">${world}</div></section>`;

const world = `<section class="section" id="world" aria-labelledby="world-title"><div class="wrap split"><div class="split-main">${tag('네트워크')}<h2 id="world-title">${lines('국가가 달라도,', '개인의 기록을 이어 씁니다.')}</h2><p>해외에서 진료를 받거나 가족과 떨어져 지낼 때도, 필요한 기록을 이어서 활용할 수 있어야 합니다. 공유할 기록과 대상은 개인이 정합니다.</p>${link({ href: '/vision/', label: '회사 비전 보기' })}</div><ul class="rules"><li>공유할 사람과 항목을 개인이 선택.</li><li>나라가 달라도 이어지도록.</li><li>AI·앱마다 허용할 범위를 따로 선택.</li></ul></div></section>`;

const app = `<section class="section" id="uniqdata-app" aria-labelledby="live-app-title"><div class="wrap">${head({ tag: 'UniQdata 앱', id: 'live-app-title', title: lines('지금 스토어에서', '내려받는 UniQdata.'), lead: 'UniQdata는 2026년 7월 App Store와 Google Play에 출시해 운영 중인 개인 건강관리 앱입니다. 아래는 준비 중인 다음 버전의 화면입니다.', extra: storeButtons })}${appTile()}</div></section>`;

const problems = [
  ['기록이 제각각 흩어집니다.', '진료·검진·복약·기기 기록은 기관과 서비스마다 다른 형식과 계정 안에 남습니다.'],
  ['공유를 직접 결정하기 어렵습니다.', '기록을 한곳에서 관리하지 못하면 누구에게, 어떤 목적으로, 어느 범위까지 줄지 직접 결정하기 어렵습니다.'],
  ['AI도 자유롭게 고르기 어렵습니다.', '기록이 특정 서비스 안에 머물면, 그 서비스 밖의 AI 모델이나 플랫폼을 선택해 활용하기 어렵습니다.'],
];
const problem = `<section class="section" id="problem" aria-labelledby="problem-title"><div class="wrap">${head({ tag: '문제', id: 'problem-title', title: lines('흩어진 기록은', '개인의 선택을 막습니다.'), lead: '병원·검진기관·약국·웨어러블·건강 앱과 생활기록에 데이터는 남지만, 개인의 데이터베이스로 모이지 않습니다. 기록을 직접 관리하지 못하면 어디에 어떤 범위로 공유할지, 어떤 AI 모델이나 플랫폼을 쓸지도 선택할 수 없습니다.' })}${rows(problems.map(([title, body]) => ({ title, body })))}</div></section>`;

// A real sequence: records are standardised, stored in the personal DB, then used by choice.
const steps = [
  ['DataQ', '형식을 표준화합니다.', '원본과 출처를 보존하면서 서로 다른 형식·항목·단위를 공통 구조로 연결합니다.'],
  ['UniQdata', '개인 DB로 쌓습니다.', '건강기록을 한곳에서 관리하고, 시간에 따라 다시 활용합니다.'],
  ['Choose', 'AI·공유를 선택합니다.', '어디에, 어떤 AI 모델·플랫폼에, 어떤 목적으로, 어느 범위와 기간까지 쓸지 개인이 정합니다.'],
];
const system = `<section class="section" id="system" aria-labelledby="system-title"><div class="wrap">${head({ tag: '방식', id: 'system-title', title: lines('데이터를 개인에게.', '선택권도 개인에게.'), lead: 'DataQ는 출처마다 다른 건강데이터의 형식·항목·단위를 표준화합니다. UniQdata는 기록을 개인 DB에서 관리하고, 개인이 활용과 공유 범위를 정하는 접점입니다.' })}<ol class="steps">${steps.map(([name, title, body], index) => `<li><span class="step-n" aria-hidden="true">${index + 1}</span><div class="step-body"><p class="step-name">${name}</p><h3>${esc(title)}</h3><p>${esc(body)}</p></div></li>`).join('')}</ol></div></section>`;

const uses = [
  ['개인은 기록을 리포트로 확인합니다.', '기간·출처·공백과 관찰된 변화를 개인 기록의 흐름으로 다시 확인합니다.'],
  ['개인은 자신의 기록을 바탕으로 AI에 질문합니다.', '필요한 항목·기간·목적·처리 위치를 먼저 고르고, 승인한 최소 범위만 AI에 전달합니다.'],
  ['보호자에게 필요한 기록만 공유합니다.', '어느 보호자에게 어떤 항목을 언제까지 공유할지 직접 정하고, 필요하면 접근을 철회합니다.'],
  ['해외에서도 필요한 기록을 꺼내 씁니다.', '국가별 정책·데이터 레지던시 조건을 통과한 범위에서, 허용한 기록만 필요한 곳에 연결합니다.'],
  ['참여할 연구와 공유할 기록을 고릅니다.', '연구 목적과 요청 항목·기간을 보고 직접 선택합니다. 참여 보상은 연구기관·PI 등 지급 주체가 정한 방식으로 처리되고, 개인은 관련 이력을 확인합니다.'],
  ['돌봄·복약 앱에 기록을 연결합니다.', 'Bodab의 가족 돌봄, MediQ의 진료 준비처럼 같은 기록을 목적에 맞게 활용합니다.'],
  ['이용 이력을 다시 확인합니다.', '무엇을 어디에 왜 썼는지 확인하고, 동의 범위를 줄이거나 철회한 뒤 이후 활용에 반영합니다.'],
];
const value = `<section class="section" id="value" aria-labelledby="value-title"><div class="wrap">${head({ tag: '쓰임', id: 'value-title', title: lines('모인 기록은,', '선택지가 됩니다.'), lead: '개인은 기록을 리포트로 확인하고 AI에 질문하며, 보호자에게 필요한 항목을 공유합니다. 연구와 목적별 앱에는 개인이 동의한 범위만 연결합니다.' })}<ul class="pairs" aria-label="개인 기록의 활용 경로">${uses.map(([title, body]) => `<li><h3>${esc(title)}</h3><p>${esc(body)}</p></li>`).join('')}</ul><p class="note">모든 활용은 개인이 정한 대상·목적·범위·기간과 국가별 정책 조건 안에서만 이뤄집니다.</p></div></section>`;

const routes = [
  ['/products/#uniqlab', 'UniQLab', '개인이 연구 참여와 공유 범위를 선택한 뒤 연결되는 연구 워크스페이스.'],
  ['/products/#bodab', 'Bodab', '복약, 일정, 생활 상태를 가족과 함께 챙기는 돌봄 경험.'],
];
const uniqdataTile = tile({ className: 'product-tile', body: `<div class="product-copy"><h2 id="products-title">${lines('개인 건강기록의', '현재 시작점, UniQdata.')}</h2><p>여러 출처의 건강기록을 개인 DB에서 관리하며 활용과 공유 범위를 정하는 접점입니다. DataQ는 원본과 출처를 보존하면서 형식·항목·단위를 표준화하는 내부 처리 단계입니다.</p>${button({ href: 'https://uniqdata.io/', label: 'UniQdata 보기', variant: 'ghost', arrow: '↗' })}</div><div class="product-shots"><p class="note product-shots-note">${appShotShortNotice}</p>${phone('connect')}${phone('report')}</div>` });
const products = `<section class="section" id="products" aria-labelledby="products-title"><div class="wrap">${tag('제품')}${uniqdataTile}<div class="subhead"><h2 class="h2-sm" id="routes-title">${lines('하나의 기록,', '활용은 자유롭게.')}</h2>${link({ href: '/products/', label: '모든 제품 보기' })}</div><div class="duo">${routes.map(([href, name, body]) => `<a class="tile tile--link" href="${href}"><h3>${name}</h3><p>${esc(body)}</p><span class="tile-mark" aria-hidden="true">↗</span></a>`).join('')}</div></div></section>`;

const story = `<section class="section" id="story" aria-labelledby="care-title"><div class="wrap story"><div class="story-main">${tag('이야기')}<h2 id="care-title">${lines('돌봄에서,', '더 큰 문제를 찾았습니다.')}</h2><p class="lead">가족이 어르신의 복약·활동·진료를 함께 챙기려 해도, 필요한 기록은 병원·약국·앱에 흩어져 있었습니다.</p><p>가족은 복약 확인 상태와 진료 전에 필요한 정보를 보려면 여러 곳의 기록을 대조하고 서로 다시 물어야 했습니다. 어떤 기록을 누구와 나눌지도 개인이 쉽게 정할 수 없었습니다.</p><p>SportiQue는 Bodab 한 앱에 그치지 않고, 개인이 기록을 한곳에 모아 관리하며 활용·공유 범위를 직접 정하는 기반을 만들기로 했습니다.</p></div><div class="story-side"><h3 id="journey-title">${lines('기록의 공유를', '개인이 정하도록.')}</h3><p class="year">2025</p><p>2025년 XRPL 데모에서 사용자는 공유할 기록과 열람 기간을 선택했습니다. 허용된 접근·활용 이력을 확인하고 연구 참여 보상을 자동으로 받는 흐름도 구현했습니다.</p><p>건강기록 원문은 개인 DB에 두고 권한과 이용 이력만 연결했습니다. 이 경험을 UniQdata의 기록 관리와 공유 선택으로 이어가고 있습니다.</p>${link({ href: '/awards/', label: '수상·선정·발표 기록 보기' })}</div></div></section>`;

const closing = `<section class="section closing" id="collaboration" aria-labelledby="collaboration-title"><div class="wrap closing-inner"><h2 id="collaboration-title">${lines('새로운 참여자와 기록을,', '기존 연구에 연결합니다.')}</h2><p class="lead">연구·헬스케어 기업이 기존 시스템을 계속 사용하면서, 새로운 참여자와 개인이 동의한 장기 건강기록을 연결할 방법을 함께 찾고 싶습니다.</p><p class="lead">필요한 참여자와 기록부터 이야기해 주세요. 모집 경로·동의·연동 가능성을 확인한 뒤 유료 실증이나 구독 범위를 논의합니다.</p><div class="actions">${button({ href: '/contact/', label: '협력 논의하기', arrow: '↗' })}</div><div class="closing-more"><h3>${lines('제품 도입과 협업을,', '논의합니다.')}</h3><p>개인 기록 관리, 현장 적용, 동의 기반 활용을 함께 검토할 파트너를 찾습니다.</p><div class="actions">${button({ href: '/contact/', label: '문의하기', variant: 'ghost' })}${link({ href: '/institutions/', label: '기관 도입 안내' })}</div></div></div></section>`;

export default {
  path: '/',
  title: '건강기록은 한곳에, 선택은 개인에게',
  description: 'SportiQue는 흩어진 건강기록을 개인이 모아 관리하고, 쓰거나 나눌 때 대상과 범위를 직접 정하는 기반을 만듭니다.',
  async body() {
    return [hero(await worldLights()), world, app, problem, system, value, products, story, closing].join('\n');
  },
};
