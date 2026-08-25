# Ondrift 隐私政策

[English](../PRIVACY.md) | [한국어](PRIVACY.ko.md) | [日本語](PRIVACY.ja.md) | 简体中文

生效日期:2026 年 8 月 24 日

Ondrift 是由 Ondrift Labs 发布的 Chrome 扩展程序。它可以在你于 ChatGPT、Claude、
Gemini、Perplexity、Grok 发送提示词之前,帮助你改写并评分。本政策描述了 Ondrift
扩展程序所处理的数据。

## Ondrift 处理的数据

Ondrift 仅处理提供其面向用户功能所必需的信息:

- 用户输入的 Gemini API 密钥
- 用户明确选择要改写的提示词文本
- 改写过程中生成的改进后的提示词、评分、理由说明、支持站点的 URL、应用状态、时间戳,以及 Gemini 令牌计数
- 语言、角色设定、已启用站点、本地历史记录偏好等扩展程序设置
- 为执行免费版每日限额而随机生成的安装标识符。免费版服务还会接收执行限额所需的普通网络请求信息，包括 IP 地址。

Ondrift 不会读取或存储 AI 的响应正文、身份验证 Cookie、用户未提交的消息,
或不受支持网站的内容。

## 数据的使用与共享方式

当用户已添加自己的 Gemini API 密钥并选择**改写并评分**时,所选提示词和该密钥会
通过 HTTPS 从扩展程序的 service worker 直接发送到 Google 的 Gemini API。此时
Ondrift 的服务器不会参与,也不会接收密钥、提示词或改写结果。Google 对该请求的
处理方式受用户与 Google 之间的协议,以及 Google 相应的 API 条款和隐私政策约束。

当用户没有添加 Gemini API 密钥时,所选提示词、支持的服务、角色设定、语言和随机
安装标识符会通过 HTTPS 发送到 `ondrift.pages.dev` 上的 Ondrift Cloudflare Pages
Function。该函数使用 Ondrift 的 API 密钥将改写请求转发给 Google Gemini,然后返回
结果。此路径仅用于提供每天 3 次的免费改写,并执行按安装或按 IP 计算的限额。

当用户应用或使用 Ondrift Pro 许可证时,许可证代码会通过 HTTPS 发送到
`ondrift.pages.dev`,用于验证并应用 Pro 每日限额。付款完全由 Stripe 处理;
扩展程序不会发送付款信息,Ondrift 也不会收到银行卡数据。除上述代理改写数据外,
Pro 不会带来任何其他新的数据收集。

Ondrift 不会出售用户数据、不将其用于广告用途、不进行跨站点跟踪,也不允许人工
查看这些数据。本地历史记录不会发送到 Ondrift 的服务。

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
- 访问 ChatGPT、Claude、Gemini、Perplexity、Grok 仅用于检测提示词输入框、显示 Ondrift 控件、在用户请求改写后读取提示词,以及应用已批准的改写结果。
- 访问 `generativelanguage.googleapis.com` 仅用于执行由提供了自己密钥的用户所请求的 Gemini API 调用。
- 访问 `ondrift.pages.dev` 仅用于用户未提供 Gemini API 密钥时的免费版或 Pro 改写请求,以及 Pro 许可证验证。

## 安全性

发送给 Gemini 或 Ondrift Cloudflare Pages Function 的数据通过 HTTPS 传输。Ondrift 仅请求实现其单一用途所需的 Chrome
权限,不会执行远程托管的代码。用户应保护好自己 Chrome 配置文件的访问权限,
并可随时通过 Google AI Studio 撤销或更换自己的 Gemini API 密钥。

## 有限使用(Limited Use)

从 Google API 接收到的信息的使用将遵守 Chrome 网上应用店用户数据政策,
包括其中的有限使用(Limited Use)要求。

## 变更与联系方式

本政策如有重大变更,将在变更后的数据处理方式生效前,通过更新生效日期并发布
修订后的政策来体现。如有隐私或支持相关的问题,请通过 Ondrift 在 Chrome
网上应用店列表中显示的、经过验证的发布者联系方式或支持渠道联系我们。
