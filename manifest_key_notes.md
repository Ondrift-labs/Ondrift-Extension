# Dev extension key

`manifest.config.ts`'s `key` field pins this extension's id to
`lbefokebdhapaaglokdpaghopihlhagg` for any locally loaded unpacked build,
regardless of which folder it's unpacked into (so `Ondrift-FE`'s
`ALLOWED_EXTENSION_ORIGINS` CORS allow-list doesn't break every release).

The matching private key lives outside this repo at
`C:\Users\mylink\.ondrift\ondrift-dev-key.pem` — never commit it. It only
secures a stable id for local dev/testing convenience; it has no bearing on
the Chrome Web Store listing's own id (`aonkgefdmgjcnhopbkeehmoacncpkeje`),
which the Store already assigned independently and keeps regardless of this
field.

If the private key is ever lost, generate a new one and recompute the base64
public key + id (see the algorithm in Chrome's extension docs: SHA-256 the
DER-encoded public key, take the first 16 bytes, map each nibble to a-p).
