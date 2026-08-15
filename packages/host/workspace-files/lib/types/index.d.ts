/**
 * Workspace file browsing Remote: read-only one-level listings with metadata,
 * bounded text previews, and stat probes over `ctx.fs`. The web GUI's file
 * explorer consumes this namespace; every method is deliberately read-only so
 * the surface can never mutate the host filesystem (creation goes through the
 * workspace `createDirectory` seam when a future explorer needs it).
 * @module @deepseek-ai/dsh-host-workspace-files
 */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { WorkspaceFileListResult, WorkspaceFileOpenResult, WorkspaceFileReadResult, WorkspaceFileRevealResult, WorkspaceFileStatResult, WorkspaceFileWriteResult } from './types.ts';
export type * from './types.ts';
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
export declare function revealCommand(path: string, platform?: NodeJS.Platform): {
    command: string;
    args: string[];
};
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
export declare function openCommand(path: string, platform?: NodeJS.Platform): {
    command: string;
    args: string[];
};
/** Preview cap: files at or above this size are reported truncated without content. */
export declare const READ_PREVIEW_BYTES: number;
/** Remote-only service exposing read-only workspace browsing primitives. */
export declare class WorkspaceFilesGateway extends TypertRemoteService {
    static inject: string[];
    constructor(ctx: Context);
    /**
     * List one directory level through the host filesystem seam.
     * @param path - absolute directory to list; absent lists the host working directory.
     * @param signal - caller lifetime; abort stops the scan.
     * @returns the level's sorted listing plus the explorer root, or a business failure.
     */
    list(path?: string, signal?: AbortSignal): Promise<WorkspaceFileListResult>;
    /**
     * Read a bounded UTF-8 text preview of one regular file.
     * @param path - absolute regular file to preview.
     * @param signal - caller lifetime; abort stops the read.
     * @returns decoded content (head slice when the file exceeds the preview cap), or a business failure.
     */
    read(path: string, signal?: AbortSignal): Promise<WorkspaceFileReadResult>;
    /**
     * Probe one path's metadata without reading content.
     * @param path - absolute path to probe.
     * @param signal - caller lifetime; abort stops the probe.
     * @returns the entry's kind and byte size, or a business failure.
     */
    stat(path: string, signal?: AbortSignal): Promise<WorkspaceFileStatResult>;
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
    write(path: string, content: string, signal?: AbortSignal): Promise<WorkspaceFileWriteResult>;
    /**
     * Reveal one path on the host desktop (show-in-folder: Explorer selection
     * on Windows, Finder reveal on macOS, the parent directory on Linux).
     * More reliable than a bare open for the "open the containing folder"
     * gesture, and it never depends on a file-type association.
     * @param path - absolute path to reveal.
     * @param signal - caller lifetime; abort terminates the reveal command.
     * @returns the canonical revealed path, or a business failure.
     */
    reveal(path: string, signal?: AbortSignal): Promise<WorkspaceFileRevealResult>;
    /**
     * Open one path with the host's default application (the "open in system"
     * gesture). A dedicated command per platform (Windows `cmd start`) so the
     * gesture never depends on the shared opener seam or an undeclared service.
     * @param path - absolute path to open.
     * @param signal - caller lifetime; abort terminates the open command.
     * @returns the canonical opened path, or a business failure.
     */
    open(path: string, signal?: AbortSignal): Promise<WorkspaceFileOpenResult>;
}
export default WorkspaceFilesGateway;
//# sourceMappingURL=index.d.ts.map