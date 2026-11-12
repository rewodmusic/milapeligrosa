/* ============================================================
   MILA PELIGROSA — NEWSLETTER
   File: js/newsletter.js

   CURRENT MODE:
   - Email validation works
   - No address is stored or sent without a backend
   - Honest preview feedback

   FUTURE CLOUDFLARE INTEGRATION:
   - Add newsletterEndpoint to database/site.json
   - Endpoint must accept POST JSON { email }
   - Endpoint must return { success: true } only after
     actually storing/subscribing the address

   COFFEE:
   - Reads buymeacoffee from database/site.json
   - If no valid URL is configured, link stays disabled
   ============================================================ */

(() => {
  'use strict';

  const form = document.getElementById('newsletter-form');
  const input = document.getElementById('newsletter-email');
  const feedback = document.getElementById('newsletter-feedback');
  const note = document.getElementById('newsletter-note');
  const coffee = document.getElementById('coffee-link');

  if (!form || !input || !feedback) return;

  const submit = form.querySelector('button[type="submit"]');

  let configuration = {
    newsletterEndpoint: '',
    buymeacoffee: ''
  };


  /* ==========================================================
     HELPERS
     ========================================================== */

  function safeHttpUrl(value) {
    if (typeof value !== 'string') return '';

    const raw = value.trim();

    if (!raw) return '';

    try {
      const url = new URL(raw, window.location.href);

      if (
        url.protocol !== 'https:' &&
        url.protocol !== 'http:'
      ) {
        return '';
      }

      return url.href;

    } catch {
      return '';
    }
  }

  function showFeedback(message, type) {
    feedback.hidden = false;
    feedback.textContent = message;

    feedback.className =
      `newsletter__feedback is-${type}`;

    input.setAttribute(
      'aria-invalid',
      String(type === 'error')
    );
  }

  function clearFeedback() {
    feedback.hidden = true;
    feedback.textContent = '';
    feedback.className = 'newsletter__feedback';

    input.removeAttribute('aria-invalid');
  }


  /* ==========================================================
     CONFIGURATION
     ========================================================== */

  function configureCoffee() {
    if (!coffee) return;

    const url = safeHttpUrl(configuration.buymeacoffee);

    if (!url) {
      coffee.href = '#newsletter';
      coffee.setAttribute('aria-disabled', 'true');

      coffee.addEventListener('click', preventDisabledCoffee, {
        passive: false
      });

      return;
    }

    coffee.href = url;
    coffee.target = '_blank';
    coffee.rel = 'noopener noreferrer';

    coffee.removeAttribute('aria-disabled');
    coffee.removeEventListener('click', preventDisabledCoffee);
  }

  function preventDisabledCoffee(event) {
    if (coffee?.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
    }
  }

  function configureNewsletter() {
    if (!note) return;

    const endpoint = safeHttpUrl(
      configuration.newsletterEndpoint
    );

    if (endpoint) {
      note.textContent =
        'occasional letters. unsubscribe anytime ♡';
    } else {
      note.textContent =
        'email signup coming soon ♡';
    }
  }

  async function loadConfiguration() {
    try {
      const response = await fetch('database/site.json', {
        cache: 'no-store'
      });

      if (!response.ok) return;

      const data = await response.json();

      if (
        data &&
        typeof data === 'object' &&
        !Array.isArray(data)
      ) {
        configuration = {
          ...configuration,
          ...data
        };
      }

    } catch (error) {
      console.warn(
        'Mila Peligrosa — site configuration unavailable:',
        error
      );
    }

    configureCoffee();
    configureNewsletter();
  }


  /* ==========================================================
     EMAIL VALIDATION
     ========================================================== */

  function validEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    return pattern.test(email);
  }

  input.addEventListener('input', clearFeedback);


  /* ==========================================================
     FORM SUBMISSION
     ========================================================== */

  form.addEventListener('submit', async event => {
    event.preventDefault();

    clearFeedback();

    const email = input.value.trim();

    if (!email) {
      showFeedback(
        'please enter your email address.',
        'error'
      );

      input.focus();
      return;
    }

    if (
      !input.checkValidity() ||
      !validEmail(email)
    ) {
      showFeedback(
        'please enter a valid email address.',
        'error'
      );

      input.focus();
      return;
    }


    /* CLOUDFLARE ENDPOINT */

    const endpoint = safeHttpUrl(
      configuration.newsletterEndpoint
    );


    /* NO BACKEND YET */

    if (!endpoint) {
      showFeedback(
        'your email looks good! subscriptions are not active yet, so your address has not been saved.',
        'success'
      );

      return;
    }


    /* REQUIRE HTTPS FOR THE LIVE ENDPOINT */

    const endpointURL = new URL(endpoint);

    if (
      endpointURL.protocol !== 'https:' &&
      endpointURL.origin !== window.location.origin
    ) {
      showFeedback(
        'subscriptions are temporarily unavailable.',
        'error'
      );

      return;
    }


    /* SUBMIT TO CLOUDFLARE */

    submit.disabled = true;

    const previousLabel =
      submit.querySelector('span')?.textContent || 'SUBSCRIBE';

    const label = submit.querySelector('span');

    if (label) label.textContent = 'SENDING...';

    try {
      const controller = new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        12000
      );

      let response;

      try {
        response = await fetch(endpointURL.href, {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            email
          }),

          signal: controller.signal
        });

      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result?.success !== true) {
        throw new Error(
          'Newsletter endpoint did not confirm subscription.'
        );
      }

      showFeedback(
        'you are on the list! talk soon ♡',
        'success'
      );

      form.reset();

    } catch (error) {
      console.error(
        'Mila Peligrosa — newsletter error:',
        error
      );

      showFeedback(
        'something went wrong. please try again later.',
        'error'
      );

    } finally {
      submit.disabled = false;

      if (label) {
        label.textContent = previousLabel;
      }
    }
  });


  /* ==========================================================
     INITIALIZE
     ========================================================== */

  configureCoffee();
  configureNewsletter();

  loadConfiguration();

})();