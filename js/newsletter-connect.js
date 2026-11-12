
/* ==========================================================
   MILA PELIGROSA — NEWSLETTER CONNECTION
   Cloudflare Worker -> Notion
   ========================================================== */

(() => {
  "use strict";

  const WORKER_URL =
    "https://mila-newsletter.mila-c4b.workers.dev";

  const form = document.getElementById("newsletter-form");
  const emailInput = document.getElementById("newsletter-email");
  const consentInput = document.getElementById("newsletter-consent");
  const feedback = document.getElementById("newsletter-feedback");
  const submitButton = form?.querySelector(
    'button[type="submit"]'
  );

  if (!form || !emailInput || !consentInput || !feedback) {
    console.error("Newsletter: required elements missing");
    return;
  }

  let submitting = false;

  function showFeedback(message, isError = false) {
    feedback.textContent = message;
    feedback.hidden = false;
    feedback.dataset.state = isError ? "error" : "success";
    feedback.setAttribute("role", "status");
  }

  function clearFeedback() {
    feedback.hidden = true;
    feedback.textContent = "";
    feedback.removeAttribute("data-state");
  }

  function setLoading(loading) {
    submitting = loading;

    if (!submitButton) return;

    submitButton.disabled = loading;
    submitButton.setAttribute("aria-busy", String(loading));

    const label = submitButton.querySelector("span");

    if (label) {
      label.textContent = loading
        ? "SENDING..."
        : "SUBSCRIBE";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Stops the previous placeholder submission handler.
    event.stopImmediatePropagation();

    if (submitting) return;

    clearFeedback();

    const email = emailInput.value.trim().toLowerCase();

    if (!emailInput.checkValidity() || !email) {
      showFeedback("PLEASE ENTER A VALID EMAIL ADDRESS ♡", true);
      emailInput.focus();
      return;
    }

    if (!consentInput.checked) {
      showFeedback(
        "PLEASE AGREE TO RECEIVE EMAILS FIRST ♡",
        true
      );
      consentInput.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },


const response = await fetch(WORKER_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    email,
    consent: true,
    website: document.getElementById("newsletter-website")?.value || ""
  })
});



      const data = await response.json();

      if (response.status === 429) {
        showFeedback(
          "TOO MANY ATTEMPTS! TRY AGAIN IN A MINUTE ♡",
          true
        );
        return;
      }

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Submission failed");
      }

      if (data.alreadySubscribed) {
        showFeedback("YOU'RE ALREADY ON THE LIST ♡");
      } else {
        showFeedback(
          "YOU'RE ON THE LIST! THANK YOU SO MUCH ♡"
        );
      }

      form.reset();

    } catch (error) {
      console.error("Newsletter submission error:", error);

      showFeedback(
        "OOPS! COULDN'T SUBSCRIBE RIGHT NOW. PLEASE TRY AGAIN ♡",
        true
      );

    } finally {
      setLoading(false);
    }
  }

  // Capture phase: takes precedence over the old
  // newsletter.js placeholder submit handler.
  form.addEventListener("submit", handleSubmit, true);

  emailInput.addEventListener("input", clearFeedback);
  consentInput.addEventListener("change", clearFeedback);

})();
