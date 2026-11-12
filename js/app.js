/* Mila Peligrosa — only the fixed editorial frame and Latest Release. */
(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const cyan = '#60DDE1';
  const assets = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg'];

  async function loadJson(path, fallback) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${path}`);
      return await res.json();
    } catch (err) {
      console.warn(`Couldn't load ${path}:`, err);
      return fallback;
    }
  }

  // Each of the four left slots displays ONE continuous 90°-rotated line.
  // There are no separators, ellipses, or forced line breaks.
  function renderFrame(release) {
    const isEP =
  String(release?.ep || '').trim().toLowerCase() === 'x';

const baseTitle =
  String(release?.title || 'COMING SOON').trim();

const title = (
  isEP ? `${baseTitle} EP` : baseTitle
).toUpperCase();
    const caption = `MILA PELIGROSA ${title}`;
    for (const id of ['lyrics-left-1', 'lyrics-left-2', 'lyrics-left-3', 'lyrics-left-4']) {
      const label = document.getElementById(id);
      if (label) {
        label.textContent = caption;
        label.title = caption;
        label.setAttribute('aria-label', caption);
      }
    }
    const barcodeCaption = document.getElementById('barcode-caption');
    if (barcodeCaption) barcodeCaption.textContent = caption;

    // Next to the barcode: thin = ONLY the current song title.
    const thin = document.getElementById('barcode-thin');
    if (thin) {
      thin.textContent = title;
      thin.title = title;
    }

    // Exactly the lettering/line breaks requested.
    const bold = document.getElementById('barcode-bold');
    if (bold) {
      bold.replaceChildren();
      for (const chunk of ['MILA', 'PE', 'LI', 'GRO', 'SA']) {
        const span = document.createElement('span');
        span.textContent = chunk;
        bold.append(span);
      }
      bold.setAttribute('aria-label', 'MILA PELIGROSA');
    }
    const year = document.getElementById('frame-copyright');
    if (year) year.textContent = `©${new Date().getFullYear()}`;

  }

  function shrinkToFit(node, maxFont, availableHeight) {
    // Shrink ONLY if the complete text wouldn't fit. Never use ellipsis.
    if (!node || availableHeight <= 0) return;
    let size = maxFont;
    node.style.fontSize = `${size}px`;
    node.style.transform = '';
    while (node.scrollHeight > availableHeight + 1 && size > 4.5) {
      size -= .25;
      node.style.fontSize = `${size}px`;
    }
    // Exceptionally long titles still remain complete; compress vertically as a last resort.
    if (node.scrollHeight > availableHeight && availableHeight > 0) {
      node.style.transformOrigin = 'top left';
      node.style.transform = `scaleY(${availableHeight / node.scrollHeight})`;
    }
  }

  function fitFrameLabels() {
    const rail = document.querySelector('.frame-quotes');
    if (!rail) return;
    const labels = [...rail.querySelectorAll('.frame-quote')];
    labels.forEach(label => label.style.removeProperty('font-size'));
    const preferred = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--left-font')) || 11;
    labels.forEach(label => shrinkToFit(label, preferred, label.clientHeight));

    // Thin column beside barcode: also preserve the FULL latest title.
    const thin = document.getElementById('barcode-thin');
    if (thin) {
      thin.style.removeProperty('font-size');
      const preferredThin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barcode-thin-font')) || 9;
      shrinkToFit(thin, preferredThin, thin.clientHeight);
    }
  }


  // Frame stays out of the video hero, appears when latest release enters view.
  function observeEditorialFrame() {
    const frame = $('#editorial-frame');
    const section = $('#latest-release');
    if (!frame || !section) return;
    const update = () => {
      const rect = section.getBoundingClientRect();
      frame.classList.toggle('is-visible', rect.top <= 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  }


function setupHeroSocials() {
  document.querySelectorAll('.hero__social[data-platform]').forEach(link => {
    const href = link.getAttribute('href');

    if (href && href !== '#') {
      link.removeAttribute('aria-disabled');
      link.removeAttribute('title');
      return;
    }

    link.removeAttribute('href');
    link.removeAttribute('target');
    link.removeAttribute('rel');

    link.title = `${link.dataset.platform} — link coming soon`;
    link.setAttribute('aria-disabled', 'true');
  });
}


  function safeUrl(value) {
    if (typeof value !== 'string') return '';
    const text = value.trim();
    if (!text || /^(?:google\.com|example\.com)(?:\/|$)/i.test(text)) return '';
    const address = /^https?:\/\//i.test(text) ? text : `https://${text}`;
    try {
      const url = new URL(address);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  }

  function validDate(value) {
    const match = /^(\d{4})_(\d{2})_(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    const year = +match[1], month = +match[2], day = +match[3];
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }

  function probeImage(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  async function coverForDate(date) {
    // Keep supporting the existing album_cover/YYYY_MM_DD.ext convention.
    for (const extension of assets) {
      const result = await probeImage(`/database/album_cover/${date}.${extension}`);
      if (result) return result;
    }
    return null;
  }

  function serviceLink(config, release) {
    const url = safeUrl(release[config.field]);
    const element = document.createElement(url ? 'a' : 'div');
    element.className = `service ${url ? '' : 'service--unavailable'}`;
    if (url) {
      element.href = url;
      element.target = '_blank';
      element.rel = 'noopener noreferrer';
      element.setAttribute('aria-label', `Listen to ${release.title} on ${config.name}`);
    } else {
      element.setAttribute('aria-label', `${config.name}: not available yet`);
    }

    const number = document.createElement('span');
    number.className = 'service__number';
    number.textContent = config.number;
    const icon = document.createElement('span');
    icon.className = 'service__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.style.setProperty('--icon', `url('socialbars/${config.file}')`);
    const name = document.createElement('span');
    name.className = 'service__label';
    name.textContent = config.name;
    const arrow = document.createElement('span');
    arrow.className = 'service__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = url ? '↗' : '—';
    element.append(number, icon, name, arrow);
    return element;
  }

  async function renderLatest(items) {
const releases = (Array.isArray(items) ? items : [])
  .filter(item => {
    if (!item || !validDate(item.date) || !String(item.title || '').trim()) {
      return false;
    }

    const hasFeature = Boolean(String(item.feat || '').trim());

    const isMainFeature =
      String(item.feat_but_main || '').trim().toLowerCase() === 'x';

    // Saját release mindig megjelenhet.
    // Feature release csak akkor, ha feat_but_main = "x".
    return !hasFeature || isMainFeature;
  })
  .sort((a, b) => validDate(b.date) - validDate(a.date));
    const release = releases[0];
    renderFrame(release);
    if (!release) {
      $('#latest-track').textContent = 'COMING SOON';
      return;
    }
    const isEP =
  String(release.ep || '').trim().toLowerCase() === 'x';

const displayTitle = isEP
  ? `${release.title} EP`
  : release.title;

$('#latest-track').textContent = displayTitle.toUpperCase();
    $('#latest-date').textContent = release.date.replaceAll('_', '.');
    $('#latest-services').replaceChildren(...[
      { number: '01', name: 'SPOTIFY', field: 'spotifyurl', file: 'spotify.svg' },
      { number: '02', name: 'DEEZER', field: 'deezerurl', file: 'spotify.svg' },
      { number: '03', name: 'YOUTUBE', field: 'youtubeurl', file: 'youtube.svg' },
      { number: '04', name: 'APPLE MUSIC', field: 'appleurl', file: 'applemusic.svg' },
    ].map(item => serviceLink(item, release)));

    const path = await coverForDate(release.date);
    if (path) {
      const cover = $('#latest-cover');
      cover.src = path;
      cover.alt = `${release.title} — cover artwork`;
      cover.hidden = false;
      $('#latest-cover-placeholder').hidden = true;
    } else {
      $('#latest-cover-placeholder').textContent = displayTitle.toUpperCase();
    }
  }

  async function init() {
    document.documentElement.style.setProperty('--cyan', cyan);
    const releases = await loadJson('database/releases.json', []);
    setupHeroSocials();
    observeEditorialFrame();
    await renderLatest(releases);
  }
  init().catch(error => console.error('Mila editorial initialization failed:', error));
})();
