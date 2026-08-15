/**
 * Session-scoped derivation of the files the current conversation modified.
 * A pure function over the conversation snapshot plus a registrant-private
 * Reactive source that republishes it for the current session — the modified
 * list is derived data, never its own subscription (web client AGENTS.md).
 *
 * The vocabulary is the mutation tools' own `file_path` argument, not the
 * closing prose: a modified file is listed whether or not the model named it.
 * `write` and `edit` (dsh-tool-fs) are the Web roster's mutation tools; a new
 * mutation tool joins by declaring itself here.
 *
 * Window retention: the source keeps a call-keyed table across conversation
 * window changes. A file whose events scroll out of the window (older history
 * truncation, reconnect window replacement) stays listed — the entry is only
 * dropped when the session itself changes. The pure derivations below remain
 * window-scoped views; retention lives in `createModifiedFilesSource`.
 */
import type { ConversationSnapshot } from '@deepseek-ai/dsh-client-runtime/client';
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots';
import type { ISessions } from '@deepseek-ai/dsh-client-runtime/client';
/** The mutation tools whose successful calls count as modifying a file. */
export declare const MUTATION_TOOLS: Set<string>;
/** Settlement state of one tracked mutation call. */
export type ModifiedFileState = 'running' | 'ok' | 'error';
/** Whether the file was newly created or edited in place. */
export type ModifiedFileOperation = 'create' | 'update';
/** One file the current conversation touched, in first-seen call order. */
export interface ModifiedFile {
    /** Absolute (or cwd-resolved) host path of the file. */
    readonly path: string;
    /** The mutation tool name that touched it. */
    readonly tool: string;
    /** Whether the file was created or edited in place. */
    readonly operation: ModifiedFileOperation;
    /** When the mutation settled or is still running. */
    readonly time: number;
    /** Conversation log position of the source event; running calls report Infinity. */
    readonly seq: number;
    readonly state: ModifiedFileState;
}
/** Stable empty list shared by every no-session/no-modification publication. */
export declare const EMPTY_MODIFIED_FILES: readonly ModifiedFile[];
/**
 * One per-call mutation record. The merge unit across derivations and across
 * window changes: call identity is stable host fact, so a record survives its
 * events leaving the window and keeps the display entry alive.
 */
export interface CallRecord {
    /** Stable per-call identity (assistant head, tool result, and running call share it). */
    readonly callId: string;
    readonly path: string;
    readonly tool: string;
    /** Create/update once the settled result reports it; absent before settlement. */
    readonly operation?: ModifiedFileOperation;
    readonly time: number;
    readonly seq: number;
    readonly state: ModifiedFileState;
}
/** Paths that look absolute: a POSIX root or a Windows drive root. */
export declare function isAbsolutePath(path: string): boolean;
/** Normalize a path for display: forward slashes except the drive colon. */
export declare function normalizePath(path: string): string;
/**
 * Resolve a tool-reported path against the session cwd when it is relative.
 * Client-side best effort only: the host's `resolve` remains authoritative;
 * symlinks and `..` segments stay unnormalized (documented limitation).
 */
export declare function resolveAgainstCwd(cwd: string | undefined, path: string): string;
/** Extract the mutation target path from a raw tool `arguments` JSON string. */
export declare function pathFromArgs(name: string, argsRaw: string): string | undefined;
/**
 * Whether a `write` call created the file, from its result metadata: the
 * write tool's `presentationMeta` carries an empty `diffs` list exactly when
 * the file did not exist before (before === null). Absent metadata (older
 * logs, other call heads) reports nothing; the caller falls back to update.
 */
export declare function writeOperationFromMeta(meta: unknown): ModifiedFileOperation | undefined;
/**
 * Merge one freshly observed call record into a call-keyed table (a window
 * derivation or the source's retained table). Settlement rank decides first
 * (error outranks ok outranks running); within a rank the later event (higher
 * seq) wins, so a settled result supersedes its provisional head and carries
 * the write diff-derived operation. First-seen insertion order is preserved
 * (Map insert keeps the original position on overwrite).
 */
export declare function mergeCallRecord(calls: Map<string, CallRecord>, next: CallRecord): void;
/**
 * Derive call-keyed mutation records from one conversation snapshot.
 *
 * Sources, all keyed by call id so the same call never double-lists:
 * - finalized assistant tool-call blocks (provisional ok),
 * - settled tool results (authoritative ok/error; a result with a lost call
 *   head — `node.call === null` — is skipped, the retained head stays),
 * - still-running calls (running).
 *
 * @param snapshot - the session's current conversation snapshot.
 * @param cwd - the session's working directory (relative targets resolve against it).
 * @returns per-call records in first-seen call order.
 */
export declare function deriveModifiedCalls(snapshot: ConversationSnapshot, cwd: string | undefined): readonly CallRecord[];
/**
 * Project call records to the display list. Paths keep first-seen order and
 * appear once; a file written then edited is one entry carrying the later
 * call's data. Settlement rank governs the overwrite just as it does the
 * merge: a settled outcome outranks a running follow-up on the same path, so
 * a file that was successfully edited earlier does not flicker back to
 * "running" while a later edit is in flight.
 * @param calls - call records in first-seen order.
 * @returns the display list, one entry per distinct path.
 */
export declare function projectModifiedFiles(calls: readonly CallRecord[]): readonly ModifiedFile[];
/**
 * Derive the modified-file list from one conversation snapshot — the
 * window-scoped view (events outside the window are invisible to this pure
 * function; `createModifiedFilesSource` retains them across window changes).
 *
 * @param snapshot - the session's current conversation snapshot.
 * @param cwd - the session's working directory (relative targets resolve against it).
 * @returns modified files in first-seen call order.
 */
export declare function deriveModifiedFiles(snapshot: ConversationSnapshot, cwd: string | undefined): readonly ModifiedFile[];
/**
 * Build the registrant-private Reactive source publishing the current
 * session's modified-file list. Subscribes to the global session list (the
 * current-selection authority) and to the bound session's conversation
 * snapshot, and republishes a fresh immutable list whenever either changes.
 *
 * Retention: the source keeps a call-keyed table for the current session and
 * merges every window derivation into it, so entries survive their events
 * leaving the window (truncation, reconnect window replacement). The table is
 * reset when the selection changes; `archiveSeq`-style pruning is left to the
 * caller (the dock's store filters by `seq`).
 *
 * @param sessions - the client sessions service.
 * @returns a HostObservable the renderer binds as `useModifiedFiles`, plus a
 *   `dispose` that releases both subscriptions (wired to the plugin fiber).
 */
export declare function createModifiedFilesSource(sessions: ISessions): HostObservable<readonly ModifiedFile[]> & {
    dispose(): void;
};
//# sourceMappingURL=modified-files.d.ts.map