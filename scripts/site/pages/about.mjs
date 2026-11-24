// Company page (/about/), 2026-11-24 design. Every Korean sentence is the original text node of the old page
// (build-site.mjs about body, scripts/about-work-content.html); the English keys keep matching.
// New words are listed in scripts/english-copy.d/company.json.
import { esc, lines, button, link, tag, head, pageHero, section, split, rows, facts, cta } from '../ui.mjs';

const hero = pageHero({
  tag: '회사',
  title: lines('건강기록의 중심을,', '개인에게 돌려줍니다.'),
  lead: 'SportiQue는 개인이 자신의 건강기록을 모아 관리하고, 일상·돌봄·AI·연구에 활용하며, 어디에 어떤 범위로 공유할지 직접 선택하는 건강데이터 네트워크를 만듭니다.',
});

const manifesto = section({
  id: 'manifesto',
  label: 'manifesto-title',
  body: split(
    `<h2 id="manifesto-title">${lines('주도권을', '기업에서 개인으로.')}</h2>`,
    ['Bodab을 만들며 어르신의 복약 정보·활동 이력·진료·처방 기록을 가족과 공유하려 했지만, 기록은 병원·약국·앱에 흩어져 있었습니다.',
      '개인이 이를 한곳에 모아 직접 관리하고, 어떤 기록을 가족 중 누구와 공유할지 선택할 서비스가 부족했습니다.',
      '건강기록은 병원, 기기, 일상과 연구 현장에 흩어져 있습니다. SportiQue는 그 기록이 개인을 중심으로 쌓이고, 필요한 순간에 쓰일 수 있는 구조를 만듭니다.',
      '누구에게, 어떤 목적으로, 어디까지, 언제까지 공유할지 개인이 결정합니다. 연구기관은 여러 활용처 중 하나이며, 그 시작은 UniQdata입니다.']
      .map(text => `<p>${esc(text)}</p>`).join(''),
  ),
});

const work = section({
  id: 'work',
  label: 'about-work-title',
  body: head({
    tag: '제품',
    id: 'about-work-title',
    title: lines('하나의 기록 기반,', '서로 다른 삶의 쓰임.'),
    lead: '개인의 기록 관리에서 연구와 돌봄까지. 각 제품은 필요한 역할을 맡고, 기록의 활용과 공유는 개인의 선택에서 시작합니다.',
  }) + rows([
    { title: '개인 건강기록 관리', body: 'UniQdata.io는 지난 진료·검진 자료와 오늘의 생활 기록을 함께 관리하는 출발점입니다. DataQ는 그 안에서 원본과 출처를 보존하며 형식·항목·단위를 정리합니다.', html: link({ href: '/products/uniqdata/', label: 'UniQdata.io의 가치 보기 ↗', mark: '' }) },
    { title: '동의한 기록과 연구의 연결', body: 'UniQLab.io는 연구 준비, 참여자 동의, 반복 기록 수집과 자료 확인을 지원합니다. 개인은 UniQdata.io에서 참여 여부와 공유 범위를 선택하고, 연구팀은 그 범위 안에서 연구를 운영합니다.', html: link({ href: '/products/uniqlab/', label: 'UniQLab.io의 가치 보기 ↗', mark: '' }) },
    { title: '일상의 돌봄과 복약', body: 'Bodab은 어르신의 복약·일정·체크인과 허용된 가족 공유를 연결합니다.', html: link({ href: '/products/bodab/', label: 'Bodab의 가치 보기 ↗', mark: '' }) },
    { title: '현장에 맞는 기록 활용', body: ['대학·연구기관·기업이 보유한 자료와 기록 수집 업무를 확인하고, 개인의 동의와 기존 운영 환경에 맞는 적용을 함께 준비합니다. 현장별 범위와 연동 가능성은 협의와 실증으로 확인합니다.', '몽골의 대학·연구 환경에서 자료 정리와 연구 운영을 시험할 준비를 하고 있습니다. 실제 운영과 확대 범위는 시험 결과를 보고 정합니다.'], html: link({ href: '/contact/', label: '적용 가능성 논의하기 ↗', mark: '' }) },
  ]),
});

const direction = `<section class="section direction" aria-labelledby="about-direction-title"><div class="wrap">${tag('방향')}<h2 id="about-direction-title">${lines('서비스와 나라가 달라져도,', '기록은 개인에게 이어지도록.')}</h2><div class="direction-body"><p>진료 준비, 일상 관리, 가족 돌봄과 동의한 연구. 같은 기록이 여러 곳에서 쓰이더라도, 누구에게 어떤 목적으로 어느 범위와 기간까지 허용할지는 개인이 결정하는 네트워크를 만듭니다.</p><p>연구에서 생긴 개인 기록도 다시 개인에게 돌아오고, 다음 활용은 새로운 동의에서 시작하는 방향을 지향합니다. 국가별 적용은 현지 정책과 데이터 보관 조건에 맞춰 검증합니다.</p>${link({ href: '/vision/', label: '전체 비전 보기 ↗', mark: '' })}</div></div></section>`;

const principles = section({
  id: 'principles',
  body: tag('원칙') + rows([
    { title: '개인의 기록을, 한곳에.', body: '출처가 다른 기록을 한곳에 모읍니다. DataQ가 원본과 출처를 보존하면서 형식·항목·단위를 표준화하고, UniQdata가 기록을 개인 DB에서 관리합니다.' },
    { title: '기록을, 개인의 일상에.', body: '기록을 읽고 이해하는 일에서 진료 준비와 일상 루틴까지. 개인이 자기 기록을 활용하는 경험을 연결합니다.' },
    { title: '공유의 결정도, 개인이 직접.', body: '공유 대상·목적·범위·기간을 개인이 정합니다. 동의·철회와 접근·이용 이력을 확인할 수 있는 구조를 만듭니다.' },
  ]),
});

const history = section({
  id: 'foundation',
  label: 'history-title',
  body: head({
    tag: '이력',
    id: 'history-title',
    title: lines('기록의 권한을', '기술로 구현한 경험.'),
    lead: '2025년 XRPL 데모에서는 사용자가 공유 범위와 열람 기간을 직접 정하고, 접근·활용 이력을 확인하는 흐름을 구현했습니다. 건강기록 원문은 개인 DB에 두었습니다.',
    extra: link({ href: '/awards/', label: '수상·선정·발표 기록' }),
  }),
});

const profiles = [
  ['LinkedIn', 'https://www.linkedin.com/in/seunghun-daniel-lee/'],
  ['GitHub', 'https://github.com/3mlnssaco'],
  ['App Store · SportiQue', 'https://apps.apple.com/kr/developer/sportique/id1882492724'],
];
const team = section({
  id: 'team',
  label: 'team-title',
  body: head({ tag: '대표', id: 'team-title', title: lines('제품부터 기술까지,', '창업자가 직접 만듭니다.'), split: false })
    + split(
      `<p class="team-role">Founder, CEO &amp; CTO</p><p class="team-name">이승헌</p><p>SportiQue를 혼자 창업해 UniQdata의 제품 방향, 앱·서버·AI 구현, 기관 협업을 직접 이끌고 있습니다.</p>${link({ href: '/founder/', label: '대표 프로필' })}`,
      `<ul class="profile-list" aria-label="외부 프로필">${profiles.map(([name, url]) => `<li><a class="profile-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(name)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul>`,
    ),
});

const company = section({
  id: 'company',
  body: facts([
    { name: '회사', value: 'SportiQue · 스포티큐' },
    { name: '대표', value: '이승헌' },
    { name: '출발점', value: 'UniQdata' },
    { name: '분야', value: '개인 건강데이터' },
  ]),
});

export default {
  path: '/about/',
  title: '회사 — 개인에게 돌아오는 주도권',
  description: 'Bodab 돌봄 경험에서 발견한 건강기록의 단절과 개인의 기록 관리·공유 문제.',
  body() {
    return [hero, manifesto, work, direction, principles, history, team, company, cta()].join('\n');
  },
};
