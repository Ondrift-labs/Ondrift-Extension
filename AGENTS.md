# Ondrift Extension instructions

## Commits

Write commit messages in English, regardless of the language used elsewhere in the conversation.

## Versioning

Only bump the version (`package.json` + `manifest.config.ts`) for changes big enough to be worth a distinct release — new features, notable behavior changes. Small fixes (bug fixes, small UI/copy tweaks) keep the current version; commit, sync, and refresh the release zip in place without moving the version or the git tag. If it's unclear which bucket a change falls into, ask instead of guessing.

## Chrome Web Store dashboard submissions

Don't type directly into the Chrome Web Store Developer Dashboard (no
computer-use automation typing into its Store listing / Privacy practices
fields). Instead, write the exact field content into a dated markdown file
under `docs/store-submissions/`:

- `docs/store-submissions/YYYY-MM-DD-store-listing.md`
- `docs/store-submissions/YYYY-MM-DD-privacy-practices.md`

The user copy-pastes each field from that file into the dashboard and
saves/submits it themselves. List every entry newest-first in
`docs/store-submissions/README.md`. Do this in the same task as identifying
what needs to change, not as a follow-up.

Tag every field's heading with its status: `(unchanged)` for a field left as
verified-correct, or `(fixed YYYY-MM-DD)` for one whose content changed —
never leave a heading untagged.

## Social/community posts

Before drafting, reviewing, scheduling, or publishing any social/community post for Ondrift, read and follow:

- `docs/SOCIAL_MEDIA_CONVENTIONS.md`
- `docs/SOCIAL_POST_DRAFTS.md`
- `docs/SOCIAL_POST_LOG.md`

After a post is published, record it in the post log during the same task.
