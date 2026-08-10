# Ondrift Free MVP privacy notice

Ondrift processes the prompt text that a user chooses to rewrite on ChatGPT,
Claude, Gemini, or Perplexity. The text is sent directly from the extension service worker to Google's
Gemini API using the API key supplied by that user. Ondrift does not operate an
intermediary server and does not receive the key or prompt text.

The extension stores settings and prompt history only in the user's local Chrome
profile through `chrome.storage.local` and IndexedDB. Stored history can include
the original prompt, an improved prompt, score, rationale, supported-site URL,
application status, timestamp, and Gemini token counts. Ondrift does not read,
collect, or store AI response bodies.

Users can disable supported sites in settings and delete individual or all local
history. Removing the extension also removes extension-owned local data according
to Chrome's extension-data behavior. Data sent to Gemini is additionally governed
by the user's agreement with Google and Google's applicable API privacy terms.

Ondrift does not sell personal data, use prompt text for advertising, or perform
cross-site tracking. A published store release should host this notice at a stable
public URL and include a project contact before submission.
