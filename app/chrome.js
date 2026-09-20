// Header, footer, theme and language -- shared by every page.
import { t, lang, applyCopy, link } from './copy.js';
import * as store from './store.js';

const root = document.documentElement;

// The mark: two connectors, three nodes. Same geometry as the product interface.
const mark = (attrs, line, dot) => `<svg ${attrs} viewBox="0 0 512 512">
  <line x1="126.21" y1="155.32" x2="256" y2="340.68" stroke="${line}" stroke-width="26" stroke-linecap="round"/>
  <line x1="256" y1="340.68" x2="385.79" y2="155.32" stroke="${line}" stroke-width="26" stroke-linecap="round"/>
  <circle cx="126.21" cy="155.32" r="40" fill="${dot}"/>
  <circle cx="256" cy="340.68" r="58" fill="${dot}"/>
  <circle cx="385.79" cy="155.32" r="40" fill="${dot}"/>
</svg>`;

export const MARK = mark('class="mark" aria-hidden="true"', 'var(--color-accent-alt)', 'var(--color-accent)');
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent(mark('xmlns="http://www.w3.org/2000/svg"', '#B8391A', '#E8501F'));

export function init(titleKey) {
  root.lang = lang;
  root.classList.toggle('light', store.get('theme') === 'light');
  document.title = `${t(titleKey)} · NodeVSP`;

  const other = new URL(location.href);
  if (lang === 'en') other.searchParams.delete('lang'); else other.searchParams.set('lang', 'en');

  document.querySelector('link[rel=icon]').href = FAVICON;

  document.querySelector('header.top').innerHTML = `
    <a class="brand" href="${link('/')}" aria-label="${t('brand')}">${MARK}<span class="wordmark">NodeVSP</span></a>
    <nav>
      <a href="${link('/credits.html')}">${t('nav.credits')}</a>
      <a href="${other.pathname + other.search}" hreflang="${lang === 'en' ? 'es' : 'en'}">${t('nav.lang')}</a>
      <button type="button" class="theme" aria-label="${t('nav.theme')}" title="${t('nav.theme')}">◐</button>
    </nav>`;
  document.querySelector('.theme').addEventListener('click', () => {
    store.set('theme', root.classList.toggle('light') ? 'light' : 'dark');
  });

  document.querySelector('footer.foot').innerHTML = `
    <p>${t('foot.disclaimer')}</p>
    <p><a href="${link('/credits.html')}">${t('foot.credits')}</a></p>`;

  document.querySelectorAll('a[data-nav]').forEach((a) => { a.href = link(a.dataset.nav); });
  applyCopy();
}
