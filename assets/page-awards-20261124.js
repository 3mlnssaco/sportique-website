// Awards page: the filter pills show one category of the timeline (hidden attribute) and update the count.
const english = document.documentElement.lang === 'en';
const pills = document.querySelectorAll('.pill[data-filter]');
const items = document.querySelectorAll('.tl-item[data-category]');
const counter = document.querySelector('#record-count');
for (const pill of pills) {
  pill.addEventListener('click', () => {
    const value = pill.dataset.filter;
    let count = 0;
    for (const other of pills) other.setAttribute('aria-pressed', String(other === pill));
    for (const item of items) {
      item.hidden = value !== 'all' && item.dataset.category !== value;
      if (!item.hidden) count++;
    }
    if (counter) counter.textContent = english ? `${count} public record${count === 1 ? '' : 's'}` : `공개 기록 ${count}건`;
  });
}
