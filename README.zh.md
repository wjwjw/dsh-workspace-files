# dsh-workspace-files

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web GUI（DSH Web）的工作区文件插件。右侧停靠面板：上半部分是**惰性工作区文件树**（带受限文本预览），下半部分是**当前对话修改过的文件列表**。

[English](README.md)

> 本仓库包含构成本插件的两个包（deepseek-harness monorepo 内的浏览器端插件与宿主侧 Remote 服务），便于独立审查、归档与分发；构建与测试仍需在 deepseek-harness 工作区内进行（见 [构建与测试](#构建与测试)）。

## 功能特性

- **右侧停靠面板**：浮动标签页开关；宽度可拖拽调整、上下区域分隔条可拖动；面板几何为瞬态状态（刷新后恢复关闭）。
- **惰性文件树**：以宿主工作目录为根，每展开一层目录发一次 `list` 调用；目录在前、文件在后，各按名称排序并显示字节大小；"显示隐藏文件"开关控制点号隐藏行；支持已加载条目的筛选与刷新。
- **受限文本预览**（256 KiB 头部）：截断 / 二进制 / 读取失败均渲染为提示；通过宿主 Remote 提供"在系统中打开""打开所在文件夹"等桌面操作。
- **对话修改的文件列表**：从当前会话快照派生 `write`/`edit` 工具调用触碰过的每个文件——按工具调用的 `file_path` 参数识别，绝不依赖模型结束语。行内带**新增/编辑**徽标（依据 write 结果的 diff 元数据）、落定状态（运行中 / 成功 / 失败）、一键**存档**点与行操作。
- **行操作菜单**（始终可见的 ⋯）：在系统中打开 · 打开所在文件夹 · 把文件名加入对话输入框。
- **跨窗口保留**：修改文件的事件即使被会话窗口截断（滚动出窗 / 重连替换窗口），条目仍保留在列表中，直到切换会话。
- 中英双语界面文案（通过 locale 命名空间）。

## 架构

插件由两个包组成，通过 DSH 的 Remote（Typert）接缝协作：

| 包 | 职责 |
| --- | --- |
| [`packages/client/ui-workspace-files`](packages/client/ui-workspace-files) — `@deepseek-ai/dsh-client-ui-workspace-files` | 浏览器端。向 layout 拥有的 `shell.overlay` 列表槽注册一个条目；所有策略（树列表流程、修改文件派生源、桌面打开与插入输入框动词、文案）都在这一半。 |
| [`packages/host/workspace-files`](packages/host/workspace-files) — `@deepseek-ai/dsh-host-workspace-files` | 宿主端。`WorkspaceFilesGateway` 在宿主文件系统接缝（`ctx.fs`）上注册 `workspaceFiles` 服务，提供六个 Remote：只读的 `list`、`read`（256 KiB 预览）与 `stat`；受沙箱围栏约束的 `write`（新增/覆盖，遵循 workspace 策略，未接入面板）；以及桌面动词 `reveal`（在文件夹中显示）与 `open`（默认应用打开）。 |

两端互不共享实现：客户端消费 Typert 生成的 Remote 客户端，宿主发布 Typert 生成的 Remote 服务端，失败以 `packages/host/workspace-files/src/types.ts` 中的封闭 `WorkspaceFilesFailure` 词表跨接缝传递。

```
packages/
├── host/workspace-files/        # 宿主 Remote 服务（src、tests、types、README）
└── client/ui-workspace-files/   # 浏览器插件（src、tests、README）
```

## 接入 DSH Web

插件作为 deepseek-harness monorepo 的一部分接入 web-app bundle：

1. **引用**——在 `tsconfig.client.json` / `tsconfig.host.json` 中新增两个包的 references。
2. **Remote 挂载**——`packages/api/remotes` 增加 `workspaceFilesRemote` 客户端挂载，并在 `packages/api/remotes/package.json` 增加对宿主包的依赖。
3. **Bundle 名册**——`packages/bundle/web-app/cordis.patch.yml` 增加宿主行 `workspace-files` 与客户端行 `ui-workspace-files`；客户端行 inject `slots, locale, connection, sessions, conversation, remote, remote.workspaceFiles`。

monorepo 内两个包以 `workspace:*` 解析 peer 依赖；本仓库保持清单不变，拷回 `packages/` 即可原样构建。

## 构建与测试

在 deepseek-harness 工作区内执行（本仓库仅含源码，无工作区配置）：

```bash
pnpm install            # 新增 workspace 依赖后
pnpm build:lib:host     # 宿主（tsc + tsdown + Typert 产物）
pnpm build:lib:client   # 客户端（全量 tsc 类型检查 + 浏览器 bundle）
pnpm vitest run packages/host/workspace-files packages/client/ui-workspace-files
```

测试：**50 项全部通过**——宿主 10（gateway 9 + invariant 1），客户端 40（修改文件派生 17、源保留 5、apply 5、dock 12、invariant 1）。dock 测例为 jsdom 组件测试；由于 jsdom 不应用 CSS，可见性断言均基于 data 属性。

## 已知限制

- **面板内没有修改能力**——浏览器只列出与预览；客户端从不调用宿主受沙箱围栏约束的 `write` Remote（留给未来的面板内编辑器），创建目录、重命名与删除仍走 workspace 接缝。
- **桌面动词依赖客户端门控**——面板只在页面处于 loopback 且宿主握手报告 `canOpenPath` 时显示"在系统中打开"/"打开所在文件夹"，但 `open`/`reveal` Remote 本身不做 loopback 校验，任何已连接客户端都能对沙箱可见路径调用它们。
- **相对路径是客户端最佳努力解析**——按会话 cwd 简单拼接；符号链接与 `..` 段不做规范化。
- **保留是会话内存级的**——修改文件表可跨窗口截断保留，但刷新后重建（尚无跨刷新持久化的按会话索引）。
- **筛选只覆盖已加载列表**——未展开的目录不会贡献匹配项。
- **没有 mtime 列**——`ctx.fs` 接缝只报告类型与大小。

## 许可证

[MIT](LICENSE)——与 deepseek-harness 内两个包携带的许可证一致。
