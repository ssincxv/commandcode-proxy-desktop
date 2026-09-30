# CommandCode Proxy Desktop

[![CI](https://github.com/ssincxv/commandcode-proxy-desktop/actions/workflows/ci.yml/badge.svg)](https://github.com/ssincxv/commandcode-proxy-desktop/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

将 Command Code API 转换为 OpenAI / Anthropic 兼容接口的反代代理，零外部依赖。

项目基于 [MAXeaglet/commandcode-proxy](https://github.com/MAXeaglet/commandcode-proxy) 的代理核心构建，提供桌面交互、系统托盘和 Windows 安装程序。项目来源、授权及独立维护说明见 [NOTICE.md](NOTICE.md)。

A reverse proxy that converts the Command Code API into OpenAI / Anthropic compatible interfaces, with zero external dependencies.

## 下载与使用

从 [Releases](https://github.com/ssincxv/commandcode-proxy-desktop/releases) 下载 `CommandCode-Proxy-Setup-*.exe`。安装包内含所需运行环境；普通用户无需安装 Node.js、Python 或 CommandCode CLI。

1. 安装并打开程序，在“代理设置”中填写自己的 CommandCode API Key。
2. 在“概览”中启动代理。默认仅监听本机 `127.0.0.1:3050`。
3. 在客户端设置 API 地址、自己的密钥，以及模型目录中的完整模型 ID。

| 客户端 / 接口 | 默认地址 |
| --- | --- |
| OpenCode / 接受 Base URL 的客户端 | `http://127.0.0.1:3050/v1` |
| 沉浸式翻译 / 完整 Chat Completions 地址 | `http://127.0.0.1:3050/v1/chat/completions` |
| OpenAI Responses | `http://127.0.0.1:3050/v1/responses` |
| Anthropic Messages | `http://127.0.0.1:3050/v1/messages` |

OpenCode 的 Base URL 不要追加 `/chat/completions`。客户端要在同一台电脑上运行，或自行配置其他网络接入方式。

## 桌面功能

- 启动、停止、重启代理，托盘驻留与可选登录自启。
- 本地密钥管理、显示/隐藏密钥、配置导入和连接检查。
- 模型目录刷新、矩形框选、点击增减选择、Shift 多选、右键复制模型 ID。
- 最多 3 个模型并发测速，支持排队与停止。
- 显示 tokens/秒、正文首字等待与总耗时；tokens 采用上游用量，可能包含推理 token。并发、网络和上游负载会影响结果。
- 日志级别筛选与常见错误的中文提示。

测速和连接测试会向上游发送合成文本请求，可能消耗账户额度。测速快不代表正文首字等待短。

## 配置与数据

桌面配置保存在 `%APPDATA%/commandcode-proxy/config.json`，密钥保存在本机 JSON 中，未加密。点击眼睛显示或复制密钥时会读取完整密钥。不要将此文件、日志或带密钥截图提交到仓库。

`config.example.json` 是不含凭据的命令行配置示例。桌面版不依赖仓库根目录的 `config.json`，可在界面中导入现有配置。

卸载会清理安装器管理的程序、快捷方式、自启项及 Electron 用户数据，包括密钥和设置。需要保留配置时请先自行备份。

安装包未做商业代码签名，Windows 可能显示未知发布者。上游服务、账户权限和模型可用性由服务提供方决定。

## 开发与构建

要求：Windows x64、Node.js 22.12 或更新版本、npm。

```sh
npm ci
npm run desktop
npm test
npm run test:desktop
npm run test:ui
npm run dist:win
```

输出位于 `dist/`。CI 在 Windows 上执行代理测试、桌面测试、模拟模型响应的界面检查并构建安装包。

默认界面检查使用临时数据目录和固定测试凭据，不调用真实模型。显式的真实上游测试：设置环境变量 `CC_SMOKE_API_KEY` 后执行 `node desktop/smoke.mjs --live`；检查打包应用可追加 `--packaged`。不要将真实密钥写进提交或工作流。

命令行使用可复制 `config.example.json` 为 `config.json`，按需填写后执行 `npm start`。协议、Docker 等细节见 [上游中文文档](docs/upstream/README_zh.md) 或 [原项目](https://github.com/MAXeaglet/commandcode-proxy)。

## 工程结构

| 路径 | 职责 |
| --- | --- |
| `proxy.mjs` | 上游协议适配核心 |
| `desktop/main/` | Electron 主进程、代理子进程、配置和测速 |
| `desktop/renderer/` | 界面、模型选择、日志与中文错误提示 |
| `desktop/preload.cjs` | 受限 IPC 桥接 |
| `desktop/test/`、`test/` | 桌面及代理协议回归测试 |
| `desktop/smoke.mjs` | 隔离用户数据的界面检查 |
| `desktop/installer.nsh` | Windows 安装器定制 |

## 授权与贡献

采用 [MIT](LICENSE)，保留 `Copyright (c) 2026 MAXeaglet` 及 MIT 许可全文；桌面新增部分由 ssincxv 维护。许可允许修改、分发和商业使用，分发时仍须保留许可和版权声明，软件按原样提供，不附带担保。

完整来源、改动范围和素材说明见 [NOTICE.md](NOTICE.md)。欢迎提交桌面功能问题与 PR；发布日志时先移除密钥、个人路径及请求正文。
