// Vision page (/vision/), 2026-11-24 design. Korean sentences are the original text nodes of scripts/vision-content.html.
// The old atlas svg is replaced by the world-lights piece. New words: scripts/english-copy.d/company.json.
import { lines, link, tag, pageHero, section, split, head, rows, cta } from '../ui.mjs';
import { worldLights } from '../world-lights.mjs';

const hero = pageHero({
  title: lines('개인의 기록으로,', '세계를 잇습니다.'),
  lead: '나라가 달라도, 한 사람의 건강기록은 서비스와 일상에서 이어져야 합니다. 저장·활용·공유의 선택은 그 사람에게 남습니다. SportiQue는 이를 위한 개인 중심 건강데이터 네트워크를 만듭니다.',
  tag: '비전',
  id: 'vision-title',
});

const world = `<section class="vision-world"><div class="vision-world-map">${worldLights()}</div><div class="wrap"><p class="note vision-map-note">연결의 방향을 보여 주는 비전 시각화입니다. 국가별 제공은 현지 정책과 데이터 보관 조건에 맞춰 검증합니다.</p></div></section>`;

const principles = section({
  id: 'principles',
  label: 'vision-principles-title',
  body: head({
    tag: '원칙',
    id: 'vision-principles-title',
    title: lines('흩어진 기록을', '개인에게 돌려줍니다.'),
    lead: '세계를 잇는 비전을 위해, 건강기록을 개인의 DB에 모으고 쓰임과 공유 결정을 개인에게 돌려줍니다.',
  }) + rows([
    { title: '모으고.', body: '병원, 기기, 앱과 일상에 흩어진 기록을 원본과 출처를 보존하며 개인 DB에서 관리합니다.' },
    { title: '활용하고.', body: '기록을 일상과 진료 준비, 돌봄, AI 질문 등 필요한 목적에 맞게 이어 씁니다.' },
    { title: '결정합니다.', body: '누구에게 어떤 목적으로 어느 범위와 기간까지 공유할지 개인이 정하고, 동의와 이용 이력을 확인합니다.' },
  ]),
});

const start = section({
  id: 'start',
  label: 'vision-start-title',
  body: split(
    `${tag('시작')}<h2 id="vision-start-title">${lines('기록의 출발점은,', 'UniQdata.')}</h2>`,
    `<p>UniQdata는 개인 건강기록을 관리하는 현재의 접점입니다. DataQ는 그 안에서 출처와 원본을 보존하며 형식·항목·단위를 정리합니다. 이 기반 위에서 개인이 필요한 활용과 공유를 선택합니다.</p><div class="actions">${link({ href: 'https://uniqdata.io/', label: 'UniQdata 보기' })}${link({ href: '/about/', label: 'SportiQue 이야기' })}</div>`,
  ),
});

export default {
  path: '/vision/',
  title: 'Vision — 개인의 기록으로 세계를 잇습니다',
  description: 'SportiQue가 지향하는 개인 중심 건강데이터 네트워크. 국가가 달라도 기록은 이어지고, 활용과 공유는 개인이 선택합니다.',
  body() {
    return [hero, world, principles, start, cta()].join('\n');
  },
};
