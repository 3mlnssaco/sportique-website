// Public records for the site pages (assets/public-records.json) with the same filtering the old pages use.
// scripts/build-site.mjs and the page modules in scripts/site/pages/ both read from here.
import { readFileSync } from 'node:fs';

const sourceData = JSON.parse(readFileSync(new URL('../../assets/public-records.json', import.meta.url), 'utf8'));

// Preserve source records while withdrawing YAKSON from the public company site.
export const withoutYakson = records => records.filter(record => !/YAKSON|약손/i.test(JSON.stringify(record)));
export const data = { ...sourceData, products: sourceData.products.filter(product => product.id !== 'yakson'), founder: withoutYakson(sourceData.founder), awards: withoutYakson(sourceData.awards) };

// Unknown days remain unknown in the display; ranges sort by their ending date.
export function dateKey({ date, sortDate }) {
  if (date === '현재') return sortDate ?? Infinity;
  const value = String(sortDate ?? date);
  if (/^\d{8}$/.test(value)) return Number(value);
  const range = value.split(value.includes('.') ? /[-~–—]/ : /[~–—]/);
  const start = (range[0].match(/\d+/g) ?? []).map(Number);
  const end = (range.at(-1).match(/\d+/g) ?? []).map(Number);
  const parts = end[0] >= 1000 ? end : end.length === 1 && start.length === 3 ? [...start.slice(0, 2), ...end] : [start[0], ...end];
  return (parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
}
export const latestFirst = (a, b) => dateKey(b) - dateKey(a);

// Founder records, newest first.
export const founderRecords = [...data.founder].sort(latestFirst);

export const awardLabels = { award: '수상', selected: '선정', presentation: '발표', fieldwork: '해외 활동', company: '회사 연혁' };
export const awardCategory = r => r.category || (/수상|상$/.test(r.title) ? 'award' : /선정/.test(r.title) ? 'selected' : 'presentation');

// Milestone records, newest first. The Mongolia programme began with team preparation before incorporation;
// its July visit date stays visible, so the two entries swap places.
export const awardsRecords = [...data.awards].sort(latestFirst);
const mongoliaVisit = awardsRecords.findIndex(r => r.title === '2026 적정기술 기반 청년 창업 글로벌 실증 지원사업 몽골 현지 프로그램 참가');
const incorporation = awardsRecords.findIndex(r => r.title === '스포티큐 주식회사 설립');
if (mongoliaVisit < 0 || incorporation < 0) throw new Error('Mongolia and incorporation milestones must exist');
[awardsRecords[mongoliaVisit], awardsRecords[incorporation]] = [awardsRecords[incorporation], awardsRecords[mongoliaVisit]];
export const awardCategories = [...new Set(awardsRecords.map(awardCategory))];
