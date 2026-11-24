// /institutions/ (2026-11-24 design). Korean text is the original text of the old page in scripts/build-site.mjs.
import { esc, lines, button, link, tile, section, split } from '../ui.mjs';
import { heroTwoLine } from '../small.mjs';

const login = 'https://org.sportique.biz/workspace';

// The small line under each button is the account guidance from the old page; it tells people which sign-in applies to them.
const way = ({ title, body, action, note }) => tile({ element: 'article', className: 'access-tile', body: `<h2>${esc(title)}</h2><p>${esc(body)}</p><div class="actions">${action}</div><p class="note">${esc(note)}</p>` });

export default {
  path: '/institutions/',
  title: 'Institutions — 기관 포털',
  description: '기관 관리자·직원 및 서비스 실무자의 로그인과 신규 기관 도입을 안내합니다.',
  body() {
    const hero = heroTwoLine({
      tag: '기관',
      title: lines('기관의 다음 업무,', '여기서 이어갑니다.'),
      leadLines: ['이미 개통된 계정은 로그인으로.', '새로운 협업은 기관 도입 신청으로 시작하세요.'],
    });
    const ways = section({ body: `<div class="duo">${[
      { title: '기관 서비스 로그인', body: '기관 관리자·직원은 기관 계정으로 관리 업무를 이어갑니다. 서비스 실무자는 UniQdata 개인 계정으로 로그인해 현재 연결된 업무 플랫폼을 확인합니다.', action: button({ href: login, label: '로그인 화면 보기', arrow: '↗' }), note: '기관 계정은 기관 이메일·비밀번호로 인증합니다. 개인 계정은 UniQdata 로그인으로 이어집니다.' },
      { title: '새로운 기관 도입', body: '대학교·연구기관·병원·체육기관·기업. 필요한 제품을 선택하고 기관 도입 절차를 시작합니다.', action: button({ href: 'https://org.sportique.biz/onboarding', label: '기관 도입 신청', variant: 'ghost', arrow: '↗' }), note: '기관 확인과 제품별 계정 개통은 별도로 진행됩니다.' },
    ].map(way).join('')}</div>` });
    const roles = section({ label: 'roles-title', body: split(`<h2 id="roles-title">${esc('각자의 역할에 맞는 공간.')}</h2>`, `<p>${esc('기관 운영 계정과 UniQdata 개인 계정의 권한은 다릅니다. 로그인 화면에서 맡은 역할에 맞는 경로를 선택하세요.')}</p><div class="link-list">${link({ href: login, label: '로그인 경로 보기' })}${link({ href: 'mailto:support@sportique.biz', label: '기관 계정 지원 문의' })}</div>`) });
    return hero + ways + roles;
  },
};
