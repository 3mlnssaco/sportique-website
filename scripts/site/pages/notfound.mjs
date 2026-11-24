// /404.html (2026-11-24 design). Korean text is the original text of the old page in scripts/build-site.mjs.
import { lines, button } from '../ui.mjs';
import { heroTwoLine } from '../small.mjs';

export default {
  path: '/404.html',
  title: '404 — 새로운 경로로',
  description: '요청한 페이지를 찾을 수 없습니다. SportiQue 홈과 제품으로 이동하세요.',
  body() {
    return heroTwoLine({
      title: lines('길을 잃었나요?', '다시 연결합니다.'),
      leadLines: ['요청한 페이지가 없거나 주소가 바뀌었습니다.'],
      actions: button({ href: '/', label: '홈으로 돌아가기', arrow: '↗' }) + button({ href: '/products/', label: '제품 보기', variant: 'ghost', arrow: '↗' }),
    });
  },
};
