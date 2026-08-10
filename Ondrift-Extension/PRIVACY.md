# Ondrift privacy policy

Effective date: August 10, 2026

Ondrift is a Chrome extension published by Ondrift Labs. It helps users rewrite
and score prompts before sending them on ChatGPT, Claude, Gemini, and
Perplexity. This policy describes the data handled by the Ondrift Free MVP.

## Data Ondrift handles

Ondrift handles only the information required to provide its user-facing
features:

- The Gemini API key entered by the user.
- Prompt text the user explicitly chooses to rewrite.
- The improved prompt, score, rationale, supported-site URL, application
  status, timestamp, and Gemini token counts produced during a rewrite.
- Extension settings such as language, persona, enabled sites, and local
  history preference.

Ondrift does not read or store AI response bodies, authentication cookies,
messages that the user does not submit for rewriting, or content from
unsupported websites.

## How data is used and shared

When the user selects **Rewrite & score**, the selected prompt and the user's
API key are sent directly from the extension service worker to Google's Gemini
API over HTTPS. This transfer is necessary to produce the requested rewrite and
score. Google's handling of that request is governed by the user's agreement
with Google and Google's applicable API terms and privacy policy.

Ondrift Labs does not operate an intermediary API server and does not receive
the user's API key, prompt text, rewrite result, or local history. Ondrift does
not sell user data, use it for advertising, perform cross-site tracking, or
allow humans to read it.

## Local storage and retention

The API key and extension settings are stored in the user's local Chrome
profile with `chrome.storage.local`. If local history is enabled, rewrite
records are stored in extension-owned IndexedDB on the same device. Ondrift
does not use Chrome sync storage or developer-operated cloud storage.

Local settings and history remain until the user changes or deletes them. Users
can disable individual supported sites, turn off history, delete individual
history entries, clear all history, replace their API key, or remove the
extension. Removing the extension removes extension-owned local data according
to Chrome's extension-data behavior.

## Permissions

- `storage` stores the user's key, settings, and preferences in the local Chrome
  profile.
- Access to ChatGPT, Claude, Gemini, and Perplexity is used only to detect the
  prompt editor, display Ondrift controls, read a prompt after the user requests
  a rewrite, and apply an approved rewrite.
- Access to `generativelanguage.googleapis.com` is used only to make the Gemini
  API request initiated by the user.

## Security

Data sent to Gemini is transmitted over HTTPS. Ondrift requests only the Chrome
permissions needed for its single purpose and does not execute remotely hosted
code. Users should protect access to their Chrome profile and may revoke or
replace their Gemini API key through Google AI Studio at any time.

## Limited Use

The use of information received from Google APIs will adhere to the Chrome Web
Store User Data Policy, including the Limited Use requirements.

## Changes and contact

Material changes to this policy will be reflected by updating the effective
date and the published policy before the changed data practice takes effect.
For privacy or support requests, use the verified publisher contact or support
channel displayed on Ondrift's Chrome Web Store listing.
