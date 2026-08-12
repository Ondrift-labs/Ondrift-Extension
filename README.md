<p align="center">
  <img src="docs/assets/logo.png" alt="Ondrift logo" width="96" height="96" />
</p>

# Ondrift Chrome Extension

English | [한국어](docs/README.ko.md)

Ondrift is a local-first Manifest V3 Chrome extension that rewrites and scores
prompts before they are sent on ChatGPT, Claude, Gemini, and Perplexity. Gemini
is called directly from the extension service worker with an API key supplied
by the user. The Free MVP has no Ondrift backend, account, or cloud sync.

The settings interface and inline widget support Korean, English, and Japanese.
The selected language is also used for rewritten prompts and rationales.

## Install from a GitHub ZIP

You can install Ondrift from its public release ZIP before the Chrome Web Store
listing is available.

1. Download `ondrift-0.1.10.zip` from the [latest release](https://github.com/Ondrift-labs/Ondrift-Extension/releases/latest).
2. Fully extract the ZIP to a folder.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode** in the upper-right corner.
5. Select **Load unpacked**.
6. Choose the extracted folder that contains `manifest.json`.
7. Add and verify your own Gemini API key in the Ondrift onboarding flow.
8. Refresh a ChatGPT, Claude, Gemini, or Perplexity tab and use the Ondrift widget.

Do not select the ZIP file itself in Chrome; extract it first. GitHub-installed
builds do not update automatically. For a new release, download the new ZIP,
replace the extracted folder, and reload Ondrift from `chrome://extensions`.

## Development

Node.js 20.19 or newer is required.

```sh
npm install
npm run dev
```

Run the complete verification suite before packaging:

```sh
npm run check
```

A production build is written to `dist/`. For local testing, open
`chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and
choose the `dist/` directory.

Create a Chrome Web Store ZIP on Windows with:

```powershell
npm run package:release
```

The archive is written to `release/` with `manifest.json` at its root.

## Privacy and permissions

- `storage` stores settings locally; prompt history uses local IndexedDB.
- Access to `chatgpt.com`, `claude.ai`, `gemini.google.com`, and `perplexity.ai` is used only to detect prompt editors, show the rewrite interface, and apply a user-approved rewrite.
- Access to `generativelanguage.googleapis.com` is used only to call Gemini with the user's own API key.
- Ondrift does not collect or store AI response bodies and does not send prompts to a developer-operated server.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy and
[STORE_LISTING.md](STORE_LISTING.md) for Chrome Web Store submission copy.
