# 项目交接与恢复开发

这份交接以 **2026-09-30 发布的 v1.0.27** 为功能基线。仓库的 `main` 分支是后续开发的唯一源码基准；开始工作时先查看最新提交，勿将这里的版本号视为永久最新值。

- 源码仓库：[ssincxv/commandcode-proxy-desktop](https://github.com/ssincxv/commandcode-proxy-desktop)
- 已发布安装包：[Releases](https://github.com/ssincxv/commandcode-proxy-desktop/releases)
- 上游核心：[MAXeaglet/commandcode-proxy](https://github.com/MAXeaglet/commandcode-proxy)
- 详细模块与数据流：[技术架构](技术架构.md)
- 可复制到新对话的说明：[新对话开场白](新对话开场白.md)

## 项目定位与当前状态

这是基于上游 MIT 许可代理核心构建的 Windows x64 桌面程序。它将 Command Code API 转换为 OpenAI Chat Completions、OpenAI Responses 和 Anthropic Messages 兼容接口，供 OpenCode、沉浸式翻译及其他兼容客户端接入。它是**通用代理**，界面和测试文案不应局限于翻译。

v1.0.27 已包含图形界面、系统托盘、登录自启选项、NSIS 安装器、模型目录、模型并发测速、运行日志筛选和连接测试。安装版内含 Electron/Node 运行环境，普通用户安装时无需另装 Node.js。开发和重新打包仍需要 Node.js 与 npm。

当前没有必须先完成的代码迁移。上一个发布版本的源码与安装包均在 GitHub，发布时的 Windows CI 已通过。开始新的改动时，先检查仓库当前状态和最新 CI，而不是仅依赖这份交接的历史结论。

### 用户已经确定的产品行为

- 概览页只显示“代理已停止 / 代理已启用”等代理状态；代理服务启动与任何单一客户端的连接不能混为一谈。
- OpenCode 等填写 Base URL 的客户端默认使用 `http://127.0.0.1:3050/v1`；要求完整接口的客户端可使用 `http://127.0.0.1:3050/v1/chat/completions`。Base URL 后不要多加 `/chat/completions`。
- API Key 默认以圆点隐藏，可通过眼睛按钮显示；未配置时输入框为空。不要把密钥完整显示在日志、截图、文档或提交中。
- 界面采用浅色背景、石墨色圆角图标和白色圆角按钮。日志筛选的展开菜单是自定义白色面板，选中项为灰色，不使用系统原生蓝色高亮。
- 模型目录支持拖拽矩形多选（选框本身不可见）、拖动时滚轮滚动、Shift 多选、点击切换单项选中状态、空白处取消选择和右键复制模型 ID。测速最多并发 3 个请求，可停止。
- 日志框随窗口高度变化，内容在框内滚动；用户框选日志文字时，周期性刷新不应打断选择。

## 在新电脑恢复开发

建议使用 Windows x64。安装 Git、Node.js **22.12.0 或更高版本**及 npm，并预留足够空间给 Electron 依赖与安装包。源码由 GitHub 重新获取，无需旧电脑上的 `E:` 或 `C:` 项目目录。

```powershell
git clone https://github.com/ssincxv/commandcode-proxy-desktop.git
Set-Location commandcode-proxy-desktop
git status --short
git log -1 --oneline
node --version
npm --version
npm ci
```

`npm ci` 使用已提交的 `package-lock.json`。旧电脑曾为节省空间复用本地依赖，但这种目录连接**不是**项目构建要求。不要复制旧电脑的 `node_modules`、`dist` 或临时 QA 目录；它们都能重新生成。

在 PowerShell 中执行基本验证与开发启动：

```powershell
npm test
npm run test:desktop
npm run test:ui
npm run desktop
```

`npm run test:ui` 启动真实 Electron 窗口和本地代理进程，使用临时用户数据与模拟模型响应，不需要真实 CommandCode 密钥。它会暂时读写剪贴板并在退出时恢复。开发启动读取本机用户配置；首次使用时在界面里输入自己的 API Key。

需要真实上游联调时，在**当前终端会话**提供 `CC_SMOKE_API_KEY`，再运行 `node desktop/smoke.mjs --live`。该模式会发送真实请求、可能消耗额度；不要把密钥写进命令历史、仓库、CI 或对话。一般改界面不需要运行真实上游测试。

### 重新打包

```powershell
npm run dist:win -- --publish never
node desktop/smoke.mjs --packaged
```

输出为 `dist/CommandCode-Proxy-Setup-<package.json 版本>.exe`。安装器运行在 Windows x64，每用户安装，可选择安装目录。`desktop/installer.nsh` 定制完成页启动行为。程序**未进行商业代码签名**，新电脑可能显示“未知发布者”。

源码可通过 GitHub 的 Code → Download ZIP 获取，但要继续提交与发布，请使用 `git clone`。新电脑的 GitHub 推送权限需在当地配置；不要在公开文档或聊天里粘贴访问令牌。

## 发布下一版的可复现步骤

1. 从最新 `main` 开始，检查 `git status --short`，确认没有无关修改。明确本次变更、保持模块边界，并为实际行为增加必要的回归验证。
2. 同时更新 `package.json` 与 `package-lock.json` 的顶层版本；安装器文件名由版本自动生成。不要更改现有包名、`appId` 或用户数据目录映射，除非准备了迁移方案。
3. 运行 `npm test`、`npm run test:desktop`、`npm run test:ui`；构建后再运行 `node desktop/smoke.mjs --packaged`。涉及安装/卸载时，额外在干净 Windows 用户环境验证真实安装器；打包冒烟测试本身不执行安装向导。
4. 提交并推送代码，等待 `.github/workflows/ci.yml` 对该提交通过。CI 在 Windows 上执行 `npm ci`、两组 Node 测试、源码 UI 冒烟、安装包构建和打包 UI 冒烟，并上传有效期为 7 天的构建产物。
5. 为**已测试的同一提交**创建 `v<版本>` 标签和 GitHub Release，上传安装器与 `SHA256SUMS.txt`。发布前核对 Release 对应的提交、文件大小与 SHA-256。安装包不要提交到 Git 历史。

在 PowerShell 中生成校验文件的示例：

```powershell
$releaseVersion = node -p "require('./package.json').version"
$installerName = "CommandCode-Proxy-Setup-$releaseVersion.exe"
$installerHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path 'dist' $installerName)).Hash.ToLowerInvariant()
"$installerHash  $installerName" | Set-Content -LiteralPath 'dist/SHA256SUMS.txt' -Encoding ascii
```

仓库当前**不会由 CI 自动创建 GitHub Release**。旧电脑使用过 `desktop/qa/` 下的临时发布辅助脚本；该目录被 `.gitignore` 排除，新环境中不存在，不应把发布流程建立在它上面。可使用 GitHub Release 页面完成第 5 步，并对照本节逐项核验。

## 本机数据、清理与安全边界

GitHub 仓库包含源码、测试、图标和许可声明；不包含个人设置、API Key、`node_modules/`、`dist/`、临时日志及 `desktop/qa/`。删除旧电脑项目目录后，源码和安装器可重新下载，临时截图与临时辅助脚本则不会恢复。

桌面设置位于 `%APPDATA%\commandcode-proxy\config.json`，其中 API Key 为本机明文。旧版命令行项目根目录的 `config.json` 也可能含有个人密钥。这些文件均被排除在 GitHub 之外；如果新电脑需要原有设置，用户应通过私密渠道自行迁移，不能提交或公开发送。重新安装也可以直接在界面中重新填写。

卸载安装版会清理安装器管理的用户数据；只删除源码目录不会卸载已安装程序。不要把安装目录、源码目录和用户数据目录混为一谈。

### 常见故障的第一处检查

| 现象 | 先检查什么 |
| --- | --- |
| OpenCode 显示 `Not Found` | Base URL 是否写成 `/v1`；不要填完整的 `/v1/chat/completions`。 |
| 界面显示端口占用或代理无法启用 | 当前端口是否已被旧进程或其他服务占用；先确认进程归属再决定停止或换端口。 |
| `fetch failed`、连接失败 | 先看概览的代理状态和 `/health`；再区分本地代理、网络、上游密钥或模型错误。 |
| 测速很快但正文翻译仍慢 | 比较测速的正文首字等待、总耗时与客户端发出的真实请求；短测试结果不能直接代表长提示词、推理模型或客户端分段翻译的延迟。 |
| 安装完成后程序未立即出现 | 检查是否被防护软件扫描、是否已有单实例程序在托盘、是否存在启动错误；优先在干净用户环境复现。 |

日志可能含请求信息和本机路径，排查时只分享必要片段并先脱敏。已知的上游版本漂移提示在桌面运行时被抑制，出现协议问题仍要核对上游实现。

## 下一步怎么推进

没有用户确认的新功能需求时，先保持 v1.0.27 行为。收到新任务后按相关模块修改、执行对应测试、构建、检查实际界面，再发布。建议优先处理以下可验证的工程事项：

1. **验证新电脑安装链路。** CI 能构建并启动解包应用，但不运行完整 NSIS 安装向导。在干净 Windows 用户环境测试安装完成后启动、托盘、自启和卸载清理，并记录结果。
2. **跟踪模型拖选冒烟测试的偶发不稳定。** 历史上曾出现矩形拖选断言期望 14 项、实际 1 项，随后重跑通过。先在新环境重复运行并采集坐标/滚动位置；只有复现后再判断是产品行为还是测试时序问题。
3. **上游协议同步时做差异审查。** 桌面代理核心基于上游历史，桌面运行时抑制了版本漂移警告；这不代表兼容性已经验证。更新 `proxy.mjs` 前比较上游变更，补齐三种接口的流式与非流式回归测试，再升级发布。
4. **把确实需要长期保留的发布/视觉辅助检查纳入版本控制。** `desktop/qa/` 当前被忽略；如果未来要让新机器复现这些临时检查，应移入受跟踪的脚本目录并纳入 CI，避免依赖旧电脑。

如需开始具体修改，先阅读[技术架构](技术架构.md)，再将[新对话开场白](新对话开场白.md)与本次需求一同发送给新对话。
