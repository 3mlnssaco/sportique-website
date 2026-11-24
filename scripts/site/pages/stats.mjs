// /products/uniqdata/now/ (2026-11-24 design). Korean text is the original text of statsPage in scripts/build-site.mjs.
// The data-stat names, the wait/error lines and the inline script are the old ones; the script picks elements by
// [data-stat=...], [data-stats-facts], [data-stats-wait] and [data-stats-error], all present below.
import { esc, lines, section, split, storeButtons } from '../ui.mjs';
import { heroTwoLine } from '../small.mjs';

const statsApi = 'https://api.kr.uniqdata.io/v1/public/stats';

const stat = (name, value) => `<div class="stat"><p class="stat-name">${esc(name)}</p><p class="stat-value">${value}</p></div>`;
const unit = (key, suffix) => `<span data-stat="${key}">—</span> <span class="stat-unit">${esc(suffix)}</span>`;

export default {
  path: '/products/uniqdata/now/',
  title: 'UniQdata 현황판 — 지금 함께 기록하는 사람들',
  description: 'UniQdata를 쓰는 사람과 확인된 기록 수를 하루 한 번 서버가 센 실제 값으로 보여 줍니다.',
  body() {
    const hero = heroTwoLine({
      tag: '지금',
      title: lines('지금 함께', '기록하는 사람들.'),
      leadLines: ['UniQdata를 쓰는 사람과 쌓인 기록을 숫자 그대로 보여 드립니다.', '하루 한 번, 한국 시각 오전 9시 기준으로 셉니다.'],
    });
    const numbers = `<section class="section stats" aria-live="polite" data-stats-facts><div class="wrap stats-grid">${stat('기록을 시작한 사람', unit('recording_members', '명'))}${stat('가입한 사람', unit('members', '명'))}${stat('지금까지 확인된 기록', unit('confirmed_records', '건'))}${stat('기준 시각', '<span data-stat="as_of">—</span>')}</div></section>`;
    const first = section({ label: 'first-title', body: split(`<h2 id="first-title">${esc('여러분은 가장 먼저 온 분들이에요.')}</h2>`, `<p>${esc('지금 확인한 기록이 내 건강 이력의 시작이에요. 기록이 쌓일수록 내 리포트가 자세해져요.')}</p><p data-stats-wait hidden>${esc('첫 기록이 확인되면 여기에 숫자가 보여요.')}</p><p data-stats-error hidden>${esc('지금은 숫자를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.')}</p><p>${esc('모든 숫자는 서버가 센 실제 값이에요. 개인을 알아볼 수 있는 정보는 없어요.')}</p>${storeButtons}`) });
    const script = `<script>(function(){var lang=document.documentElement.lang==='en'?'en-US':'ko-KR';var put=function(k,v){var el=document.querySelector('[data-stat='+k+']');if(el)el.textContent=v};fetch('${statsApi}',{credentials:'omit'}).then(function(r){if(!r.ok)throw r.status;return r.json()}).then(function(s){if(!Number(s.recording_members)){var f=document.querySelector('[data-stats-facts]');if(f)f.style.display='none';var w=document.querySelector('[data-stats-wait]');if(w)w.hidden=false;return}['recording_members','members','confirmed_records'].forEach(function(k){var n=Number(s[k]);put(k,isFinite(n)?n.toLocaleString(lang):'—')});var d=new Date(s.as_of);put('as_of',isNaN(d)?'—':d.toLocaleString(lang,{timeZone:'Asia/Seoul',month:'long',day:'numeric',hour:'numeric'}))}).catch(function(){var e=document.querySelector('[data-stats-error]');if(e)e.hidden=false})})();</script>`;
    return hero + numbers + first + script;
  },
};
