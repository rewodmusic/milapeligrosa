/* MILA PELIGROSA — SONG LINKTREE
   A standalone page; does not change the homepage's JS or CSS.
   /song/?id=balkan-latina | balkanlatina | balkan_latina
*/
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const iconFiles = {spotify:'spotify.svg',deezer:'spotify.svg',youtube:'youtube.svg',apple:'applemusic.svg'};
  const services = [
    {name:'SPOTIFY', key:'spotifyurl', icon:iconFiles.spotify},
    {name:'DEEZER', key:'deezerurl', icon:iconFiles.deezer},
    {name:'YOUTUBE', key:'youtubeurl', icon:iconFiles.youtube},
    {name:'APPLE MUSIC', key:'appleurl', icon:iconFiles.apple}
  ];
  const extensions = ['jpg','jpeg','png','webp','avif','gif'];
  // Last-resort cover fallback for repositories that retained the old
  // 2026_08_xx filenames after fixing actual release dates in JSON.
  const legacyCovers = {
    'boca':'2026_08_13', 'aurora':'2026_08_12',
    'stannadan':'2026_08_11','popx':'2026_08_10',
    'bombona':'2026_08_09','gaia':'2026_08_08',
    'katana':'2026_08_07','pov':'2026_08_06',
    'memento':'2026_08_05','obojime':'2026_08_04',
    'kisanajesen':'2026_08_03','lom':'2026_08_02','bomba':'2026_08_01'
  };
  const normalize = v => String(v ?? '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'d')
    .toLowerCase().replace(/[^a-z0-9]/g,'');
  const flag = value => String(value || '').trim().toLowerCase() === 'x';
  function safeHttp(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try { const u = new URL(value.trim()); return /^https?:$/.test(u.protocol) ? u.href : ''; }
    catch { return ''; }
  }
  function cleanDate(value) { return /^\d{4}_\d{2}_\d{2}$/.test(String(value || '')) ? value : ''; }
  const imageFound = url => new Promise(resolve => {
    const i = new Image(); i.onload=()=>resolve(url); i.onerror=()=>resolve(null); i.src=url;
  });
  async function coverFor(row) {
    const primary=cleanDate(row.date);
    const fallback=legacyCovers[normalize(row.title)];
    for (const day of [primary,fallback].filter((v,i,a) => v && a.indexOf(v)===i)) {
      for (const ext of extensions) {
        const found=await imageFound(`/database/album_cover/${day}.${ext}`);
        if(found) return found;
      }
    }
    return '';
  }
  function slugFromAddress() {
    const qs = new URLSearchParams(location.search);
    let slug = qs.get('id') || qs.get('song') || '';
    if (!slug && location.hash.length > 1) slug = decodeURIComponent(location.hash.slice(1));
    return normalize(slug);
  }
  function frameFor(row) {
    const title = `${row.title}${flag(row.ep) ? ' EP':''}`.toUpperCase();
    const text=`MILA PELIGROSA ${title}`;
    for(const id of ['lyrics-left-1','lyrics-left-2','lyrics-left-3','lyrics-left-4']) {
      const el=document.getElementById(id);
      if(el) { el.textContent=text; el.title=text; el.setAttribute('aria-label',text); }
    }
    const bc=$('#barcode-caption'); if(bc) bc.textContent=text;
    const thin=$('#barcode-thin'); if(thin) thin.textContent=title;
    const bold=$('#barcode-bold');
    if(bold) {
      bold.replaceChildren();
      for(const word of ['MILA','PE','LI','GRO','SA']) {
        const s=document.createElement('span'); s.textContent=word;bold.append(s);
      }
    }
    const year=$('#frame-copyright'); if(year) year.textContent=`©${new Date().getFullYear()}`;
    // The homepage hides the frame during its video Hero; here there is NO Hero.
    $('#editorial-frame')?.classList.add('is-visible');
    fitFrame();
  }
  function shrink(node,maxSize,available) {
    if(!node || !available) return;
    node.style.fontSize=`${maxSize}px`; node.style.transform='';
    let s=maxSize;
    while(node.scrollHeight>available+1 && s>4.5){s-=0.25;node.style.fontSize=`${s}px`;}
    if(node.scrollHeight>available){node.style.transformOrigin='top left';node.style.transform=`scaleY(${available/node.scrollHeight})`;}
  }
  function fitFrame(){
    const css=getComputedStyle(document.documentElement);
    const max= parseFloat(css.getPropertyValue('--left-font')) || 11;
    document.querySelectorAll('.frame-quote').forEach(e=>shrink(e,max,e.clientHeight));
    const thin=$('#barcode-thin');
    if(thin) shrink(thin,parseFloat(css.getPropertyValue('--barcode-thin-font'))||9,thin.clientHeight);
  }
  function renderService(conf,row,index) {
    const href=safeHttp(row[conf.key]);
    const a=document.createElement(href ? 'a':'div');
    a.className=`service${href?'':' service--unavailable'}`;
    if(href){a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',`Listen to ${row.title} on ${conf.name}`);}
    const n=document.createElement('span');n.className='service__number';n.textContent=String(index+1).padStart(2,'0');
    const icon=document.createElement('span');icon.className='service__icon';icon.setAttribute('aria-hidden','true');
    icon.style.setProperty('--icon',`url('/socialbars/${conf.icon}')`);
    const label=document.createElement('span');label.className='service__label';label.textContent=conf.name;
    const arrow=document.createElement('span');arrow.className='service__arrow';arrow.textContent=href?'↗':'—';
    a.append(n,icon,label,arrow);return a;
  }
  async function renderSong(row) {
    const name=String(row.title||'').trim()+(flag(row.ep)?' EP':'');
    $('#latest-track').textContent=name.toUpperCase();
    document.title=`${name} — Mila Peligrosa`;
    document.querySelector('meta[name="description"]')?.setAttribute('content',`Listen to ${name} by Mila Peligrosa on Spotify, Deezer, YouTube and Apple Music.`);
    const servicesRoot=$('#latest-services');
    servicesRoot.replaceChildren(...services.map((s,i)=>renderService(s,row,i)));
    frameFor(row);
    const cover=await coverFor(row);
    if(cover){const img=$('#latest-cover');img.src=cover;img.alt=`${name} — cover artwork`;img.hidden=false;$('#latest-cover-placeholder').hidden=true;}
    else $('#latest-cover-placeholder').textContent=name.toUpperCase();
  }
  function initAccordions(){
    const toggles=[...document.querySelectorAll('.song-extra[aria-controls]')];
    function close(button){
      const p=document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded','false');p.classList.remove('is-open');p.inert=true;
    }
    toggles.forEach(button=>{
      const panel=document.getElementById(button.getAttribute('aria-controls'));
      button.addEventListener('click',()=>{
        const shouldOpen=button.getAttribute('aria-expanded')!=='true';
        toggles.forEach(close);
        if(shouldOpen){button.setAttribute('aria-expanded','true');panel.inert=false;panel.classList.add('is-open');}
      });
    });
  }
  async function initCoffee(){
    const anchor=$('#coffee-link'); if(!anchor)return;
    anchor.addEventListener('click',e=>{if(anchor.getAttribute('aria-disabled')==='true')e.preventDefault();});
    try{
      const r=await fetch('/database/site.json',{cache:'no-store'});
      if(!r.ok)return;
      const config=await r.json();
      const url=safeHttp(config.buymeacoffee || config.kofi);
      // A placeholder example/test URL should never be presented as Mila's Ko-fi.
      if(!url || /^https?:\/\/(?:www\.)?(?:google\.com|example\.com)(?:\/|$)/i.test(url))return;
      anchor.href=url;anchor.target='_blank';anchor.rel='noopener noreferrer';anchor.removeAttribute('aria-disabled');
    }catch(error){console.warn('Coffee link unavailable',error);}
  }
  async function init(){
    initAccordions();initCoffee();
    window.addEventListener('resize',fitFrame,{passive:true});
    const response=await fetch('/database/releases.json',{cache:'no-store'});
    if(!response.ok)throw new Error(`releases.json HTTP ${response.status}`);
    const data=await response.json();
    const rows=Array.isArray(data)?data:(Array.isArray(data.releases)?data.releases:[]);
    const releases=rows.filter(r=>r && String(r.title||'').trim());
    const slug=slugFromAddress();
    const found=slug?releases.find(r=>normalize(r.title)===slug):releases.filter(r=>cleanDate(r.date)).sort((a,b)=>b.date.localeCompare(a.date))[0];

    /* INVALID SONG ID → LATEST RELEASE */

    if (!found) {
      const latest = releases
        .filter(r => cleanDate(r.date))
        .sort((a, b) => b.date.localeCompare(a.date))[0];

      if (latest) {
        const latestSlug = String(latest.title)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        window.location.replace(
          `/song/?id=${encodeURIComponent(latestSlug)}`
        );
        return;
      }

      $('#latest-track').textContent = 'UNAVAILABLE';
      return;
    }

    await renderSong(found);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init().catch(fail));
  else init().catch(fail);
  function fail(error){console.error('Song page initialization failed:',error);$('#latest-track').textContent='UNAVAILABLE';$('#editorial-frame')?.classList.add('is-visible');}
})();


/* Original Mila events renderer, with ONLY its data URL made root-absolute */
/* ============================================================
   MILA PELIGROSA — EVENTS
   File: js/events.js

   Data: database/events.json

   FUNCTIONALITY:
   - Load events from JSON
   - Validate dates in YYYY_MM_DD format
   - Show upcoming events only, including today's events
   - Sort by date, earliest first
   - Display date, title, subtitle, description
   - Optional Instagram post and ticket links
   - Hide the ENTIRE Events section when no upcoming events
   - No BTS, no other sections, no new backgrounds
   ============================================================ */

(() => {
  'use strict';

  const SECTION_ID = 'events';
  const LIST_ID = 'events-list';
  const EVENTS_PATH = '/database/events.json';

  const section = document.getElementById(SECTION_ID);
  const list = document.getElementById(LIST_ID);

  if (!section || !list) return;


  /* ==========================================================
     HELPER — ELEMENT
     ========================================================== */

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined && text !== null) {
      element.textContent = String(text);
    }

    return element;
  }


  /* ==========================================================
     LOAD JSON
     ========================================================== */

  async function loadEvents() {
    try {
      const response = await fetch(EVENTS_PATH, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(
          `Events JSON: HTTP ${response.status}`
        );
      }

      const data = await response.json();

      return Array.isArray(data) ? data : [];

    } catch (error) {
      console.warn(
        'Mila Peligrosa — failed to load events:',
        error
      );

      return [];
    }
  }


  /* ==========================================================
     PARSE YYYY_MM_DD
     ========================================================== */

  function parseEventDate(value) {
    const match = /^(\d{4})_(\d{2})_(\d{2})$/.exec(
      String(value || '')
    );

    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }


  /* ==========================================================
     FORMAT DATE
     ========================================================== */

  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');

    const month = new Intl.DateTimeFormat('en-US', {
      month: 'short'
    }).format(date).toUpperCase();

    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  function formatWeekday(date) {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long'
    }).format(date).toUpperCase();
  }


  /* ==========================================================
     VALIDATE EXTERNAL LINKS
     ========================================================== */

  function safeUrl(value) {
    if (typeof value !== 'string') return '';

    let url = value.trim();

    if (!url) return '';



    if (
      /^[a-z0-9.-]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(url)
    ) {
      url = `https://${url}`;
    }

    try {
      const parsed = new URL(url);

      if (
        parsed.protocol !== 'https:' &&
        parsed.protocol !== 'http:'
      ) {
        return '';
      }

      return parsed.href;

    } catch {
      return '';
    }
  }


  /* ==========================================================
     EVENT ACTION LINK
     ========================================================== */

  function createEventLink(number, label, url) {
    const link = createElement(
      'a',
      'event-card__link'
    );

    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    link.setAttribute(
      'aria-label',
      `${label} — opens in a new tab`
    );

    const index = createElement(
      'span',
      'event-card__link-number',
      String(number).padStart(2, '0')
    );

    const name = createElement(
      'span',
      'event-card__link-label',
      label
    );

    const arrow = createElement(
      'span',
      'event-card__link-arrow',
      '↗'
    );

    arrow.setAttribute('aria-hidden', 'true');

    link.append(index, name, arrow);

    return link;
  }


  /* ==========================================================
     CREATE EVENT CARD
     ========================================================== */

  function createEventCard(event, date) {
    const card = createElement(
      'article',
      'event-card'
    );


    /* DATE */

    const dateRow = createElement(
      'div',
      'event-card__date'
    );

    const mainDate = createElement(
      'time',
      'event-card__date-main',
      formatDate(date)
    );

    const isoDate = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');

    mainDate.dateTime = isoDate;

    const weekday = createElement(
      'span',
      'event-card__weekday',
      formatWeekday(date)
    );

    dateRow.append(mainDate, weekday);

    card.append(dateRow);


    /* EVENT TITLE */

    const title = createElement(
      'h3',
      'event-card__title',
      event.title || 'LIVE SHOW'
    );

    card.append(title);


    /* SUBTITLE / VENUE / TIME */

    if (String(event.subtitle || '').trim()) {
      const subtitle = createElement(
        'p',
        'event-card__subtitle',
        event.subtitle
      );

      card.append(subtitle);
    }


    /* DESCRIPTION */

    if (String(event.descr || '').trim()) {
      const description = createElement(
        'p',
        'event-card__description',
        event.descr
      );

      card.append(description);
    }


    /* OPTIONAL LINKS */

    const actions = [
      {
        key: 'igpost',
        label: 'IG POST'
      },
      {
        key: 'tickets',
        label: 'TICKETS'
      }
    ];

    const links = createElement(
      'div',
      'event-card__links'
    );

    let linkNumber = 1;

    actions.forEach(action => {
      const url = safeUrl(event[action.key]);

      if (!url) return;

      const link = createEventLink(
        linkNumber,
        action.label,
        url
      );

      links.append(link);

      linkNumber += 1;
    });

    // No empty links container if the event has no valid URLs.
    if (links.children.length > 0) {
      card.append(links);
    }

    return card;
  }


  /* ==========================================================
     FILTER & SORT EVENTS
     ========================================================== */

  function getUpcomingEvents(events) {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return events
      .map(event => ({
        event,
        date: parseEventDate(event?.date)
      }))
      .filter(item => (
        item.event &&
        item.date &&
        item.date >= today
      ))
      .sort((a, b) => (
        a.date.getTime() - b.date.getTime()
      ));
  }


  /* ==========================================================
     RENDER
     ========================================================== */

  function renderEvents(events) {
    const upcoming = getUpcomingEvents(events);

    list.replaceChildren();

    // IMPORTANT:
    // No upcoming events = completely hidden section.
    // No heading, no empty state, no extra space.
    if (upcoming.length === 0) {
      section.hidden = true;
      return;
    }

    const fragment = document.createDocumentFragment();

    upcoming.forEach(({ event, date }) => {
      fragment.append(
        createEventCard(event, date)
      );
    });

    list.append(fragment);

    section.hidden = false;
  }


  /* ==========================================================
     INITIALIZE
     ========================================================== */

  async function initEvents() {
    section.hidden = true;

    const events = await loadEvents();

    renderEvents(events);
  }

  initEvents().catch(error => {
    console.error(
      'Mila Peligrosa — Events initialization error:',
      error
    );

    section.hidden = true;
  });

})();