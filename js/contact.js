
/* ==========================================================
   MILA PELIGROSA — BUSINESS INQUIRIES
   Powered by Web3Forms
   ========================================================== */

(() => {
  "use strict";

  const CONFIG = {
    endpoint: "https://api.web3forms.com/submit",
    maxMessageLength: 5000
  };

  const form = document.getElementById("business-form");
  const submitButton = document.getElementById("business-submit");
  const submitText = form?.querySelector(".business__submit-text");
  const feedback = document.getElementById("business-feedback");
  const message = document.getElementById("business-message");
  const charCount = document.getElementById("business-char-count");

  if (!form || !submitButton || !feedback) return;

  let submitting = false;

  /* ========================================================
     CHARACTER COUNTER
     ======================================================== */

  function updateCharacterCount() {
    if (!message || !charCount) return;

    const length = message.value.length;

    charCount.textContent =
      `${length} / ${CONFIG.maxMessageLength}`;

    charCount.style.color =
      length >= CONFIG.maxMessageLength
        ? "#F16AC7"
        : "#60DDE1";
  }

  if (message) {
    message.addEventListener("input", updateCharacterCount);
    updateCharacterCount();
  }

  /* ========================================================
     FEEDBACK
     ======================================================== */

  function showFeedback(text, state = "success") {
    feedback.textContent = text;
    feedback.dataset.state = state;
    feedback.hidden = false;
  }

  function clearFeedback() {
    feedback.textContent = "";
    feedback.hidden = true;
    feedback.removeAttribute("data-state");
  }

  /* ========================================================
     SUBMIT STATE
     ======================================================== */

  function setSubmitting(state) {
    submitting = state;

    submitButton.disabled = state;

    submitButton.setAttribute(
      "aria-busy",
      String(state)
    );

    if (submitText) {
      submitText.textContent = state
        ? "SENDING..."
        : "SEND INQUIRY";
    }
  }

  /* ========================================================
     FORM SUBMISSION
     ======================================================== */

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitting) return;

    clearFeedback();

    // Browser validation:
    // required fields, email, minimum message length,
    // inquiry category and privacy checkbox.

    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);

    const data = Object.fromEntries(formData.entries());

    // Prevent accidental blank submissions.

    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const messageText = String(data.message || "").trim();
    const inquiryType = String(data.inquiry_type || "").trim();

    if (
      !name ||
      !email ||
      !inquiryType ||
      messageText.length < 10 ||
      messageText.length > CONFIG.maxMessageLength
    ) {
      showFeedback(
        "PLEASE COMPLETE ALL REQUIRED FIELDS ♡",
        "error"
      );
      return;
    }

    data.name = name;
    data.email = email;
    data.message = messageText;

    // Custom email subject based on inquiry type.

    data.subject =
      `[${inquiryType}] New Inquiry - Mila Peligrosa`;

    // Remove the privacy field from the email text.
    // Consent is only used to allow form submission.

    delete data.privacy_consent;

    setSubmitting(true);

    try {
      const response = await fetch(CONFIG.endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message ||
          "Form submission failed."
        );
      }

      // Successfully submitted.

      form.reset();
      updateCharacterCount();

      showFeedback(
        "MESSAGE SENT! THANK YOU SO MUCH ♡ I'LL GET BACK TO YOU AS SOON AS I CAN.",
        "success"
      );

    } catch (error) {
      console.error("Business inquiry error:", error);

      showFeedback(
        "OOPS! SOMETHING WENT WRONG. PLEASE TRY AGAIN IN A MOMENT ♡",
        "error"
      );

      // Keep form contents so the visitor can retry.

    } finally {
      setSubmitting(false);
    }
  });

  /* ========================================================
     CLEAR OLD ERROR MESSAGES WHEN EDITING
     ======================================================== */

  form.addEventListener("input", () => {
    if (feedback.dataset.state === "error") {
      clearFeedback();
    }
  });

  form.addEventListener("change", () => {
    if (feedback.dataset.state === "error") {
      clearFeedback();
    }
  });

})();
