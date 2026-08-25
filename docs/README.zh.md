# Ondrift Chrome 扩展程序

[English](../README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | 简体中文

Ondrift 是一款本地优先的 Manifest V3 Chrome 扩展程序,可在你于 ChatGPT、Claude、
Gemini、Perplexity、Grok 发送提示词之前对其进行改写和评分。没有 API 密钥时,
可通过 Ondrift 的 Cloudflare 代理每天免费改写 3 次。添加自己的 Gemini 密钥后,
扩展程序会直接且不限次数地调用 Gemini,完全不经过 Ondrift 后端。无需账户或
云同步功能。

访问官方网站 [Ondrift website](https://ondrift.pages.dev/) 了解产品概览、隐私模型
以及最新的安装入口。

设置界面和内嵌小组件支持韩语、英语、日语和简体中文。所选语言同样会应用于
改写后的提示词及其说明。

## 安装

### 从 Chrome 网上应用店安装(推荐)

可以直接从 [Chrome 网上应用店页面](https://chromewebstore.google.com/detail/aonkgefdmgjcnhopbkeehmoacncpkeje)
安装。该方式会自动更新,是最简单的安装方式。

### 通过 GitHub ZIP 安装

如果你想手动安装某个特定版本,例如在 Chrome 网上应用店更新之前先体验新版本,
也可以通过公开发布的 ZIP 包安装。

1. 从[最新发布版本](https://github.com/Ondrift-labs/Ondrift-Extension/releases/latest)下载 `ondrift-0.2.2.zip`。
2. 完整解压该 ZIP 文件到一个文件夹。
3. 在 Chrome 中打开 `chrome://extensions`。
4. 打开右上角的**开发者模式**。
5. 选择**加载已解压的扩展程序**。
6. 选择包含 `manifest.json` 的解压后文件夹。
7. 在 Ondrift 的引导流程中添加并验证你自己的 Gemini API 密钥。
8. 刷新 ChatGPT、Claude、Gemini、Perplexity 或 Grok 的标签页,即可使用 Ondrift 小组件。

请勿在 Chrome 中直接选择 ZIP 文件本身,必须先解压。通过 GitHub 安装的版本不会
自动更新。发布新版本后,请下载新的 ZIP、替换已解压的文件夹,然后在
`chrome://extensions` 中重新加载 Ondrift。

## 开发

请使用 Node.js 22.22.2–22.x、24.15.0–24.x，或 26.0.0 及更高版本。

```sh
npm install
npm run dev
```

打包前请运行完整的验证流程:

```sh
npm run check
```

生产构建会写入 `dist/` 目录。如需本地测试,打开 `chrome://extensions`,
启用**开发者模式**,选择**加载已解压的扩展程序**,然后选择 `dist/` 目录。

在 Windows 上生成 Chrome 网上应用店提交用的 ZIP,请运行:

```powershell
npm run package:release
```

生成的压缩包会保存在 `release/` 目录下,`manifest.json` 位于 ZIP 根目录。

## 隐私与权限

- `storage` 权限用于在本地保存设置,提示词历史记录保存在本地的 IndexedDB 中。
- 访问 `chatgpt.com`、`claude.ai`、`gemini.google.com`、`perplexity.ai`、`grok.com` 仅用于检测提示词输入框、显示改写界面,以及应用用户已确认的改写结果。
- 访问 `generativelanguage.googleapis.com` 仅用于使用用户自己的 API 密钥调用 Gemini。
- Ondrift 不会收集或存储 AI 的响应内容,也不会将提示词发送到开发者运营的服务器。

完整隐私政策请参阅 [PRIVACY.md](../PRIVACY.md),Chrome 网上应用店提交文案请参阅
[STORE_LISTING.md](../STORE_LISTING.md)。
