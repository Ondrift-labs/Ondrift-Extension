# Privacy practices — 2026-09-09

Snapshot of the Chrome Web Store Developer Dashboard's **Privacy practices**
tab for Ondrift (item ID `aonkgefdmgjcnhopbkeehmoacncpkeje`), taken after
fixing two stale fields (saved as a draft, not yet submitted for review).

## Single purpose description (fixed 2026-09-09)

> Ondrift helps users write clearer, more effective prompts before sending
> them to ChatGPT, Claude, Gemini, Perplexity, or Grok. When the user selects
> "Rewrite & score," the extension sends the prompt to Google's Gemini API —
> directly with the user's own API key, or through Ondrift's own
> rate-limited free-tier proxy when no key is configured — to produce an
> improved prompt, a clarity score, and a rationale that the user can review
> and optionally apply.

Previously omitted Grok and only described the BYOK path (missing the
free-tier proxy path entirely).

## Permission justifications

**storage (unchanged):**

> The storage permission stores the user's Gemini API key, extension
> settings, and local prompt history in the user's Chrome profile via
> chrome.storage.local. No data is synced to a developer-operated server.

**Host permissions (fixed 2026-09-09):**

> Host permission for chatgpt.com, claude.ai, gemini.google.com,
> perplexity.ai, and grok.com is needed to detect the prompt editor, show the
> Ondrift widget, read the prompt only when the user explicitly requests a
> rewrite, and apply the user-approved rewrite. Host permission for
> generativelanguage.googleapis.com is needed so the extension can send the
> user's rewrite request directly to the Gemini API using the user's own API
> key. Host permission for ondrift.pages.dev is needed only when the user has
> not supplied a Gemini API key, to send the user-requested free-tier rewrite
> through Ondrift's own rate-limited Cloudflare Pages Function.

Previously omitted grok.com and the ondrift.pages.dev free-tier proxy
justification entirely.

**Remote code (unchanged):** "아니요, 원격 코드 권한을 사용하고 있지 않습니다." (No)
selected — correct, justification field left blank as expected.

## Privacy policy URL (unchanged)

`https://github.com/Ondrift-labs/Ondrift-Extension/blob/main/PRIVACY.md`

## User data collected (checkboxes) (unchanged)

Checked: Authentication information, Website content/form data/user-generated
content, Web browsing activity.
Unchecked: Personally identifiable information, Health info, Financial/payment
info, Personal communications, Location, User activity.

Matches `STORE_LISTING.md`'s "Privacy-practices answers" section — verified
correct, no fix needed.

## Data-use certifications (unchanged)

All three affirmed (used only for the item's single purpose; not sold/
transferred for unrelated purposes; not used for credit or lending
decisions) — verified correct.
