// Small builders for markup that repeats across pages.
//
// Page module contract (every page except the old-style ones in scripts/build-site.mjs):
//  - scripts/site/pages/<name>.mjs: `export default { path, title, description, body() }` (body may be async and
//    returns the html inside <main>), or an array of such objects when one data set makes several paths (product details).
//  - Page-only styles: scripts/site/styles/<number>-<name>.css (joined by file name into assets/site-20261124.css).
//  - Copy: Korean text passed in must be an exact key of scripts/english-copy.json or scripts/english-copy.d/*.json;
//    new words go in scripts/english-copy.d/<name>.json with their English. No Korean in data-* attributes.
//  - Page-only behaviour: assets/page-<name>-20261124.js (a module), loaded at the end of the body html with
//    <script type="module" src="/assets/page-<name>-20261124.js"></script>. No scroll listeners, nothing that moves on its own.
//  - Records (founder, awards, products) come from scripts/site/data.mjs.
// Functions below return html strings. `title` of pageHero/ctaBand/head is html (build it with lines()), `html`, `actions`,
// `extra`, `left`, `right` are html; every other value, including item fields of rows/facts/timeline, is plain text and escaped.
// The English build swaps each text node by its exact Korean string.
export const esc = s => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const glyph = mark => `<span aria-hidden="true">${mark}</span>`;

// Two-line heading text: the first line is toned down (.t-first), the second (em) carries the weight.
// No :has() needed: the toned-down line is its own span.
export const lines = (first, second) => (second ? `<span class="t-first">${esc(first)}</span><br><em>${esc(second)}</em>` : esc(first));

// Pill button. `arrow` puts a mark in a dark circle on the right (primary) or inline (ghost).
export function button({ href, label, variant = 'primary', arrow = '' }) {
  const tail = arrow ? ` <span class="btn-arrow" aria-hidden="true">${arrow}</span>` : '';
  return `<a class="btn btn--${variant}${arrow ? ' btn--arrow' : ''}" href="${esc(href)}">${esc(label)}${tail}</a>`;
}

// Text link with a mark in the text colour.
export function link({ href, label, mark = '↗' }) {
  return `<a class="link" href="${esc(href)}">${esc(label)}${mark ? ` ${glyph(mark)}` : ''}</a>`;
}

// One tag sits above a section heading. `live` adds the mint dot (only for "this is on").
export function tag(label, { live = false } = {}) {
  return `<p class="tag">${live ? '<span class="tag-dot" aria-hidden="true"></span>' : ''}${esc(label)}</p>`;
}

// Section head: tag, heading, lead paragraph and optional extra (buttons).
// `split` puts the heading left and the lead right on wide screens.
export function head({ tag: label, id, title, lead = '', extra = '', level = 'h2', split = true }) {
  const heading = `<${level}${id ? ` id="${id}"` : ''}>${title}</${level}>`;
  const side = lead || extra ? `<div class="head-side">${lead ? `<p class="lead">${esc(lead)}</p>` : ''}${extra}</div>` : '';
  return `<div class="head${split ? ' head--split' : ''}"><div class="head-main">${label ? tag(label) : ''}${heading}</div>${side}</div>`;
}

// Tile: one bordered surface. `bar` is the thin line on top ([left, right]); tiles are never nested.
export function tile({ bar, body, className = '', element = 'div', attrs = '' }) {
  const top = bar ? `<div class="tile-bar"><span>${esc(bar[0])}</span><span>${esc(bar[1] ?? '')}</span></div>` : '';
  return `<${element} class="tile${className ? ` ${className}` : ''}"${attrs}>${top}${body}</${element}>`;
}

// Live store listings.
export const appStore = 'https://apps.apple.com/kr/app/uniqdata/id6760312240';
export const playStore = 'https://play.google.com/store/apps/details?id=io.uniqdata.app';
export const storeButtons = `<div class="store-buttons"><a class="store-button" lang="en" href="${appStore}" target="_blank" rel="noopener noreferrer"><small>Download on the</small><strong>App Store</strong></a><a class="store-button" lang="en" href="${playStore}" target="_blank" rel="noopener noreferrer"><small>GET IT ON</small><strong>Google Play</strong></a></div>`;
// Screens of the next UniQdata version: design reference images, not captures of the released app
// (see assets/verified/asset-provenance.json). They are always shown with the "next version" label and the notice below.
export const appShots = [
  ['connect', '연결'],
  ['routine', '루틴'],
  ['report', '리포트'],
  ['vault', '보관함'],
];
export const appShotNotice = '준비 중인 다음 버전의 디자인이며, 지금 스토어의 앱과 화면이 다릅니다. 화면 속 이름과 수치는 예시이며 실제 사용자의 기록이 아닙니다.';
export const notDiagnosisNotice = '리포트와 AI 답변은 진단을 대신하지 않습니다.';

// Phone frame drawn in css (.phone): the exported screens have no device bezel. Tall screens show their top part only.
export function phone(id) {
  const shot = appShots.find(([key]) => key === id);
  if (!shot) throw new Error(`Unknown app screen: ${id}`);
  return `<div class="phone"><img src="/assets/verified/uniqdata-next-${id}-20261124.png" alt="UniQdata 다음 버전 화면: ${esc(shot[1])}" width="375" height="812" loading="lazy" decoding="async"></div>`;
}

// App tile: the four next-version screens in one tile, with the notice below. Use once per page.
export function appTile({ bar = ['다음 버전 화면', '준비 중'], note = appShotNotice } = {}) {
  const shots = `<ul class="shots" tabindex="0" aria-label="${esc(bar[0])}">${appShots.map(([id, title]) => `<li><figure>${phone(id)}<figcaption><strong>${esc(title)}</strong></figcaption></figure></li>`).join('')}</ul>`;
  return `${tile({ bar, body: shots, className: 'app-tile' })}${note ? `<p class="note">${esc(note)}</p>` : ''}<p class="note">${esc(notDiagnosisNotice)}</p>`;
}

// First block of a page: tag, h1 (two lines via lines()), lead (640px wide), optional buttons. Left aligned, no backdrop text.
// pageHero({ tag: '제품', title: lines('개인이 기록을 모으고,', '활용을 선택합니다.'), lead: '...', actions: button({ href: '/contact/', label: '문의하기' }) })
export function pageHero({ tag: label, title, lead = '', actions = '', live = false, id = 'page-title' }) {
  return `<section class="page-hero" aria-labelledby="${id}"><div class="wrap page-hero-inner">${label ? tag(label, { live }) : ''}<h1 id="${id}">${title}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}${actions ? `<div class="actions">${actions}</div>` : ''}</div></section>`;
}

// Ordinary section: <section class="section"> with a .wrap inside. `label` is the id of the heading it is named by.
// section({ id: 'story', label: 'story-title', body: head({ id: 'story-title', ... }) + rows([...]) })
export function section({ id = '', label = '', body, className = '' }) {
  return `<section class="section${className ? ` ${className}` : ''}"${id ? ` id="${id}"` : ''}${label ? ` aria-labelledby="${label}"` : ''}><div class="wrap">${body}</div></section>`;
}

// Ruled list without boxes: title (h3) on the left, content on the right, a 1px line between rows.
// item.body is a sentence or an array of sentences (one <p> each); item.html is extra markup (links, buttons) after them.
// rows([{ title: '기록이 제각각 흩어집니다.', body: '진료·검진·복약...' }, { title: '문의', body: '...', html: link({ href: '/contact/', label: '문의하기' }) }])
export function rows(items, { level = 'h3' } = {}) {
  const row = ({ title, body = '', html = '', id = '' }) => {
    const paragraphs = [body].flat().filter(Boolean).map(text => `<p>${esc(text)}</p>`).join('');
    const content = html || [body].flat().filter(Boolean).length > 1 ? `<div class="row-body">${paragraphs}${html}</div>` : paragraphs;
    return `<article class="row"${id ? ` id="${id}"` : ''}><${level}>${esc(title)}</${level}>${content}</article>`;
  };
  return `<div class="rows">${items.map(row).join('')}</div>`;
}

// Definition list: name (13px, dim) over value (18px). item.html replaces the plain value when it holds a link.
// facts([{ name: '설립', value: '2026년 7월' }, { name: '메일', html: '<a href="mailto:hello@sportique.biz">hello@sportique.biz</a>' }])
export function facts(items) {
  return `<dl class="facts">${items.map(({ name, value = '', html = '' }) => `<div class="fact"><dt>${esc(name)}</dt><dd>${html || esc(value)}</dd></div>`).join('')}</dl>`;
}

// Centred closing section: h2, lead, buttons. Last on a page.
// ctaBand({ title: lines('다음 이야기는,', '함께.'), lead: '...', actions: button({ href: '/contact/', label: '문의하기', arrow: '↗' }) })
export function ctaBand({ title, lead = '', actions = '', id = 'cta-title' }) {
  return `<section class="section cta-band" aria-labelledby="${id}"><div class="wrap cta-band-inner"><h2 id="${id}">${title}</h2>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}${actions ? `<div class="actions">${actions}</div>` : ''}</div></section>`;
}

// The old closing block ("다음 이야기는, 함께." and the contact button), same words as the old cta constant.
// cta()
export function cta() {
  return ctaBand({ title: lines('다음 이야기는,', '함께.'), actions: button({ href: '/contact/', label: 'SportiQue에 연락하기', arrow: '↗' }) });
}

// Dated list: date column (with the optional 준비 시작 line) + content column. No numbers.
// item: { date, started, kind, title, meta, venue, body, category, id, evidence: { image, imageAlt, imageLabel, links: [{ href, label }] } }
// `category` lands in data-category (a plain id, for pills() filtering); `kind` is the small tag text above the title.
// timeline([{ date: '2026.07', kind: '선정', title: '...', meta: '주최 기관', body: '...' }])
export function timeline(items, { level = 'h3' } = {}) {
  const evidence = ({ image, imageAlt = '', imageLabel = '', links = [] } = {}) => {
    const figure = image ? `<figure class="tl-proof"><img src="${esc(image)}" alt="${esc(imageAlt)}" loading="lazy" decoding="async"><figcaption>${esc(imageLabel)}</figcaption></figure>` : '';
    const anchors = links.map(({ href, label }) => link({ href, label }).replace('<a class="link"', '<a class="link" target="_blank" rel="noopener noreferrer"')).join('');
    return figure || anchors ? `<div class="tl-evidence">${figure}${anchors ? `<div class="tl-links">${anchors}</div>` : ''}</div>` : '';
  };
  const item = ({ date, started = '', kind = '', title, meta = '', venue = '', body = '', category = '', id = '', evidence: proof }) => {
    const iso = String(date).replaceAll('.', '-');
    const time = `<time class="tl-date"${/^\d{4}-\d{2}(?:-\d{2})?$/.test(iso) ? ` datetime="${iso}"` : ''}>${esc(date)}${started ? `<small>준비 시작 ${esc(started)}</small>` : ''}</time>`;
    return `<li class="tl-item"${category ? ` data-category="${esc(category)}"` : ''}${id ? ` id="${esc(id)}"` : ''}>${time}<div class="tl-body">${kind ? `<p class="tag tag--sm">${esc(kind)}</p>` : ''}<${level}>${esc(title)}</${level}>${meta ? `<p class="tl-meta">${esc(meta)}</p>` : ''}${venue ? `<p class="tl-meta">${esc(venue)}</p>` : ''}${body ? `<p>${esc(body)}</p>` : ''}${evidence(proof)}</div></li>`;
  };
  return `<ol class="timeline">${items.map(item).join('')}</ol>`;
}

// Filter pills (44px). button: { label, value, pressed }; value goes in data-filter, pressed in aria-pressed.
// The page script flips aria-pressed and hides the matching [data-category] items with the hidden attribute.
// pills([{ label: '전체', value: 'all', pressed: true }, { label: '수상', value: 'award' }], { label: '이력 종류' })
export function pills(buttons, { label = '' } = {}) {
  return `<div class="pills" role="group"${label ? ` aria-label="${esc(label)}"` : ''}>${buttons.map(({ label: text, value, pressed = false }) => `<button type="button" class="pill" data-filter="${esc(value)}" aria-pressed="${pressed}">${esc(text)}</button>`).join('')}</div>`;
}

// Two text columns (one column up to 900px), top aligned. Put it inside a .wrap (or section()).
// split(`<h2>...</h2><p>...</p>`, rows([...]))
export function split(left, right) {
  return `<div class="split split--top"><div class="split-main">${left}</div><div class="split-side">${right}</div></div>`;
}

// The order in which a study runs, as six steps. `kind` says which product the step happens in: lab (UniQLab),
// person (UniQdata) or core (between the two); the lanes are told by position and words, not by colour.
// Used on the home page, the product list and the UniQLab page. Show researchFlowNote under it.
export const researchFlowNote = 'UniQLab과 앱의 연구 참여 기능은 개발 중이며, 위 순서는 현재 설계 기준입니다.';
const flowSteps = [
  ['lab', '연구기관이 UniQLab에서', '연구를 제안합니다.', '연구 목적, 요청 항목, 기간, 대상자 조건을 정해 제출합니다.'],
  ['core', 'SportiQue가', '제안을 검토합니다.', '검토를 마친 연구만 참여자에게 열립니다.'],
  ['person', '개인이 UniQdata에서', '요청을 보고 동의합니다.', '연구 목적과 요청 항목·기간을 보고 직접 선택합니다. 연구마다 따로 동의하고, 철회하면 새로운 사용은 바로 멈춥니다.'],
  ['core', '두 제품 사이에서', '동의한 범위의 기록만 연결됩니다.', '기관 계정만으로는 개인 기록에 접근할 수 없습니다.'],
  ['lab', '연구기관이 UniQLab에서', '참여와 기록 현황을 확인합니다.', '동의 현황, 과제와 알림, 기록이 들어온 현황을 한곳에서 봅니다.'],
  ['person', '개인이 UniQdata에서', '연구가 끝나도 기록을 계속 가집니다.', '같은 기록으로 다음 연구나 다른 활용을 다시 선택합니다.'],
];
export function researchFlow() {
  const lanes = `<div class="flow-lanes" aria-hidden="true"><div class="flow-lane"><strong>UniQLab</strong><small>연구기관</small>${tag('개발 중')}</div><div class="flow-lane"><strong>UniQdata</strong><small>개인</small>${tag('서비스 중', { live: true })}</div></div>`;
  const step = ([kind, who, title, body], index) => `<li class="flow-step flow-step--${kind}"><span class="flow-n" aria-hidden="true">${index + 1}</span><div class="flow-card"><p class="flow-who">${esc(who)}</p><h3>${esc(title)}</h3><p>${esc(body)}</p></div></li>`;
  return `${lanes}<ol class="flow" aria-label="연구가 진행되는 순서">${flowSteps.map(step).join('')}</ol>`;
}
