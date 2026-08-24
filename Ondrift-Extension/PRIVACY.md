# Ondrift privacy policy

English | [한국어](docs/PRIVACY.ko.md) | [日本語](docs/PRIVACY.ja.md) | [简体中文](docs/PRIVACY.zh.md)

Effective date: August 24, 2026

Ondrift is a Chrome extension published by Ondrift Labs. It helps users rewrite
and score prompts before sending them on ChatGPT, Claude, Gemini, Perplexity,
and Grok. This policy describes the data handled by the Ondrift Free MVP.

## Data Ondrift handles

Ondrift handles only the information required to provide its user-facing
features:

- The Gemini API key entered by the user.
- Prompt text the user explicitly chooses to rewrite.
- The improved prompt, score, rationale, supported-site URL, application
  status, timestamp, and Gemini token counts produced during a rewrite.
- Extension settings such as language, persona, enabled sites, and local
  history preference.
- A randomly generated installation identifier used to enforce the free
  tier's daily limit. The free-tier service also receives ordinary network
  request information, including the IP address, for quota enforcement.

Ondrift does not read or store AI response bodies, authentication cookies,
messages that the user does not submit for rewriting, or content from
unsupported websites.

## How data is used and shared

When a user has added their own Gemini API key and selects **Rewrite & score**,
the selected prompt and that key are sent directly from the extension service
worker to Google's Gemini API over HTTPS. Ondrift's servers are not involved
and do not receive the key, prompt, or rewrite result. Google's handling of the
request is governed by the user's agreement with Google and Google's applicable
API terms and privacy policy.

When a user has not added a Gemini API key, the selected prompt, supported
service, persona, language, and random installation identifier are sent over
HTTPS to Ondrift's Cloudflare Pages Function at `ondrift.pages.dev`. The
function forwards the rewrite request to Google Gemini using Ondrift's API key
and returns the result. This path is used solely to provide the free tier of
three rewrites per day and to enforce its per-installation or per-IP quota.

Ondrift does not sell user data, use it for advertising, perform cross-site
tracking, or allow humans to read it. Local history is not sent to Ondrift's
service.

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
- Access to ChatGPT, Claude, Gemini, Perplexity, and Grok is used only to detect
  the prompt editor, display Ondrift controls, read a prompt after the user
  requests a rewrite, and apply an approved rewrite.
- Access to `generativelanguage.googleapis.com` is used only to make the Gemini
  API request initiated by a user who supplied their own key.
- Access to `ondrift.pages.dev` is used only for free-tier rewrite requests
  when the user has not supplied a Gemini API key.

## Security

Data sent to Gemini or Ondrift's Cloudflare Pages Function is transmitted over
HTTPS. Ondrift requests only the Chrome permissions needed for its single
purpose and does not execute remotely hosted code. Users should protect access
to their Chrome profile and may revoke or replace their Gemini API key through
Google AI Studio at any time.

## Limited Use

The use of information received from Google APIs will adhere to the Chrome Web
Store User Data Policy, including the Limited Use requirements.

## Changes and contact

Material changes to this policy will be reflected by updating the effective
date and the published policy before the changed data practice takes effect.
For privacy or support requests, use the verified publisher contact or support
channel displayed on Ondrift's Chrome Web Store listing.
