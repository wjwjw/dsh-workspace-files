# @deepseek-ai/dsh-host-workspace-files

[English](README.md) | 中文

面向 Web GUI 文件浏览器的工作区文件浏览 Remote。`WorkspaceFilesGateway` 注册 `workspaceFiles` 服务，并通过宿主文件系统接缝（`ctx.fs`）发布六个 Typert 生成的直接 Remote：

- `workspaceFiles/list` —— 单层目录条目，含类型、字节大小与点号隐藏标记；目录在前、文件在后，各自按名称排序；不传路径时列出宿主工作目录。
- `workspaceFiles/read` —— 单个普通文件的受限 UTF-8 文本预览（256 KiB 头部上限）；更大的文件以 `truncated` 报告且只带字节长度，二进制或目录目标返回封闭的业务错误码。
- `workspaceFiles/stat` —— 单个路径的类型与字节大小，不读取内容。
- `workspaceFiles/write` —— 通过 `ctx.fs` 提交一次全文件文本写入（新增或覆盖）。挂载后端的沙箱围栏仍然生效：默认 `workspace-write` 策略下目标必须规范化到工作区根目录（或平台临时区）内。为未来的面板内编辑器而发布；当前面板从不调用它。
- `workspaceFiles/reveal` —— 在宿主机桌面显示所在文件夹（Windows 资源管理器选中、macOS Finder 显示、Linux 打开父目录）。
- `workspaceFiles/open` —— 用宿主默认应用打开（Windows 经 PowerShell `Start-Process` 路由，含空格的路径可穿过 node 的 argv 引号规则完整送达）。

`list`、`read` 与 `stat` 是刻意只读的浏览原语；`write` 是唯一的修改操作，与其它 `ctx.fs` 修改一样受围栏约束。失败从 `ctx.fs` 的封闭 `FsErrorCode` 词表映射到 `./types` 中类型化的 `WorkspaceFilesFailure` 联合，浏览器据此按业务码分支而不是解析消息文本。Typert 生成由 `./typert` 与 `./remote` 导出的 Host 与 Client Remote 产物。

该服务仅供 Remote 使用，刻意不声明同进程 Cordis `Context` merge。Client 包通过显式的 `api-remotes` 组合消费它，而不导入 Host 实现——两包的接线方式见仓库级 [dsh-workspace-files 说明](../../../README.md)。

## 模型体验

无，因为这个仅限 Host 的浏览投影不注册提示词、工具、消息或提供方请求。

#### KV Cache 影响

无；本包从不组装模型输入。

## 已知限制与暂缓事项

- **没有 mtime 或平台隐藏属性** —— `ctx.fs` 接缝只报告类型与大小；POSIX 上以点号前缀约定覆盖隐藏行，Windows 隐藏属性仍会列出。
- **修改能力很窄** —— 只有全文件 `write`（新增/覆盖）；创建目录、重命名与删除仍走 workspace 接缝，且当前面板从不调用 `write`。
- **桌面动词没有 loopback 校验** —— `open`/`reveal` 会为任何已连接客户端在宿主上启动命令；Web GUI 只在页面处于 loopback 且宿主握手报告 `canOpenPath` 时隐藏行操作，但 Remote 本身不执行这一门控。
- **截断预览不带头部切片** —— 超过 256 KiB 上限的文件返回 `truncated` 且内容为空，而不是部分解码；流式头部读取留待后续。
