# dsh-workspace-files

Workspace file explorer plugin for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web GUI (DSH Web). A right-docked panel adds a lazy **workspace file tree** with a bounded text preview on top, and the list of **files the current conversation modified** below it.

[中文说明](README.zh.md)

> This repository holds the two packages that make up the workspace-files plugin for the DeepSeek Harness web GUI: the browser-half client plugin and the host-side Remote service. It exists so the plugin can be reviewed, archived, and distributed independently; building and testing still happens inside the deepseek-harness workspace (see [Build & test](#build--test)).

## Features

- **Right-docked panel** with a floating toggle tab; resizable width, draggable upper/lower split, and transient geometry state (reload restores the dock closed).
- **Lazy file tree** rooted at the host working directory: one `list` call per expanded level, directories first then files with byte sizes, dot-hidden rows gated by a **Show hidden** toggle, a loaded-list filter, and a refresh action.
- **Bounded text preview** (256 KiB head) for one file, with truncation / binary / failure notices; **Open in system** and **Open containing folder** desktop verbs through the host Remote.
- **Modified-files list**: derives, from the current conversation snapshot, every file the `write`/`edit` tools touched — recognized by the tool-call `file_path` argument, never the closing prose. Rows carry **New / Edited** badges (from the write result's diff metadata), settlement state (running / ok / failed), a one-click **Archive** point, and per-row actions.
- **Row actions menu** (always-visible ellipsis): Open in system · Open containing folder · Add file name to the conversation input.
- **Window retention**: modified files whose events scroll out of the conversation window (truncation, reconnect window replacement) stay listed until the session switches.
- Bilingual UI copy (Simplified Chinese / English) via the locale namespace.

## Architecture

The plugin is two packages working over the DSH Remote (Typert) seam:

| Package | Role |
| --- | --- |
| [`packages/client/ui-workspace-files`](packages/client/ui-workspace-files) — `@deepseek-ai/dsh-client-ui-workspace-files` | Browser half. Registers one entry into the layout-owned `shell.overlay` list slot, owns all policy (tree listing flow, modified-file derivation source, desktop-open and composer-insert verbs, copy), and renders the dock. |
| [`packages/host/workspace-files`](packages/host/workspace-files) — `@deepseek-ai/dsh-host-workspace-files` | Host half. `WorkspaceFilesGateway` registers the `workspaceFiles` service over the host filesystem seam (`ctx.fs`) with six Remotes: read-only `list`, `read` (256 KiB preview) and `stat`; a sandbox-fenced `write` (create/replace under the workspace policy, not wired into the dock); and the desktop verbs `reveal` (show-in-folder) and `open` (default-application open). |

The two halves never share an implementation: the client consumes the Typert-generated Remote client, the host publishes the Typert-generated Remote server, and failures cross the seam as the closed `WorkspaceFilesFailure` vocabulary in `packages/host/workspace-files/src/types.ts`.

```
packages/
├── host/workspace-files/        # Host Remote service (src, tests, types, README)
└── client/ui-workspace-files/   # Browser plugin (src, tests, README)
```

## Integration into DSH Web

The plugin is wired into the web app bundle as part of the deepseek-harness monorepo:

1. **References** — add both packages to `tsconfig.client.json` / `tsconfig.host.json`.
2. **Remote mount** — `packages/api/remotes` gains the `workspaceFilesRemote` client mount and `packages/api/remotes/package.json` the host package dependency.
3. **Bundle roster** — `packages/bundle/web-app/cordis.patch.yml` lists the host row `workspace-files` and the client row `ui-workspace-files`; the client row injects `slots, locale, connection, sessions, conversation, remote, remote.workspaceFiles`.

Inside the monorepo the packages build with `workspace:*` peer resolution; this repository keeps those manifests untouched so a copy dropped back into `packages/` builds as-is.

## Build & test

Run inside the deepseek-harness workspace (this repository contains sources only — no workspace config):

```bash
pnpm install            # after adding workspace deps
pnpm build:lib:host     # host (tsc + tsdown + Typert artifacts)
pnpm build:lib:client   # client (full tsc type check + browser bundle)
pnpm vitest run packages/host/workspace-files packages/client/ui-workspace-files
```

Test suites: **50 passing** — host 10 (gateway 9 + invariant 1) and client 40 (modified-files derivation 17, source retention 5, apply 5, dock 12, invariant 1). The dock specs are jsdom component tests; CSS layout is asserted through data attributes since jsdom applies no styles.

## Known limitations

- **No mutation surface in the dock** — the explorer lists and previews only; the client never calls the host's sandbox-fenced `write` Remote (kept for a future in-dock editor), and directory creation, rename, and delete stay on the workspace seams.
- **Desktop verbs rely on the client gate** — the dock only shows `Open in system` / `Open containing folder` while the page is loopback and the Host reports `canOpenPath`, but the `open`/`reveal` Remotes themselves enforce no loopback check, so any connected client can invoke them on sandbox-visible paths.
- **Relative paths resolve client-side** — best-effort join against the session cwd; symlinks and `..` segments stay unnormalized.
- **Retention is per-session in-memory** — the modified-file table survives window truncation but is rebuilt on reload (no durable per-session index yet).
- **Filter covers loaded listings only** — directories never expanded contribute no matches.
- **No mtime column** — the `ctx.fs` seam reports kind and size only.

## License

[MIT](LICENSE) — the same license the packages carry inside deepseek-harness.
