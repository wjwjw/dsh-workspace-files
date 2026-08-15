# dsh-workspace-files

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web GUI（DSH Web）的工作区文件插件。右侧停靠面板：上半部分是**惰性工作区文件树**（带受限文本预览），下半部分是**当前对话修改过的文件列表**。

[English](README.md)

> 本仓库包含构成本插件的三个包——宿主侧 Remote 服务、浏览器端插件，以及一个把它们组合起来的可独立安装的 profile bundle——便于独立审查、归档与分发。仓库根为 pnpm 工作区（`package.json` + `pnpm-workspace.yaml`），三个包可一并 `pnpm publish -r` 发布或本地安装测试；但编译出 `lib/` 仍需在 deepseek-harness 工作区内进行（见 [构建与测试](#构建与测试)）。

## 功能特性

- **右侧停靠面板**：浮动标签页开关；宽度可拖拽调整、上下区域分隔条可拖动；面板几何为瞬态状态（刷新后恢复关闭）。
- **惰性文件树**：以宿主工作目录为根，每展开一层目录发一次 `list` 调用；目录在前、文件在后，各按名称排序并显示字节大小；"显示隐藏文件"开关控制点号隐藏行；支持已加载条目的筛选与刷新。
- **受限文本预览**（256 KiB 头部）：截断 / 二进制 / 读取失败均渲染为提示；通过宿主 Remote 提供"在系统中打开""打开所在文件夹"等桌面操作。
- **对话修改的文件列表**：从当前会话快照派生 `write`/`edit` 工具调用触碰过的每个文件——按工具调用的 `file_path` 参数识别，绝不依赖模型结束语。行内带**新增/编辑**徽标（依据 write 结果的 diff 元数据）、落定状态（运行中 / 成功 / 失败）、一键**存档**点与行操作。
- **行操作菜单**（始终可见的 ⋯）：在系统中打开 · 打开所在文件夹 · 把文件名加入对话输入框。
- **跨窗口保留**：修改文件的事件即使被会话窗口截断（滚动出窗 / 重连替换窗口），条目仍保留在列表中，直到切换会话。
- 中英双语界面文案（通过 locale 命名空间）。

## 架构

插件由两个运行时包组成，通过 DSH 的 Remote（Typert）接缝协作（外加一个把它们组合安装的 bundle）：

| 包 | 职责 |
| --- | --- |
| [`packages/client/ui-workspace-files`](packages/client/ui-workspace-files) — `@deepseek-ai/dsh-client-ui-workspace-files` | 浏览器端。向 layout 拥有的 `shell.overlay` 列表槽注册一个条目；所有策略（树列表流程、修改文件派生源、桌面打开与插入输入框动词、文案）都在这一半。 |
| [`packages/host/workspace-files`](packages/host/workspace-files) — `@deepseek-ai/dsh-host-workspace-files` | 宿主端。`WorkspaceFilesGateway` 在宿主文件系统接缝（`ctx.fs`）上注册 `workspaceFiles` 服务，提供六个 Remote：只读的 `list`、`read`（256 KiB 预览）与 `stat`；受沙箱围栏约束的 `write`（新增/覆盖，遵循 workspace 策略，未接入面板）；以及桌面动词 `reveal`（在文件夹中显示）与 `open`（默认应用打开）。 |

两端互不共享实现：客户端消费 Typert 生成的 Remote 客户端，宿主发布 Typert 生成的 Remote 服务端，失败以 `packages/host/workspace-files/src/types.ts` 中的封闭 `WorkspaceFilesFailure` 词表跨接缝传递。

```
packages/
├── host/workspace-files/          # 宿主 Remote 服务(src、tests、types、README)
├── client/ui-workspace-files/     # 浏览器插件(src、tests、README)
└── bundle/workspace-files/        # 可独立安装的 dsh bundle(cordis.patch.yml + 对前两包的依赖)
```

## 接入 DSH Web

插件以两种形态接入，二者选一：

1. **独立 bundle（推荐，第三方开箱即装）**——本仓库的 `packages/bundle/workspace-files` 是一个声明了 `dsh.bundle.patch` 的包，它在自己的 `cordis.patch.yml` 里登记宿主行 `workspace-files` 与客户端行 `ui-workspace-files`，并依赖另外两个包。任何 dsh 只需 `dsh plugin --profile <name> add @deepseek-ai/dsh-bundle-workspace-files`，pnpm 装包后便自动激活该 bundle，无需改动 harness 源码。
2. **合并进 monorepo**——把三个包拷进 `packages/` 的对应位置，在 `tsconfig.client.json` / `tsconfig.host.json` 增加 references，并把 `packages/bundle/workspace-files` 加为 `packages/bundle/web-app` 的依赖（若 harness 已硬编码这两行，需先从 `web-app/cordis.patch.yml` 与 `api/remotes` 移除，避免重复注册）。

**Remote 由插件自挂载**：浏览器端 `ui-workspace-files` 的 `apply()` 直接把 `workspaceFilesRemote` 挂到共享的 `ctx.remote` 服务上（`packages/api/remotes` 不再硬编码它），所以插件自带 Remote，可脱离 harness 的远端名册独立工作。对 harness 核心包（如 `@deepseek-ai/dsh-fs`、`dsh-invariants`、`dsh-client-*`、`dsh-api-remotes`、`dsh-typert-protocol`、`cordis` 等）的依赖已钉到它们在公共 npm 上**实际发布的版本**——这些包各自独立发布、并非统一版本：`@deepseek-ai/cordis` 为 `4.0.1`、`@deepseek-ai/dsh-typert-protocol` 为 `0.1.0-rc.6`，其余为 `0.0.1-rc.1`。只有三个插件包之间的依赖保留 `workspace:^`，在 `pnpm publish` 时自动改写成插件自身版本。已构建的 `lib/` 产物与源码一同入库（它们由 harness 的 Typert 工具链生成，因此在本仓库内改源码后，需先在 deepseek-harness 内重新构建，再把刷新后的 `lib/` 目录拷回——见 [构建与测试](#构建与测试)）。

## 安装

### 第三方开箱即装（推荐）

插件以 `@deepseek-ai/dsh-bundle-workspace-files` 形式发布。在已装好 dsh 的机器上：

```bash
dsh plugin --profile web add @deepseek-ai/dsh-bundle-workspace-files
```

该命令会在 `$DSH_HOME/profiles/web` 里转发 pnpm 安装此 bundle，并因它声明了 `dsh.bundle` 而自动把它登记为 profile 的一层；重载 dsh 后即可看到右侧"工作区文件"面板。

> 注意：若你的 dsh 是从 deepseek-harness 源码构建、且 `web-app/cordis.patch.yml` 已硬编码了 `workspace-files` / `ui-workspace-files` 两行，直接安装会与 bundle 重复注册同名插件。两种处理：① 把面板装进一个**不含**这两行的 profile（如自定义 profile）；② 在 harness 侧移除这两行及 `api/remotes` 里的 `workspaceFilesRemote`（见上文"合并进 monorepo"），再安装 bundle。

### 从源码合并（开发者）

把本仓库的 `packages/` 整体拷进 `deepseek-harness/packages/`，按上文"接入 DSH Web"接线后构建：

```bash
pnpm install
pnpm build:lib:host
pnpm build:lib:client
```

## 构建与测试

在 deepseek-harness 工作区内执行（本仓库虽为 pnpm 工作区，但三个包的 `lib/` 由 harness 的 tsdown 统一构建）：

```bash
pnpm install            # 新增 workspace 依赖后
pnpm build:lib:host     # 宿主（tsc + tsdown + Typert 产物）
pnpm build:lib:client   # 客户端（全量 tsc 类型检查 + 浏览器 bundle）
pnpm vitest run packages/host/workspace-files packages/client/ui-workspace-files
```

测试：**52 项全部通过**——宿主 10（gateway 9 + invariant 1），客户端 42（修改文件派生 19、源保留 5、apply 5、dock 12、invariant 1）。dock 测例为 jsdom 组件测试；由于 jsdom 不应用 CSS，可见性断言均基于 data 属性。

## 已知限制

- **面板内没有修改能力**——浏览器只列出与预览；客户端从不调用宿主受沙箱围栏约束的 `write` Remote（留给未来的面板内编辑器），创建目录、重命名与删除仍走 workspace 接缝。
- **桌面动词依赖客户端门控**——面板只在页面处于 loopback 且宿主握手报告 `canOpenPath` 时显示"在系统中打开"/"打开所在文件夹"，但 `open`/`reveal` Remote 本身不做 loopback 校验，任何已连接客户端都能对沙箱可见路径调用它们。
- **相对路径是客户端最佳努力解析**——按会话 cwd 简单拼接；符号链接与 `..` 段不做规范化。
- **保留是会话内存级的**——修改文件表可跨窗口截断保留，但刷新后重建（尚无跨刷新持久化的按会话索引）。
- **筛选只覆盖已加载列表**——未展开的目录不会贡献匹配项。
- **没有 mtime 列**——`ctx.fs` 接缝只报告类型与大小。

## 许可证

[MIT](LICENSE)——与 deepseek-harness 内两个包携带的许可证一致。
