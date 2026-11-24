// Helper for the small pages (contact, institutions, stats, 404): a page hero whose lead can hold a line break,
// because the old copy was two text nodes split by <br> and each node must stay an exact English key.
import { esc, pageHero } from './ui.mjs';

export function heroTwoLine({ tag, title, leadLines = [], actions = '', id }) {
  const lead = leadLines.length ? `<p class="lead">${leadLines.map(esc).join('<br>')}</p>` : '';
  const plain = pageHero({ tag, title, id });
  const act = actions ? `<div class="actions">${actions}</div>` : '';
  return plain.replace('</div></section>', `${lead}${act}</div></section>`);
}
