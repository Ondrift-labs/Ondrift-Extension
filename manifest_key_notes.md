# Dev extension key

`manifest.config.ts`'s `key` field pins this extension's id to
`lbefokebdhapaaglokdpaghopihlhagg` for any locally loaded unpacked build,
regardless of which folder it's unpacked into (so `Ondrift-FE`'s
`ALLOWED_EXTENSION_ORIGINS` CORS allow-list doesn't break every release).

The matching private key lives outside this repo at
`C:\Users\mylink\.ondrift\ondrift-dev-key.pem` — never commit it. It only
secures a stable id for local dev/testing convenience.

## Chrome Web Store uploads must omit this field

The Store tracks its own key from the extension's very first upload
(`aonkgefdmgjcnhopbkeehmoacncpkeje`) and **rejects any later upload whose
manifest `key` doesn't match it exactly** — it does not silently ignore a
mismatched `key`, despite what an earlier version of this note claimed.
Uploading the regular dev build (with this pinned key) to the Store fails
with:

> 파일을 업로드하는 중에 문제가 발생했습니다. 다시 시도해 보세요.
> 매니페스트의 key 입력란 값이 현재 항목과 일치하지 않습니다.

To produce a Store-safe package, build with `ONDRIFT_BUILD_TARGET=store` set
so `manifest.config.ts` omits `key` entirely:

```
ONDRIFT_BUILD_TARGET=store npm run build   # Git Bash
$env:ONDRIFT_BUILD_TARGET='store'; npm run build   # PowerShell
```

then package/zip `dist/` as usual for upload. Rebuild without the env var
afterward (plain `npm run build`) before using `dist/` for local unpacked
testing again, so the pinned dev id comes back.

If the private key is ever lost, generate a new one and recompute the base64
public key + id (see the algorithm in Chrome's extension docs: SHA-256 the
DER-encoded public key, take the first 16 bytes, map each nibble to a-p).
