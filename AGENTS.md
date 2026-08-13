# Ondrift Extension instructions

## Commits

Write commit messages in English, regardless of the language used elsewhere in the conversation.

## Versioning

Only bump the version (`package.json` + `manifest.config.ts`) for changes big enough to be worth a distinct release — new features, notable behavior changes. Small fixes (bug fixes, small UI/copy tweaks) keep the current version; commit, sync, and refresh the release zip in place without moving the version or the git tag. If it's unclear which bucket a change falls into, ask instead of guessing.
