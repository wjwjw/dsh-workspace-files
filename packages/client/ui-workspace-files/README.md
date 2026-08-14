# @deepseek-ai/dsh-client-ui-workspace-files

English | [中文](README.zh.md)

Workspace file explorer docked on the right edge of the web GUI. The browser half registers one entry into the layout-owned `shell.overlay` list slot: a floating tab opens a resizable panel holding a lazy file tree (with a bounded text preview) above a draggable divider and the modified-files list below. The node half is an empty loader row.

The tree roots at the Host working directory (`host.describe`'s `cwd`) and lists one directory level per expansion through the [`workspace-files` Remote](../../host/workspace-files/README.md): directories first, then files, each name-sorted, with byte sizes and dot-hidden rows gated by the **Show hidden** toggle. Loaded listings are the tree's own component state, so reopening the panel never refetches. A non-blank filter swaps the tree for a flat list of matching loaded entries. Clicking a file opens its bounded 256 KiB UTF-8 preview (truncation, binary, and business failures render as notices), and the **Open in system** action hands the path to the Host's native opener while the page is loopback and the Host reports `canOpenPath` — the same gate the produced-files row uses.

The modified-files list is a registrant-private Reactive derivation over the current session's conversation snapshot (a pure function republished through the inject `hooks` compartment): `write` and `edit` calls are recognized by their `file_path` argument — never the closing prose — relative targets resolve against the session cwd, per-call settlement tracks running/failed states, and a file written then edited stays one row. Clicking a row expands its ancestor directories in the tree and opens the preview (reveal). With no session selected the list shows the open-a-session empty copy.

Panel geometry (open state, width, split ratio, hidden toggle, expansion, selection, preview, filter) is a transient declared store — reload restores the dock closed, matching the layout shell's transient-geometry posture.

## Model Experience

None, as the explorer is browser chrome; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Retention across window changes** — the source keeps a call-keyed table for the current session, so a file whose events leave the conversation window under truncation or reconnect stays listed; the table resets on session switch. A durable per-session index (surviving reload) is still deferred work.
- **Relative paths resolve client-side** — a best-effort join against the session cwd; symlinks and `..` segments stay unnormalized, so a reveal may miss a path the Host would resolve differently.
- **No mutation surface in the dock** — the explorer lists and previews only and never calls the host's sandbox-fenced `write` Remote (kept for a future in-dock editor); directory creation, rename, and delete stay on the workspace seams.
- **Filter covers loaded listings only** — directories never expanded contribute no matches; a host-side search is deferred work.
- **No mtime column** — the `ctx.fs` seam reports kind and size only.
