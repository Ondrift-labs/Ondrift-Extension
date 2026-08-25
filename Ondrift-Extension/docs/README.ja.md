# Ondrift Chrome 拡張機能

[English](../README.md) | [한국어](README.ko.md) | 日本語 | [简体中文](README.zh.md)

Ondrift は、ChatGPT、Claude、Gemini、Perplexity、Grok でプロンプトを送信する前に
書き直してスコアリングする、ローカルファーストの Manifest V3 Chrome 拡張機能です。
API キーがなくても、Ondrift の Cloudflare プロキシを通じて1日3回無料で
書き直せます。自分の Gemini キーを追加したユーザーは、Ondrift のバックエンドを
一切経由せず、拡張機能から Gemini へ直接、回数制限なくリクエストできます。
アカウントやクラウド同期は必要ありません。

製品概要、プライバシーモデル、最新のインストール手順については公式サイト
[Ondrift website](https://ondrift.pages.dev/) をご覧ください。

設定画面とインラインウィジェットは韓国語、英語、日本語、簡体字中国語に対応しています。
選択した言語は書き直されたプロンプトと根拠の説明にも適用されます。

## インストール

### Chrome ウェブストアからインストール(推奨)

[Chrome ウェブストアのページ](https://chromewebstore.google.com/detail/aonkgefdmgjcnhopbkeehmoacncpkeje)
から直接インストールできます。自動的に更新され、最も簡単な方法です。

### GitHub ZIP からインストール

Chrome ウェブストアに反映される前のビルドを試すなど、特定のリリースを手動で
インストールしたい場合は、公開リリース ZIP からインストールすることもできます。

1. [最新リリース](https://github.com/Ondrift-labs/Ondrift-Extension/releases/latest) から `ondrift-0.2.2.zip` をダウンロードします。
2. ZIP を完全に解凍します。
3. Chrome で `chrome://extensions` を開きます。
4. 右上の **デベロッパーモード** を有効にします。
5. **パッケージ化されていない拡張機能を読み込む** を選択します。
6. `manifest.json` が含まれる解凍後のフォルダを選択します。
7. Ondrift のオンボーディングで自分の Gemini API キーを登録・検証します。
8. ChatGPT、Claude、Gemini、Perplexity、Grok のいずれかのタブを再読み込みし、Ondrift ウィジェットを使用します。

ZIP ファイル自体を Chrome に読み込ませないでください。必ず先に解凍してください。
GitHub からインストールした場合は自動更新されません。新しいリリースが出たら
新しい ZIP をダウンロードし、既存のフォルダを置き換えたうえで
`chrome://extensions` から Ondrift を再読み込みしてください。

## 開発

Node.js 22.22.2–22.x、24.15.0–24.x、または 26.0.0 以降を使用してください。

```sh
npm install
npm run dev
```

パッケージング前に完全な検証を実行します。

```sh
npm run check
```

本番ビルドは `dist/` に生成されます。ローカルでテストする場合は
`chrome://extensions` を開き、**デベロッパーモード** を有効にして
**パッケージ化されていない拡張機能を読み込む** から `dist/` フォルダを選択します。

Windows で Chrome ウェブストア提出用 ZIP を作成するには、次を実行します。

```powershell
npm run package:release
```

生成されたアーカイブは `release/` に保存され、ZIP のルートに `manifest.json` が配置されます。

## プライバシーと権限

- `storage` 権限は設定をローカルに保存し、プロンプト履歴はローカルの IndexedDB に保存されます。
- `chatgpt.com`、`claude.ai`、`gemini.google.com`、`perplexity.ai`、`grok.com` へのアクセスは、プロンプト入力欄の検出、書き直し UI の表示、ユーザーが承認した書き直し結果の適用にのみ使用されます。
- `generativelanguage.googleapis.com` へのアクセスは、ユーザー自身の API キーで Gemini を呼び出すためだけに使用されます。
- Ondrift は AI の応答本文を収集・保存せず、プロンプトを開発者運営のサーバーに送信しません。

詳しいプライバシーポリシーは [PRIVACY.md](../PRIVACY.md)、Chrome ウェブストア提出用の文言は
[STORE_LISTING.md](../STORE_LISTING.md) を参照してください。
