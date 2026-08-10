# Chrome Web Store notes

## Single purpose

Ondrift improves and scores user-authored prompts on supported AI chat sites and
lets the user apply the improved text.

## Permission justifications

- `storage`: saves the user's API-key settings and preferences in the local Chrome
  profile. Prompt history is stored in local IndexedDB.
- `https://chatgpt.com/*`: detects the ChatGPT prompt editor, displays the Ondrift
  control, and applies a rewrite only after user confirmation.
- `https://claude.ai/*`: detects the Claude prompt editor, displays the Ondrift
  control, and applies a rewrite only after user confirmation.
- `https://generativelanguage.googleapis.com/*`: allows the extension service
  worker to call Gemini directly with the user's own API key.

Before submission, publish `PRIVACY.md` at a stable public URL, add support contact
details, and capture screenshots from the real onboarding, popup, and inline widget.
