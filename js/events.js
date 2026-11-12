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
  const EVENTS_PATH = 'database/events.json';

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