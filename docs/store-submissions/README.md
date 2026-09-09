# Chrome Web Store dashboard submission history

Snapshots of what was actually entered into the Chrome Web Store Developer
Dashboard's **Store listing** and **Privacy practices** tabs, kept in sync
with each dashboard edit (see the convention in the repo root `AGENTS.md`).
This is a record of the live dashboard content — not the drafting copy in
`STORE_LISTING.md` / `PRIVACY.md`, which is source material for it.

Newest first:

- [2026-09-09 — Privacy practices](2026-09-09-privacy-practices.md): fixed
  the single-purpose description and host-permission justification (both
  were missing Grok and, for the host permissions, the free-tier proxy
  mention). Saved as a draft.

## Pending fix

The dashboard's Store listing **Description** field (separate from Privacy
practices, above) contains the Privacy Policy text ("Ondrift Privacy Policy
Last updated: August 24, 2026...") instead of the product description —
likely pasted into the wrong field at some point. It should read the
"Detailed description" text from `STORE_LISTING.md` instead. The corrected
text was handed to the user to paste in manually; once confirmed applied
(and saved as a draft or submitted), add a
`docs/store-submissions/YYYY-MM-DD-store-listing.md` snapshot here.
