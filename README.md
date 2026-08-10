# Ondrift Chrome Extension

[한국어](#한국어) | [English](#english)

## 한국어

Ondrift는 ChatGPT, Claude, Gemini, Perplexity에서 프롬프트를 전송하기 전에
더 명확하게 다듬고 점수화하는 로컬 우선 Manifest V3 Chrome 확장 프로그램입니다.
사용자가 등록한 Gemini API 키로 브라우저의 확장 프로그램 서비스 워커에서
Gemini를 직접 호출하며, Free MVP에는 Ondrift 백엔드, 계정, 클라우드 동기화가
없습니다.

설정 화면과 인라인 위젯은 한국어, 영어, 일본어를 지원합니다. 선택한 언어는
재작성된 프롬프트와 개선 근거에도 적용됩니다.

### GitHub ZIP으로 설치

Chrome 웹스토어 등록 전에도 공개 릴리스 ZIP으로 설치해 사용할 수 있습니다.

1. [최신 릴리스](https://github.com/Ondrift-labs/Ondrift-Extension/releases/latest)에서 `ondrift-0.1.0.zip`을 다운로드합니다.
2. ZIP을 원하는 폴더에 완전히 압축 해제합니다.
3. Chrome에서 `chrome://extensions`를 엽니다.
4. 오른쪽 위의 **개발자 모드**를 켭니다.
5. **압축해제된 확장 프로그램을 로드**를 누릅니다.
6. `manifest.json`이 들어 있는 압축 해제 폴더를 선택합니다.
7. Ondrift 온보딩에서 본인의 Gemini API 키를 등록하고 검증합니다.
8. ChatGPT, Claude, Gemini 또는 Perplexity 탭을 새로고침한 뒤 Ondrift 위젯을 사용합니다.

ZIP 파일 자체를 Chrome에 선택하면 안 됩니다. 먼저 압축을 해제해야 합니다.
GitHub 설치판은 자동 업데이트되지 않으므로 새 릴리스가 나오면 ZIP을 다시
다운로드하고 기존 폴더를 교체한 뒤 `chrome://extensions`에서 Ondrift를
새로고침해야 합니다.

### 개발

Node.js 20.19 이상이 필요합니다.

```sh
npm install
npm run dev
```

패키징 전 전체 검증을 실행합니다.

```sh
npm run check
```

프로덕션 빌드는 `dist/`에 생성됩니다. 로컬 테스트 시
`chrome://extensions`에서 **개발자 모드 → 압축해제된 확장 프로그램을 로드**로
`dist/` 폴더를 선택합니다.

Windows에서 Chrome 웹스토어 제출용 ZIP을 생성하려면 다음을 실행합니다.

```powershell
npm run package:release
```

생성된 파일은 `release/`에 저장되며 ZIP 루트에 `manifest.json`이 위치합니다.

### 개인정보 및 권한

- `storage` 권한은 설정을 로컬에 저장하며 프롬프트 기록은 로컬 IndexedDB에 저장됩니다.
- `chatgpt.com`, `claude.ai`, `gemini.google.com`, `perplexity.ai` 접근 권한은 프롬프트 입력창 감지, 재작성 UI 표시, 사용자가 승인한 결과 적용에만 사용됩니다.
- `generativelanguage.googleapis.com` 접근 권한은 사용자의 API 키로 Gemini를 호출하는 데만 사용됩니다.
- Ondrift는 AI 응답 본문을 수집하거나 저장하지 않으며 프롬프트를 개발자 운영 서버로 전송하지 않습니다.

자세한 내용은 [PRIVACY.md](PRIVACY.md), Chrome 웹스토어 제출 문구는
[STORE_LISTING.md](STORE_LISTING.md)를 참고하세요.

## English

Ondrift is a local-first Manifest V3 Chrome extension that rewrites and scores
prompts before they are sent on ChatGPT, Claude, Gemini, and Perplexity. Gemini
is called directly from the extension service worker with an API key supplied
by the user. The Free MVP has no Ondrift backend, account, or cloud sync.

The settings interface and inline widget support Korean, English, and Japanese.
The selected language is also used for rewritten prompts and rationales.

### Install from a GitHub ZIP

You can install Ondrift from its public release ZIP before the Chrome Web Store
listing is available.

1. Download `ondrift-0.1.0.zip` from the [latest release](https://github.com/Ondrift-labs/Ondrift-Extension/releases/latest).
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

### Development

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

### Privacy and permissions

- `storage` stores settings locally; prompt history uses local IndexedDB.
- Access to `chatgpt.com`, `claude.ai`, `gemini.google.com`, and `perplexity.ai` is used only to detect prompt editors, show the rewrite interface, and apply a user-approved rewrite.
- Access to `generativelanguage.googleapis.com` is used only to call Gemini with the user's own API key.
- Ondrift does not collect or store AI response bodies and does not send prompts to a developer-operated server.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy and
[STORE_LISTING.md](STORE_LISTING.md) for Chrome Web Store submission copy.
