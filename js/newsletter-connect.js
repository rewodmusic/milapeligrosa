
/* ==========================================
   MILA NEWSLETTER — CLOUDFLARE + NOTION
   ========================================== */

(() => {
  "use strict";

  const WORKER_URL =
    "https://mila-newsletter.mila-c4b.workers.dev";

  function init() {
    const form = document.getElementById("newsletter-form");
    const emailInput = document.getElementById("newsletter-email");
    const consentInput = document.getElementById("newsletter-consent");
    const websiteInput = document.getElementById("newsletter-website");
    const feedback = document.getElementById("newsletter-feedback");

    if (!form || !emailInput || !consentInput || !feedback) {
      console.error("Newsletter: missing HTML elements");
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    const buttonText = button?.querySelector("span");

    let sending = false;

    function showMessage(text, error = false) {
      feedback.textContent = text;
      feedback.dataset.state = error ? "error" : "success";
      feedback.hidden = false;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (sending) return;

      const email = emailInput.value.trim().toLowerCase();

      if (!emailInput.checkValidity() || !email) {
        showMessage("PLEASE ENTER A VALID EMAIL ♡", true);
        return;
      }

      if (!consentInput.checked) {
        showMessage("PLEASE AGREE FIRST ♡", true);
        return;
      }

      sending = true;
      if (button) button.disabled = true;
      if (buttonText) buttonText.textContent = "SENDING...";

      try {
const response = await fetch(WORKER_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    email,
    consent: true
  })
});

        const result = await response.json();

        if (!response.ok || result.success !== true) {
          throw new Error(result.message || "Subscription failed");
        }

        if (result.alreadySubscribed) {
          showMessage("YOU'RE ALREADY ON THE LIST ♡");
        } else {
          showMessage("YOU'RE ON THE LIST! THANK YOU ♡");
        }

        form.reset();

      } catch (error) {
        console.error("Newsletter error:", error);

        showMessage(
          "COULDN'T SUBSCRIBE RIGHT NOW. PLEASE TRY AGAIN ♡",
          true
        );

      } finally {
        sending = false;
        if (button) button.disabled = false;
        if (buttonText) buttonText.textContent = "SUBSCRIBE";
      }
    });

    console.log("MILA NEWSLETTER: READY ♡");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
