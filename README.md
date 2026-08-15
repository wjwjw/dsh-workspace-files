# dsh-workspace-files

Workspace file explorer plugin for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web GUI (DSH Web). A right-docked panel adds a lazy **workspace file tree** with a bounded text preview on top, and the list of **files the current conversation modified** below it.

[中文说明](README.zh.md)

> This repository holds the three packages that make up the workspace-files plugin for the DeepSeek Harness web GUI: the browser-half client plugin, the host-side Remote service, and an installable dsh bundle tying them together. It exists so the plugin can be reviewed, archived, and distributed independently; building and testing still happens inside the deepseek-harness workspace (see [Build & test](#build--test)).

## Features

- **Right-docked panel** with a floating toggle tab; resizable width, draggable upper/lower split, and transient geometry state (reload restores the dock closed).
- **Lazy file tree** rooted at the host working directory: one `list` call per expanded level, directories first then files with byte sizes, dot-hidden rows gated by a **Show hidden** toggle, a loaded-list filter, and a refresh action.
- **Bounded text preview** (256 KiB head) for one file, with truncation / binary / failure notices; **Open in system** and **Open containing folder** desktop verbs through the host Remote.
- **Modified-files list**: derives, from the current conversation snapshot, every file the `write`/`edit` tools touched — recognized by the tool-call `file_path` argument, never the closing prose. Rows carry **New / Edited** badges (from the write result's diff metadata), settlement state (running / ok / failed), a one-click **Archive** point, and per-row actions.
- **Row actions menu** (always-visible ellipsis): Open in system · Open containing folder · Add file name to the conversation input.
- **Window retention**: modified files whose events scroll out of the conversation window (truncation, reconnect window replacement) stay listed until the session switches.
- Bilingual UI copy (Simplified Chinese / English) via the locale namespace.

## Architecture

The plugin is two runtime packages working over the DSH Remote (Typert) seam (plus an installable bundle that mounts them together):

| Package | Role |
| --- | --- |
| [`packages/client/ui-workspace-files`](packages/client/ui-workspace-files) — `@deepseek-ai/dsh-client-ui-workspace-files` | Browser half. Registers one entry into the layout-owned `shell.overlay` list slot, owns all policy (tree listing flow, modified-file derivation source, desktop-open and composer-insert verbs, copy), and renders the dock. |
| [`packages/host/workspace-files`](packages/host/workspace-files) — `@deepseek-ai/dsh-host-workspace-files` | Host half. `WorkspaceFilesGateway` registers the `workspaceFiles` service over the host filesystem seam (`ctx.fs`) with six Remotes: read-only `list`, `read` (256 KiB preview) and `stat`; a sandbox-fenced `write` (create/replace under the workspace policy, not wired into the dock); and the desktop verbs `reveal` (show-in-folder) and `open` (default-application open). |

The two halves never share an implementation: the client consumes the Typert-generated Remote client, the host publishes the Typert-generated Remote server, and failures cross the seam as the closed `WorkspaceFilesFailure` vocabulary in `packages/host/workspace-files/src/types.ts`.

```
packages/
├── host/workspace-files/          # Host Remote service (src, tests, types, README)
├── client/ui-workspace-files/     # Browser plugin (src, tests, README)
└── bundle/workspace-files/        # Installable dsh bundle (cordis.patch.yml + deps on the two)
```

## Integration into DSH Web

The plugin integrates in either of two shapes:

1. **Standalone bundle (recommended, third-party open-box install)** — this repository's `packages/bundle/workspace-files` is a package that declares `dsh.bundle.patch`: its own `cordis.patch.yml` lists the host row `workspace-files` and the client row `ui-workspace-files`, and depends on the other two packages. Any dsh only needs `dsh plugin --profile <name> add @deepseek-ai/dsh-bundle-workspace-files`; pnpm installs the bundle and, because it declares `dsh.bundle`, automatically activates it as a profile layer — no harness source changes.
2. **Merge into the monorepo** — copy the three packages into `packages/`, add references to `tsconfig.client.json` / `tsconfig.host.json`, and add `packages/bundle/workspace-files` as a dependency of `packages/bundle/web-app` (if the harness already hardcodes those two rows, remove them from `web-app/cordis.patch.yml` and `api/remotes` first to avoid duplicate registration).

**The Remote is self-mounted**: the browser-half `ui-workspace-files` `apply()` mounts `workspaceFilesRemote` directly onto the shared `ctx.remote` service (so `packages/api/remotes` no longer hardcodes it) — the plugin carries its own Remote and works without the harness Remote roster. Dependencies on harness core packages (e.g. `@deepseek-ai/dsh-fs`, `dsh-invariants`, `dsh-client-*`, `dsh-api-remotes`, `dsh-typert-protocol`, `cordis`) are pinned to the versions those packages are **actually published at** on npm — they are released independently, not as one version: `@deepseek-ai/cordis` is `4.0.1`, `@deepseek-ai/dsh-typert-protocol` is `0.1.0-rc.6`, the rest are `0.0.1-rc.1`. Only the dependencies between the three plugin packages keep `workspace:^`, which `pnpm publish` rewrites to the plugin's own version. Built `lib/` artifacts are committed alongside the sources (they are generated by harness's Typert toolchain, so a source edit inside this repository requires rebuilding inside deepseek-harness and copying the refreshed `lib/` directories back — see [Build & test](#build--test)).

## Install

### Third-party open-box install (recommended)

The plugin publishes as `@deepseek-ai/dsh-bundle-workspace-files`. On a machine with dsh installed:

```bash
dsh plugin --profile web add @deepseek-ai/dsh-bundle-workspace-files
```

This forwards pnpm to install the bundle under `$DSH_HOME/profiles/web` and, because it declares `dsh.bundle`, automatically registers it as a profile layer; reload dsh to see the right-docked "Workspace files" panel.

> Note: if your dsh is built from deepseek-harness source and `web-app/cordis.patch.yml` already hardcodes the `workspace-files` / `ui-workspace-files` rows, installing the bundle duplicates those plugin ids. Either install into a profile that does **not** contain those rows (e.g. a custom profile), or remove the two rows and `workspaceFilesRemote` from `api/remotes` on the harness side (see "Merge into the monorepo") before installing the bundle.

### Merge from source (developer)

Copy this repository's `packages/` into `deepseek-harness/packages/`, wire as described in "Integration into DSH Web", then build:

```bash
pnpm install
pnpm build:lib:host
pnpm build:lib:client
```

## Build & test

Run inside the deepseek-harness workspace (this repository is now a pnpm workspace, but the three packages' lib/ is built by harness's tsdown):

```bash
pnpm install            # after adding workspace deps
pnpm build:lib:host     # host (tsc + tsdown + Typert artifacts)
pnpm build:lib:client   # client (full tsc type check + browser bundle)
pnpm vitest run packages/host/workspace-files packages/client/ui-workspace-files
```

Test suites: **52 passing** — host 10 (gateway 9 + invariant 1) and client 42 (modified-files derivation 19, source retention 5, apply 5, dock 12, invariant 1). The dock specs are jsdom component tests; CSS layout is asserted through data attributes since jsdom applies no styles.

## Known limitations

- **No mutation surface in the dock** — the explorer lists and previews only; the client never calls the host's sandbox-fenced `write` Remote (kept for a future in-dock editor), and directory creation, rename, and delete stay on the workspace seams.
- **Desktop verbs rely on the client gate** — the dock only shows `Open in system` / `Open containing folder` while the page is loopback and the Host reports `canOpenPath`, but the `open`/`reveal` Remotes themselves enforce no loopback check, so any connected client can invoke them on sandbox-visible paths.
- **Relative paths resolve client-side** — best-effort join against the session cwd; symlinks and `..` segments stay unnormalized.
- **Retention is per-session in-memory** — the modified-file table survives window truncation but is rebuilt on reload (no durable per-session index yet).
- **Filter covers loaded listings only** — directories never expanded contribute no matches.
- **No mtime column** — the `ctx.fs` seam reports kind and size only.

## License

[MIT](LICENSE) — the same license the packages carry inside deepseek-harness.
