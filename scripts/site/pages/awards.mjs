// Milestones page (2026-11-24 design). Korean sentences are the original text of the old /awards/ body in
// scripts/build-site.mjs, unchanged. Filtering is assets/page-awards-20261124.js.
import { lines, pageHero, section, pills, timeline, cta } from '../ui.mjs';
import { awardsRecords, awardLabels, awardCategory, awardCategories } from '../data.mjs';
import { assetVersion } from '../shell.mjs';

const count = category => awardsRecords.filter(r => awardCategory(r) === category).length;
const filters = pills([
  { label: '전체', value: 'all', pressed: true },
  ...awardCategories.map(c => ({ label: `${awardLabels[c] ?? c} ${count(c)}`, value: c })),
], { label: '이력 분류' });

const items = timeline(awardsRecords.map((r, i) => {
  const category = awardCategory(r);
  return { id: `award-${i}`, date: r.date, kind: awardLabels[category] ?? category, title: r.title, meta: r.organizer, venue: r.venue, body: r.body, category, evidence: r.evidence };
}), { level: 'h2' });

// Same markup as pageHero().
const hero = pageHero({ tag: '이력', title: lines('팀에서 회사까지.', '이어 온 발자취.') })
  .replace('</div></section>', '<p class="lead">법인 설립 전 SportiQue 팀 활동부터 설립 이후의 선정과 현장까지.</p></div></section>');

export default {
  path: '/awards/',
  title: '이력 — 회사의 발자취',
  description: 'SportiQue의 수상·선정·발표, 해외 활동과 회사 연혁.',
  body: () => hero + section({ id: 'records', body: `<div class="filter-row">${filters}<p class="note" id="record-count" aria-live="polite">이력 ${awardsRecords.length}건</p></div>${items}` }) + cta() + `<script type="module" src="/assets/page-awards-20261124.js?v=${assetVersion()}"></script>`,
};
