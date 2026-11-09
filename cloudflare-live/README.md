# Current Cloudflare application source

This directory preserves the application recovered from the live `kon` Worker
(version `3f3deae9-9552-456a-89c2-00122fc15d7f`) on 2026-11-09. The repository's
root/public directory is an older GitHub Pages edition and was not used to
replace the live app.

Changes in this directory:

- App QR card at the top right of admin.html#accounts, visible to superadmin.
- QR target: https://kon.qfsv.workers.dev/ (no login information in the code).
- Locally generated SVG and downloadable PNG, with a four-module quiet zone.
- A close control for the installation button, remembered in sessionStorage
  for the current browser visit; the installation dialog also closes on an
  outside click, its existing close buttons, or Escape.

The current Worker and authentication logic are byte-for-byte unchanged.
The source snapshot contains no secret values. Existing DB and secret bindings
must be inherited from the current Worker when publishing; do not create a
new database or replace the bootstrap token.

Build the embedded public asset module with:

    node scripts/build-assets.mjs

The generated cloudflare-assets.js is not committed. This application was
published through the Cloudflare API, without a repository build trigger.
No changes to the root Pages workflow are needed for this patch.

Validation: QR PNG decoded to the exact app URL; desktop, 375px and 320px
browser checks passed with mocked admin API responses. QR visibility, image
loading, no horizontal overflow, dialog closing and persistent installation
control dismissal were checked. No database rows or real account credentials
were used in the tests.

Prepared Cloudflare version: 2ca18b6d-caa0-4440-9734-57eccef573cf.
Production activation is pending user review; the old version remains active.
