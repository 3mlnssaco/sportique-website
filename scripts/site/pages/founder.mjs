// Founder page (2026-11-24 design). Korean sentences are the original text nodes of the old /founder/ body in
// scripts/build-site.mjs, unchanged. Dropped: the English caps tags and the "01" record numbers.
import { esc, lines, tag, link, tile, section, split, rows, head, timeline, cta } from '../ui.mjs';
import { founderRecords, awardsRecords } from '../data.mjs';

const profiles = [
  ['LinkedIn', 'https://www.linkedin.com/in/seunghun-daniel-lee/'],
  ['GitHub', 'https://github.com/3mlnssaco'],
  ['App Store · SportiQue', 'https://apps.apple.com/kr/developer/sportique/id1882492724'],
];
const profileLinks = `<div class="profile-links" role="group" aria-label="외부 프로필">${profiles.map(([name, href]) => link({ href, label: name }).replace('<a class="link"', '<a class="link" target="_blank" rel="noopener noreferrer"')).join('')}</div>`;

const honors = `<div class="honors">${tag('주요 수상')}<ul>${awardsRecords.filter(r => r.founderHighlight).map(r => `<li><span class="honor-date">${esc(r.date)}</span><strong>${esc(r.title)}</strong><span class="honor-note">${esc(r.founderHighlight)}</span></li>`).join('')}</ul>${link({ href: '/awards/', label: '전체 수상·선정 이력', mark: '→' })}</div>`;

const hero = `<section class="page-hero founder-hero" aria-labelledby="page-title"><div class="wrap founder-hero-inner"><div class="founder-intro">${tag('대표')}<h1 id="page-title">${lines('SeungHun', 'Lee.')}</h1><p class="lead">이승헌 · Founder, CEO &amp; CTO</p><p class="founder-signature">BUILD. CONNECT. CARE.</p>${honors}</div><figure class="founder-portrait">${tile({ body: '<img src="/assets/verified/founder-portrait-retouched-20260923.jpg" alt="SportiQue 이승헌 대표 프로필 사진, AI 보정본" width="1024" height="1536" fetchpriority="high">' })}<figcaption class="note">이승헌 · SportiQue · AI 보정 사진</figcaption></figure></div></section>`;

const work = section({
  id: 'founder-work', label: 'work-title',
  body: split(
    `<h2 id="work-title">${lines('문제를 이해하고,', '제품으로 구현합니다.')}</h2><p>SportiQue의 제품 방향과 앱·서버·AI 구현, 기관 협업을 이끌고 있습니다. UniQdata, UniQLab, Bodab을 각각의 사용자와 현장에 맞는 건강데이터 경험으로 연결합니다.</p>${link({ href: 'mailto:daniel@sportique.biz', label: 'daniel@sportique.biz' })}${profileLinks}`,
    `<div class="founder-focus">${rows([{ title: '제품 방향과 설계' }, { title: '앱·서버·AI 구현' }, { title: '기관과 현장 협업' }])}</div>`
  ),
});

const experience = section({
  id: 'experience', label: 'experience-title',
  body: head({ id: 'experience-title', title: esc('쌓아온 경험.'), lead: '대표 개인의 교육, 자격, 논문 발표와 프로젝트 참여 이력입니다.', extra: link({ href: '/awards/', label: '회사 수상·선정 이력' }) })
    + timeline(founderRecords.map(r => ({ date: r.date, title: r.title, meta: r.meta, body: r.body }))),
});

export default {
  path: '/founder/',
  title: 'Founder — SeungHun Lee',
  description: 'SportiQue 이승헌 대표의 제품·기술 방향과 공개 교육·연구·프로그램 이력.',
  body: () => hero + work + experience + cta(),
};
