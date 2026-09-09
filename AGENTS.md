# Ondrift Extension instructions

## Commits

Write commit messages in English, regardless of the language used elsewhere in the conversation.

## Versioning

Only bump the version (`package.json` + `manifest.config.ts`) for changes big enough to be worth a distinct release — new features, notable behavior changes. Small fixes (bug fixes, small UI/copy tweaks) keep the current version; commit, sync, and refresh the release zip in place without moving the version or the git tag. If it's unclear which bucket a change falls into, ask instead of guessing.

## Chrome Web Store dashboard submissions

Whenever the Chrome Web Store Developer Dashboard's **Store listing** or
**Privacy practices** tab content is entered or changed — whether saved as a
draft or submitted for review — save an exact copy of what was entered as a
dated markdown file under `docs/store-submissions/`:

- `docs/store-submissions/YYYY-MM-DD-store-listing.md`
- `docs/store-submissions/YYYY-MM-DD-privacy-practices.md`

List every entry newest-first in `docs/store-submissions/README.md`. Do this
in the same task as the dashboard edit, not as a follow-up.

## Social/community posts

Before drafting, reviewing, scheduling, or publishing any social/community post for Ondrift, read and follow:

- `docs/SOCIAL_MEDIA_CONVENTIONS.md`
- `docs/SOCIAL_POST_DRAFTS.md`
- `docs/SOCIAL_POST_LOG.md`

After a post is published, record it in the post log during the same task.
