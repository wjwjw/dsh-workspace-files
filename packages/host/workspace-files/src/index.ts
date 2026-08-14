/**
 * Workspace file browsing Remote: read-only one-level listings with metadata,
 * bounded text previews, and stat probes over `ctx.fs`. The web GUI's file
 * explorer consumes this namespace; every method is deliberately read-only so
 * the surface can never mutate the host filesystem (creation goes through the
 * workspace `createDirectory` seam when a future explorer needs it).
 * @module @deepseek-ai/dsh-host-workspace-files
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-fs'
import { FsError } from '@deepseek-ai/dsh-fs'
import type { FsDirEntry } from '@deepseek-ai/dsh-fs'
import { dirname } from 'node:path'
import { runNativeCommand } from '@deepseek-ai/dsh-native-command'
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol'
// Typert-generated ./typert and ./remote artifacts import Zod at runtime.
import type {} from 'zod'
import type {
  WorkspaceFileEntry,
  WorkspaceFileListResult,
  WorkspaceFileOpenResult,
  WorkspaceFileRead,
  WorkspaceFileReadResult,
  WorkspaceFileRevealResult,
  WorkspaceFileStat,
  WorkspaceFileStatResult,
  WorkspaceFileWriteResult,
  WorkspaceFilesFailure,
  WorkspaceFilesRejected,
  WorkspaceFilesSuccess,
} from './types.ts'

export type * from './types.ts'

/**
 * The platform "show in folder" command for one path: Windows selects the
 * path in Explorer, macOS reveals it in Finder, and Linux opens the parent
 * directory. Pure so tests pin the exact argv without spawning anything.
 * Windows wraps Explorer in PowerShell because node's execFile waits for the
 * child and the GUI explorer stub exits non-zero after handing off to the
 * shell; PowerShell launches GUI apps without waiting and returns 0.
 * Explorer needs `/select,<path>` as ONE argument, so the whole argument is
 * single-quoted: unquoted, PowerShell would parse the comma as array syntax
 * and deliver `/select` and the path as two separate arguments. Single quotes
 * keep `$`, backtick and double-quote literals; embedded single quotes double.
 * @param path - absolute path to reveal (canonical form preferred).
 * @param platform - the host platform.
 * @returns the shell-free command.
 */
export function revealCommand(
  path: string,
  platform: NodeJS.Platform = process.platform,
): { command: string; args: string[] } {
  switch (platform) {
    case 'win32': {
      const literal = path.replace(/'/g, "''")
      return { command: 'powershell.exe', args: ['-NoProfile', '-Command', `Explorer.exe '/select,${literal}'`] }
    }
    case 'darwin': return { command: 'open', args: ['-R', path] }
    case 'linux': return { command: 'xdg-open', args: [dirname(path)] }
    default: throw new Error(`reveal is unsupported on ${platform}`)
  }
}

/**
 * The platform "open with the default application" command for one path.
 * Windows uses PowerShell `Start-Process` — the document goes through
 * ShellExecute like `cmd start` would, but the path arrives intact: node's
 * argv quoting wraps the whole `-Command` script once, and the single-quoted
 * literal inside stays literal (the `cmd /c start "" <path>` form failed
 * paths with spaces — node's wrapping and cmd's own parser disagree on
 * quotes). `Start-Process` returns 0 immediately. Pure so tests pin the
 * exact argv.
 * @param path - absolute path to open.
 * @param platform - the host platform.
 * @returns the shell-free command.
 */
export function openCommand(
  path: string,
  platform: NodeJS.Platform = process.platform,
): { command: string; args: string[] } {
  switch (platform) {
    case 'win32': {
      const literal = path.replace(/'/g, "''")
      return { command: 'powershell.exe', args: ['-NoProfile', '-Command', `Start-Process -FilePath '${literal}'`] }
    }
    case 'darwin': return { command: 'open', args: [path] }
    case 'linux': return { command: 'xdg-open', args: [path] }
    default: throw new Error(`open is unsupported on ${platform}`)
  }
}

/** Preview cap: files at or above this size are reported truncated without content. */
export const READ_PREVIEW_BYTES = 256 * 1024

/** How the explorer counts hidden entries: the POSIX dot convention (the fs
 *  seam exposes no platform-hidden attribute; Windows hidden stays listed). */
function isHidden(name: string): boolean {
  return name.startsWith('.')
}

/** Bucket order for the explorer's conventional sort: directories, files, then other. */
function kindRank(kind: WorkspaceFileEntry['kind']): number {
  return kind === 'directory' ? 0 : kind === 'file' ? 1 : 2
}

/** Name-sorted with directories first, then files, then other entries. */
function sortEntries(entries: readonly WorkspaceFileEntry[]): WorkspaceFileEntry[] {
  return [...entries].sort((left, right) =>
    kindRank(left.kind) - kindRank(right.kind)
    || left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }))
}

/** Rejected operation result with a stable business failure. */
function rejected<E extends WorkspaceFilesFailure>(error: E): WorkspaceFilesRejected<E> {
  return { ok: false, error }
}

/** Successful operation result. */
function success<T>(value: T): WorkspaceFilesSuccess<T> {
  return { ok: true, value }
}

/** Map one `ctx.fs` failure to the closed business failure vocabulary. */
function mapFsError(error: unknown, path: string): WorkspaceFilesFailure {
  if (error instanceof FsError) {
    switch (error.code) {
      case 'FS_NOT_FOUND': return { code: 'path-unavailable', path }
      case 'FS_NOT_DIRECTORY': return { code: 'not-a-directory', path }
      case 'FS_NOT_TEXT':
      case 'FS_NOT_REGULAR_FILE': return { code: 'not-a-text-file', path }
      case 'FS_PERMISSION_DENIED':
      case 'FS_SANDBOX_DENIED': return { code: 'permission-denied', path }
      default: return { code: 'io-error', path }
    }
  }
  return { code: 'io-error', path }
}

/**
 * Narrow one mapped failure to the codes one operation may report. Codes the
 * operation pre-validates against (a `read` on a directory is rejected before
 * any fs call) degrade to `io-error` rather than widening the result union.
 * @param error - the mapped wide failure.
 * @param path - the path the failure is about.
 * @returns the failure narrowed to `codes`.
 */
function narrowFailure<C extends WorkspaceFilesFailure['code']>(
  error: WorkspaceFilesFailure,
  path: string,
  codes: readonly C[],
): Extract<WorkspaceFilesFailure, { code: C }> {
  if ((codes as readonly string[]).includes(error.code)) {
    return error as Extract<WorkspaceFilesFailure, { code: C }>
  }
  return { code: 'io-error', path } as Extract<WorkspaceFilesFailure, { code: C }>
}

/** The `ctx.fs` resolve options with `exactOptionalPropertyTypes` respected. */
function resolveOptions(signal: AbortSignal | undefined): { signal?: AbortSignal } {
  return signal === undefined ? {} : { signal }
}

/** The host account's working directory — the explorer root the client already
 *  knows from `host.describe`'s `cwd`; computed through the fs seam so a
 *  non-local backend still reports its own execution root. */
function hostRoot(ctx: Context, signal: AbortSignal | undefined): Promise<string> {
  return ctx.fs.resolve('.', resolveOptions(signal)).then(target => ctx.fs.processPath(target))
}

/** Remote-only service exposing read-only workspace browsing primitives. */
export class WorkspaceFilesGateway extends TypertRemoteService {
  static inject = ['fs']

  constructor(ctx: Context) {
    super(ctx, 'workspaceFiles')
  }

  /**
   * List one directory level through the host filesystem seam.
   * @param path - absolute directory to list; absent lists the host working directory.
   * @param signal - caller lifetime; abort stops the scan.
   * @returns the level's sorted listing plus the explorer root, or a business failure.
   */
  @Remote('list')
  async list(path?: string, signal?: AbortSignal): Promise<WorkspaceFileListResult> {
    const requested = path ?? '.'
    try {
      const target = await this.ctx.fs.resolve(requested, resolveOptions(signal))
      const info = await this.ctx.fs.stat(target, signal)
      if (info === undefined) return rejected({ code: 'path-unavailable', path: requested })
      if (info.type !== 'directory') return rejected({ code: 'not-a-directory', path: requested })
      const children = await this.ctx.fs.listDir(target, signal)
      const [root, entries] = await Promise.all([
        hostRoot(this.ctx, signal),
        Promise.all(children.map(async (child: FsDirEntry): Promise<WorkspaceFileEntry> => {
          const name = child.name
          return {
            name,
            path: this.ctx.fs.processPath(child.target),
            kind: child.type === 'directory' ? 'directory' : child.type === 'file' ? 'file' : 'other',
            size: child.type === 'file' ? (child.size ?? null) : null,
            hidden: isHidden(name),
          }
        })),
      ])
      return success({
        path: this.ctx.fs.processPath(target),
        root,
        entries: sortEntries(entries),
        truncated: false,
      })
    } catch (error) {
      return rejected(narrowFailure(mapFsError(error, requested), requested, ['path-unavailable', 'not-a-directory', 'permission-denied', 'io-error']))
    }
  }

  /**
   * Read a bounded UTF-8 text preview of one regular file.
   * @param path - absolute regular file to preview.
   * @param signal - caller lifetime; abort stops the read.
   * @returns decoded content (head slice when the file exceeds the preview cap), or a business failure.
   */
  @Remote('read')
  async read(path: string, signal?: AbortSignal): Promise<WorkspaceFileReadResult> {
    try {
      const target = await this.ctx.fs.resolve(path, resolveOptions(signal))
      const info = await this.ctx.fs.stat(target, signal)
      if (info === undefined) return rejected({ code: 'path-unavailable', path })
      if (info.type === 'directory') return rejected({ code: 'is-a-directory', path })
      if (info.type !== 'file') return rejected({ code: 'not-a-text-file', path })
      if (info.size !== undefined && info.size > READ_PREVIEW_BYTES) {
        const preview: WorkspaceFileRead = { content: '', truncated: true, byteLength: info.size }
        return success(preview)
      }
      const bytes = await this.ctx.fs.readBytes(target, signal, READ_PREVIEW_BYTES)
      let content: string
      try {
        content = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      } catch {
        return rejected({ code: 'not-a-text-file', path })
      }
      return success({ content, truncated: false, byteLength: bytes.byteLength })
    } catch (error) {
      return rejected(narrowFailure(mapFsError(error, path), path, ['path-unavailable', 'is-a-directory', 'not-a-text-file', 'permission-denied', 'io-error']))
    }
  }

  /**
   * Probe one path's metadata without reading content.
   * @param path - absolute path to probe.
   * @param signal - caller lifetime; abort stops the probe.
   * @returns the entry's kind and byte size, or a business failure.
   */
  @Remote('stat')
  async stat(path: string, signal?: AbortSignal): Promise<WorkspaceFileStatResult> {
    try {
      const target = await this.ctx.fs.resolve(path, resolveOptions(signal))
      const info = await this.ctx.fs.stat(target, signal)
      if (info === undefined) return rejected({ code: 'path-unavailable', path })
      const result: WorkspaceFileStat = {
        path: this.ctx.fs.processPath(target),
        kind: info.type === 'directory' ? 'directory' : info.type === 'file' ? 'file' : 'other',
        size: info.type === 'file' ? (info.size ?? null) : null,
      }
      return success(result)
    } catch (error) {
      return rejected(narrowFailure(mapFsError(error, path), path, ['path-unavailable', 'permission-denied', 'io-error']))
    }
  }

  /**
   * Commit one full-file text write (create or replace) through `ctx.fs`.
   * The mounted backend's sandbox fence still applies — under the default
   * `workspace-write` policy the target must canonicalize under the workspace
   * root (or a platform temp area), so the explorer can edit the workspace it
   * browses but not arbitrary host files.
   * @param path - absolute regular file to create or replace.
   * @param content - full new UTF-8 text content.
   * @param signal - caller lifetime; abort stops the write.
   * @returns the write outcome, or a business failure.
   */
  @Remote('write')
  async write(path: string, content: string, signal?: AbortSignal): Promise<WorkspaceFileWriteResult> {
    try {
      const target = await this.ctx.fs.resolve(path, resolveOptions(signal))
      const info = await this.ctx.fs.stat(target, signal)
      if (info !== undefined && info.type === 'directory') {
        return rejected({ code: 'is-a-directory', path })
      }
      const outcome = await this.ctx.fs.writeText(target, content, undefined, signal)
      return success({
        operation: outcome.operation,
        path: this.ctx.fs.processPath(target),
        byteLength: Buffer.byteLength(content, 'utf8'),
      })
    } catch (error) {
      return rejected(narrowFailure(mapFsError(error, path), path, ['path-unavailable', 'is-a-directory', 'permission-denied', 'io-error']))
    }
  }

  /**
   * Reveal one path on the host desktop (show-in-folder: Explorer selection
   * on Windows, Finder reveal on macOS, the parent directory on Linux).
   * More reliable than a bare open for the "open the containing folder"
   * gesture, and it never depends on a file-type association.
   * @param path - absolute path to reveal.
   * @param signal - caller lifetime; abort terminates the reveal command.
   * @returns the canonical revealed path, or a business failure.
   */
  @Remote('reveal')
  async reveal(path: string, signal?: AbortSignal): Promise<WorkspaceFileRevealResult> {
    try {
      const target = await this.ctx.fs.resolve(path, resolveOptions(signal))
      const canonical = this.ctx.fs.processPath(target)
      const { command, args } = revealCommand(canonical)
      await runNativeCommand(command, args, signal ?? new AbortController().signal)
      return success({ path: canonical })
    } catch (error) {
      return rejected(narrowFailure(mapFsError(error, path), path, ['path-unavailable', 'permission-denied', 'io-error']))
    }
  }

  /**
   * Open one path with the host's default application (the "open in system"
   * gesture). A dedicated command per platform (Windows `cmd start`) so the
   * gesture never depends on the shared opener seam or an undeclared service.
   * @param path - absolute path to open.
   * @param signal - caller lifetime; abort terminates the open command.
   * @returns the canonical opened path, or a business failure.
   */
  @Remote('open')
  async open(path: string, signal?: AbortSignal): Promise<WorkspaceFileOpenResult> {
    try {
      const target = await this.ctx.fs.resolve(path, resolveOptions(signal))
      const canonical = this.ctx.fs.processPath(target)
      const { command, args } = openCommand(canonical)
      await runNativeCommand(command, args, signal ?? new AbortController().signal)
      return success({ path: canonical })
    } catch (error) {
      return rejected(narrowFailure(mapFsError(error, path), path, ['path-unavailable', 'permission-denied', 'io-error']))
    }
  }
}

export default WorkspaceFilesGateway
