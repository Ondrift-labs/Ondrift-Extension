# Ondrift Chrome extension

Ondrift is a local-first Manifest V3 extension that rewrites and scores prompts on
ChatGPT, Claude, Gemini, and Perplexity. It calls Gemini directly from the extension service worker with
the API key supplied by the user; there is no Ondrift backend, account, or cloud
sync in the Free MVP.

The settings page supports Korean, English, and Japanese. The selected language
is used by the inline Ondrift widget and for rewritten prompts and rationales.

## Development

```sh
npm install
npm run dev
```

Use `npm run check` before packaging. A production build is written to `dist/` and
can be loaded from `chrome://extensions` with **Developer mode → Load unpacked**.

## Privacy and permissions

- `storage` stores settings locally; prompt history uses local IndexedDB.
- Access to `chatgpt.com`, `claude.ai`, `gemini.google.com`, and `perplexity.ai` is limited to detecting their prompt
  editors, showing the rewrite control, and applying a user-approved rewrite.
- Access to `generativelanguage.googleapis.com` is used only by the service worker
  to call Gemini with the user's own key.
- Ondrift does not collect or store AI response bodies and does not send prompts to
  a developer-operated server.
