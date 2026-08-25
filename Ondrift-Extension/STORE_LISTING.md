# Chrome Web Store submission copy

## Product details

**Name:** Ondrift

**Summary (132 characters or fewer):**

Rewrite and score prompts on ChatGPT, Claude, Gemini, Perplexity, and Grok
with 3 free daily rewrites, Pro, or your own Gemini key.

**Recommended category:** Workflow & Planning

**Detailed description:**

Ondrift helps you turn rough drafts into clearer, more useful prompts before
you send them to an AI assistant.

Write normally on ChatGPT, Claude, Gemini, Perplexity, or Grok, then choose
Rewrite & score. Ondrift reviews clarity, context, and constraints, proposes an
improved version, and lets you decide whether to apply it.

Main features:

- Works directly in the prompt editors of ChatGPT, Claude, Gemini, Perplexity,
  and Grok.
- Rewrites and scores only when you request it.
- Free: 3 rewrites a day at no cost and with no account, no API key, and no
  card required.
- Bring your own Gemini API key for unlimited rewrites billed directly by
  Google, with no Ondrift daily cap.
- Ondrift Pro ($2.99/mo): 100 rewrites a day without needing your own API key,
  unlocked with a license code after checkout.
- Stores settings and optional prompt history in your local Chrome profile.
- Does not collect or store AI response bodies.
- Supports Korean, English, Japanese, and Simplified Chinese in the extension
  interface and rewrite output.

When you provide your own Gemini API key, prompt text is sent directly from
the extension service worker to Google's Gemini API — Ondrift's servers are
never involved. When you use the free tier or an Ondrift Pro license instead,
the selected prompt is sent over HTTPS to Ondrift's Cloudflare Pages Function,
which forwards it to Gemini using Ondrift's own key and enforces the free or
Pro daily limit. Ondrift Pro is billed and processed by Paddle.com Market
Limited, our authorized reseller; the extension never sends payment details
and Ondrift never receives card data.

## Single purpose

Ondrift improves and scores user-authored prompts on supported AI chat sites and
lets the user apply the improved text.

## Permission justifications

- `storage`: Saves the user's Gemini API key, language, persona, enabled sites,
  and local-history preference in the local Chrome profile. Prompt history is
  stored in extension-owned IndexedDB.
- `https://chatgpt.com/*`: Detects the ChatGPT prompt editor, displays the
  Ondrift control, reads text only after a user requests a rewrite, and applies
  a rewrite only after user confirmation.
- `https://claude.ai/*`: Detects the Claude prompt editor, displays the Ondrift
  control, reads text only after a user requests a rewrite, and applies a
  rewrite only after user confirmation.
- `https://gemini.google.com/*`: Detects the Gemini prompt editor, displays the
  Ondrift control, reads text only after a user requests a rewrite, and applies
  a rewrite only after user confirmation.
- `https://www.perplexity.ai/*` and `https://perplexity.ai/*`: Detect the
  Perplexity prompt editor, display the Ondrift control, read text only after a
  user requests a rewrite, and apply a rewrite only after user confirmation.
- `https://grok.com/*`: Detects the Grok prompt editor, displays the Ondrift
  control, reads text only after a user requests a rewrite, and applies a
  rewrite only after user confirmation.
- `https://generativelanguage.googleapis.com/*`: Allows the extension service
  worker to send the user-initiated rewrite request directly to Gemini with the
  user's own API key.
- `https://ondrift.pages.dev/*`: Used only when the user has not supplied a
  Gemini API key, to send the user-requested free-tier rewrite (rate-limited
  per install/IP) or an Ondrift Pro rewrite, and to verify an Ondrift Pro
  license code.

## Privacy-practices answers

Declare the following data types if they are presented by the dashboard:

- Authentication information: the user's Gemini API key, and the Ondrift Pro
  license code when the user applies one.
- Website content, form data, or user-generated content: the prompt explicitly
  selected for rewriting and the returned rewrite.
- Web browsing activity: the supported-site URL stored with local history when
  history is enabled.
- Personally identifiable information: none collected by the extension itself.
  Ondrift Pro payment is handled entirely by Paddle.com Market Limited on
  Paddle's own checkout page; no payment or billing details pass through the
  extension.

Data-use certifications:

- Used only to provide Ondrift's single user-facing purpose.
- Not sold or transferred for advertising, credit, or unrelated purposes.
- Not used for personalized advertising or tracking.
- Not made available for human reading.
- Prompt and API-key transmission to Gemini uses HTTPS.
- Data is not sent to a developer-operated server.

Do not select “does not handle user data.” Chrome requires disclosure even when
data is processed or stored only on the user's device.

## Reviewer test instructions

1. Install the extension and open its options page.
2. Select a display language.
3. Enter a valid Google Gemini API key and choose **Verify key**.
4. Open ChatGPT, Claude, Gemini, Perplexity, or Grok in a signed-in browser session.
5. Enter a prompt of at least several words.
6. Choose **Rewrite & score** in the Ondrift control.
7. Review the score and improved text, then choose **Apply**.
8. Confirm the prompt editor contains the improved text and can still be edited
   before submission.
9. Open the extension popup to inspect or delete the local history entry.

No Ondrift account or reviewer credential is required. A reviewer must supply a
valid Gemini API key because the extension uses the user's own key. Testing
the free tier (steps 5-8 with no key added) and Ondrift Pro (an optional paid
upgrade unlocked with a license code from `ondrift.pages.dev/upgrade`) is not
required for review.

## Listing assets

- Store icon: `public/icons/ondrift-128.png`
- Screenshots: 1280 x 800 PNG or JPEG, at least one and up to five.
- Small promotional tile: 440 x 280 PNG or JPEG.
- Marquee promotional tile: 1400 x 560 PNG or JPEG, optional.

Recommended screenshot order:

1. Inline rewrite control on a supported prompt editor.
2. Rewrite result with score and Apply action.
3. Local history popup.
4. Provider, language, and site-access settings.
5. Privacy and onboarding screens.

## Dashboard fields still requiring publisher input

- Public privacy-policy URL hosting `PRIVACY.md`.
- Verified publisher contact email.
- Support URL or Chrome Web Store support channel.
- Distribution regions and public/unlisted visibility.
