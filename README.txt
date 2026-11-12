MILA PELIGROSA — SILVER / PINK REDESIGN
====================================

Replace these four files in your existing milapeligrosa project:
  index.html
  css/style.css
  js/app.js
  js/newsletter.js

Your existing folders should stay exactly as they are:
  svg/                  (all candy icons, candy titles, and logos)
  img/logo.png          (horizontal logo)
  database/             (releases.json, events.json, site.json)
  album_cover/
  album_bts/
  video/

This ZIP deliberately DOES NOT include or overwrite any SVG, JSON,
cover art, BTS photos, videos, or the actual logo image.

WHAT CHANGED
- Compact logo header, instead of a full-height hero.
- Very light grey backgrounds, thin pink separators, soft charcoal type.
- All existing external candy SVG references remain unchanged.
- Candy button hover and press physics are kept.
- Overly playful extra copy and decorative stickers removed.
- Existing JSON-driven releases, social links, events, BTS collages,
  scrolling album library, and newsletter logic preserved.

TESTS
- HTML selectors and required IDs checked.
- CSS parsed without syntax errors.
- JS syntax checked.
- Simulated browser DOM checked: latest release feat filter,
  BTS opening, event visibility, socials, library expansion,
  newsletter invalid/valid email feedback.

NEWSLETTER
The form only saves an email when an actual HTTPS backend is configured
in database/site.json and returns {"success":true}.
Until then, it displays an honest preview-mode message.

LOCAL DEVELOPMENT
Keep using your existing Vite development server (port 5502).
If using the older live-server caused SVG/XML errors, avoid switching
back to it until its injection issue is resolved.
