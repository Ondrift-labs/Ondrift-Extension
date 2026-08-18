# Ondrift 隐私政策

[English](../PRIVACY.md) | [한국어](PRIVACY.ko.md) | [日本語](PRIVACY.ja.md) | 简体中文

生效日期:2026 年 8 月 10 日

Ondrift 是由 Ondrift Labs 发布的 Chrome 扩展程序。它可以在你于 ChatGPT、Claude、
Gemini、Perplexity 发送提示词之前,帮助你改写并评分。本政策描述了 Ondrift
Free MVP 版本所处理的数据。

## Ondrift 处理的数据

Ondrift 仅处理提供其面向用户功能所必需的信息:

- 用户输入的 Gemini API 密钥
- 用户明确选择要改写的提示词文本
- 改写过程中生成的改进后的提示词、评分、理由说明、支持站点的 URL、应用状态、时间戳,以及 Gemini 令牌计数
- 语言、角色设定、已启用站点、本地历史记录偏好等扩展程序设置

Ondrift 不会读取或存储 AI 的响应正文、身份验证 Cookie、用户未提交的消息,
或不受支持网站的内容。

## 数据的使用与共享方式

当用户选择**改写并评分**时,所选提示词和用户的 API 密钥会通过 HTTPS 从扩展程序
的 service worker 直接发送到 Google 的 Gemini API。此传输是生成所请求的
改写结果和评分所必需的。Google 对该请求的处理方式受用户与 Google 之间的协议,
以及 Google 相应的 API 条款和隐私政策约束。

Ondrift Labs 不运营任何中间 API 服务器,也不会接收用户的 API 密钥、提示词文本、
改写结果或本地历史记录。Ondrift 不会出售用户数据、不将其用于广告用途、不进行
跨站点跟踪,也不允许人工查看这些数据。

## 本地存储与保留

API 密钥和扩展程序设置通过 `chrome.storage.local` 保存在用户本地的 Chrome
配置文件中。如果启用了本地历史记录功能,改写记录会保存在同一设备上、由扩展程序
专属的 IndexedDB 中。Ondrift 不使用 Chrome 同步存储或开发者运营的云存储。

本地设置和历史记录会一直保留,直到用户更改或删除它们。用户可以禁用单个支持的
站点、关闭历史记录功能、删除单条历史记录、清空全部历史记录、更换 API 密钥,
或移除扩展程序。移除扩展程序后,会按照 Chrome 对扩展程序数据的处理方式一并
移除扩展程序专属的本地数据。

## 权限

- `storage` 权限用于将用户的密钥、设置和偏好保存在本地 Chrome 配置文件中。
- 访问 ChatGPT、Claude、Gemini、Perplexity 仅用于检测提示词输入框、显示 Ondrift 控件、在用户请求改写后读取提示词,以及应用已批准的改写结果。
- 访问 `generativelanguage.googleapis.com` 仅用于执行用户请求的 Gemini API 调用。

## 安全性

发送给 Gemini 的数据通过 HTTPS 传输。Ondrift 仅请求实现其单一用途所需的 Chrome
权限,不会执行远程托管的代码。用户应保护好自己 Chrome 配置文件的访问权限,
并可随时通过 Google AI Studio 撤销或更换自己的 Gemini API 密钥。

## 有限使用(Limited Use)

从 Google API 接收到的信息的使用将遵守 Chrome 网上应用店用户数据政策,
包括其中的有限使用(Limited Use)要求。

## 变更与联系方式

本政策如有重大变更,将在变更后的数据处理方式生效前,通过更新生效日期并发布
修订后的政策来体现。如有隐私或支持相关的问题,请通过 Ondrift 在 Chrome
网上应用店列表中显示的、经过验证的发布者联系方式或支持渠道联系我们。
