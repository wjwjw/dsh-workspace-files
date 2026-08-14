# @deepseek-ai/dsh-host-workspace-files

English | [中文](README.zh.md)

Workspace file browsing Remote for the web GUI explorer. `WorkspaceFilesGateway` registers the `workspaceFiles` service and publishes six generated direct Remotes over the host filesystem seam (`ctx.fs`):

- `workspaceFiles/list` — one directory level with per-entry kind, byte size, and dot-hidden flag, directories first then files, each name-sorted; an absent path lists the host working directory.
- `workspaceFiles/read` — a bounded UTF-8 text preview (256 KiB head cap) of one regular file; larger files report `truncated` with byte length only, and binary or directory targets fail with a closed business code.
- `workspaceFiles/stat` — one path's kind and byte size without reading content.
- `workspaceFiles/write` — one full-file text write (create or replace) through `ctx.fs`. The mounted backend's sandbox fence still applies: under the default `workspace-write` policy the target must canonicalize under the workspace root (or a platform temp area). Published for a future in-dock editor; the current dock never calls it.
- `workspaceFiles/reveal` — show-in-folder on the host desktop (Explorer selection on Windows, Finder reveal on macOS, the parent directory on Linux).
- `workspaceFiles/open` — open with the Host's default application (Windows routes through PowerShell `Start-Process` so paths with spaces survive node's argv quoting).

`list`, `read`, and `stat` are deliberate read-only browsing primitives; `write` is the only mutation and is fenced like every other `ctx.fs` mutation. Failures map from `ctx.fs`'s closed `FsErrorCode` vocabulary to the typed `WorkspaceFilesFailure` union in `./types`, so the browser branches on business codes instead of messages. Typert generates the Host and Client Remote artifacts exposed by `./typert` and `./remote`.

The service is Remote-only and deliberately declares no same-process Cordis `Context` merge. Client packages consume it through the explicit `api-remotes` assembly rather than importing the Host implementation — see the [dsh-workspace-files README](../../../README.md) for how this package and the client plugin wire together.

## Model Experience

None, as this Host-only browsing projection registers no prompt, tool, message, or provider request.

#### KV Cache effect

None; this package never assembles model input.

## Known Limitations and Deferred Work

- **No mtime or platform-hidden metadata** — the `ctx.fs` seam reports kind and size only; the dot-prefix convention covers hidden rows on POSIX, and Windows hidden attributes stay listed.
- **Narrow mutation surface** — only full-file `write` (create/replace) exists; directory creation, rename, and deletion stay on the workspace seams, and the current dock never calls `write`.
- **Desktop verbs have no loopback check** — `open`/`reveal` spawn host commands for any connected client; the web GUI hides the row actions unless the page is loopback and the Host reports `canOpenPath`, but the Remote itself does not enforce that gate.
- **Truncated previews carry no head slice** — a file over the 256 KiB cap returns `truncated` with empty content rather than a partial decode; a streaming head read is deferred work.
