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

import type {
  ConversationSnapshot,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-client-connection/client'
import type { ISessions } from '@deepseek-ai/dsh-client-runtime/client'

/** The mutation tools whose successful calls count as modifying a file. */
export const MUTATION_TOOLS = new Set(['write', 'edit'])

/** Settlement state of one tracked mutation call. */
export type ModifiedFileState = 'running' | 'ok' | 'error'

/** Whether the file was newly created or edited in place. */
export type ModifiedFileOperation = 'create' | 'update'

/** One file the current conversation touched, in first-seen call order. */
export interface ModifiedFile {
  /** Absolute (or cwd-resolved) host path of the file. */
  readonly path: string
  /** The mutation tool name that touched it. */
  readonly tool: string
  /** Whether the file was created or edited in place. */
  readonly operation: ModifiedFileOperation
  /** When the mutation settled or is still running. */
  readonly time: number
  /** Conversation log position of the source event; running calls report Infinity. */
  readonly seq: number
  readonly state: ModifiedFileState
}

/** Stable empty list shared by every no-session/no-modification publication. */
export const EMPTY_MODIFIED_FILES: readonly ModifiedFile[] = []

/** The archive cutoff for an in-flight call: always after any archive point. */
const RUNNING_SEQ = Number.POSITIVE_INFINITY

/** Settlement rank: a later state supersedes an earlier one (error > ok > running). */
const STATE_RANK: Readonly<Record<ModifiedFileState, number>> = { running: 0, ok: 1, error: 2 }

/**
 * One per-call mutation record. The merge unit across derivations and across
 * window changes: call identity is stable host fact, so a record survives its
 * events leaving the window and keeps the display entry alive.
 */
export interface CallRecord {
  /** Stable per-call identity (assistant head, tool result, and running call share it). */
  readonly callId: string
  readonly path: string
  readonly tool: string
  /** Create/update once the settled result reports it; absent before settlement. */
  readonly operation?: ModifiedFileOperation
  readonly time: number
  readonly seq: number
  readonly state: ModifiedFileState
}

/** Paths that look absolute: a POSIX root or a Windows drive root. */
export function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path)
}

/** Normalize a path for display: forward slashes except the drive colon. */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

/**
 * Resolve a tool-reported path against the session cwd when it is relative.
 * Client-side best effort only: the host's `resolve` remains authoritative;
 * symlinks and `..` segments stay unnormalized (documented limitation).
 */
export function resolveAgainstCwd(cwd: string | undefined, path: string): string {
  const normalized = normalizePath(path)
  if (cwd === undefined || isAbsolutePath(normalized)) return normalized
  const base = normalizePath(cwd).replace(/\/+$/u, '')
  const rest = normalized.replace(/^\/+/u, '')
  return rest.length === 0 ? base : `${base}/${rest}`
}

/** Extract the mutation target path from a raw tool `arguments` JSON string. */
export function pathFromArgs(name: string, argsRaw: string): string | undefined {
  if (!MUTATION_TOOLS.has(name)) return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(argsRaw)
  } catch {
    return undefined
  }
  if (typeof parsed !== 'object' || parsed === null) return undefined
  const filePath = (parsed as { file_path?: unknown }).file_path
  if (typeof filePath !== 'string' || filePath.trim().length === 0) return undefined
  return filePath
}

/**
 * Whether a `write` call created the file, from its result metadata: the
 * write tool's `presentationMeta` carries an empty `diffs` list exactly when
 * the file did not exist before (before === null). Absent metadata (older
 * logs, other call heads) reports nothing; the caller falls back to update.
 */
export function writeOperationFromMeta(meta: unknown): ModifiedFileOperation | undefined {
  if (typeof meta !== 'object' || meta === null) return undefined
  const diffs = (meta as { diffs?: unknown }).diffs
  if (Array.isArray(diffs) && diffs.length === 0) return 'create'
  if (Array.isArray(diffs)) return 'update'
  return undefined
}

/**
 * Merge one freshly observed call record into a call-keyed table (a window
 * derivation or the source's retained table). Settlement rank decides first
 * (error outranks ok outranks running); within a rank the later event (higher
 * seq) wins, so a settled result supersedes its provisional head and carries
 * the write diff-derived operation. First-seen insertion order is preserved
 * (Map insert keeps the original position on overwrite).
 */
export function mergeCallRecord(calls: Map<string, CallRecord>, next: CallRecord): void {
  const existing = calls.get(next.callId)
  if (existing === undefined) {
    calls.set(next.callId, next)
    return
  }
  if (STATE_RANK[next.state] < STATE_RANK[existing.state]) return
  if (STATE_RANK[next.state] > STATE_RANK[existing.state] || next.seq >= existing.seq) {
    calls.set(next.callId, next)
  }
}

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
export function deriveModifiedCalls(
  snapshot: ConversationSnapshot,
  cwd: string | undefined,
): readonly CallRecord[] {
  const calls = new Map<string, CallRecord>()

  for (const node of snapshot.nodes) {
    switch (node.kind) {
      case 'assistant': {
        for (const block of node.blocks) {
          if (block.kind !== 'tool-call') continue
          const path = pathFromArgs(block.name, block.argsRaw)
          if (path === undefined) continue
          mergeCallRecord(calls, {
            callId: block.callId,
            path: resolveAgainstCwd(cwd, path),
            tool: block.name,
            time: node.time,
            seq: node.seq,
            state: 'ok',
          })
        }
        break
      }
      case 'tool-result': {
        if (node.call === null) break
        const path = pathFromArgs(node.call.name, node.call.argsRaw)
        if (path === undefined) break
        const operation = node.call.name === 'write'
          ? writeOperationFromMeta(node.meta)
          : 'update'
        mergeCallRecord(calls, {
          callId: node.callId,
          path: resolveAgainstCwd(cwd, path),
          tool: node.call.name,
          ...(operation !== undefined ? { operation } : {}),
          time: node.time,
          seq: node.seq,
          state: node.isError ? 'error' : 'ok',
        })
        break
      }
      default:
        break
    }
  }

  for (const call of snapshot.runningCalls) {
    const path = pathFromArgs(call.name, call.argsRaw)
    if (path === undefined) continue
    mergeCallRecord(calls, {
      callId: call.callId,
      path: resolveAgainstCwd(cwd, path),
      tool: call.name,
      time: call.time,
      seq: RUNNING_SEQ,
      state: 'running',
    })
  }

  return [...calls.values()]
}

/**
 * Project call records to the display list. Paths keep first-seen order and
 * appear once; a file written then edited is one entry carrying the later
 * call's data (the last write wins the display).
 * @param calls - call records in first-seen order.
 * @returns the display list, one entry per distinct path.
 */
export function projectModifiedFiles(calls: readonly CallRecord[]): readonly ModifiedFile[] {
  const result: ModifiedFile[] = []
  for (const mutation of calls) {
    const entry: ModifiedFile = {
      path: mutation.path,
      tool: mutation.tool,
      operation: mutation.operation ?? 'update',
      time: mutation.time,
      seq: mutation.seq,
      state: mutation.state,
    }
    const existing = result.findIndex(item => item.path === entry.path)
    if (existing === -1) result.push(entry)
    else result[existing] = entry
  }
  return result
}

/**
 * Derive the modified-file list from one conversation snapshot — the
 * window-scoped view (events outside the window are invisible to this pure
 * function; `createModifiedFilesSource` retains them across window changes).
 *
 * @param snapshot - the session's current conversation snapshot.
 * @param cwd - the session's working directory (relative targets resolve against it).
 * @returns modified files in first-seen call order.
 */
export function deriveModifiedFiles(
  snapshot: ConversationSnapshot,
  cwd: string | undefined,
): readonly ModifiedFile[] {
  return projectModifiedFiles(deriveModifiedCalls(snapshot, cwd))
}

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
export function createModifiedFilesSource(
  sessions: ISessions,
): HostObservable<readonly ModifiedFile[]> & { dispose(): void } {
  let snapshot: readonly ModifiedFile[] = EMPTY_MODIFIED_FILES
  const listeners = new Set<() => void>()
  let current: SessionId | undefined
  let unsubscribeSession: (() => void) | undefined
  /** Per-session retained call table; reset on selection change. */
  let retained = new Map<string, CallRecord>()
  let disposed = false

  const publish = (next: readonly ModifiedFile[]): void => {
    if (next === snapshot) return
    snapshot = next
    for (const listener of [...listeners]) listener()
  }

  const refresh = (): void => {
    if (disposed) return
    const list = sessions.list.getSnapshot()
    const id = list.current
    if (id !== current) {
      current = id
      retained = new Map()
      unsubscribeSession?.()
      unsubscribeSession = undefined
    }
    if (current === undefined) {
      publish(EMPTY_MODIFIED_FILES)
      return
    }
    const binding = sessions.binding(current)
    if (binding === undefined) {
      publish(EMPTY_MODIFIED_FILES)
      return
    }
    if (unsubscribeSession === undefined) unsubscribeSession = binding.session.subscribe(refresh)
    const conversation = binding.session.getSnapshot()
    for (const record of deriveModifiedCalls(conversation, list.byId[current]?.cwd)) {
      mergeCallRecord(retained, record)
    }
    // Settlement hints: a tool result whose call head left the window cannot
    // re-derive a path (its `call` is null), but the node's callId + isError
    // still settle the retained record — otherwise a long-running call whose
    // head was truncated would show 'running' forever after it settled.
    for (const node of conversation.nodes) {
      if (node.kind !== 'tool-result' || node.call !== null) continue
      const existing = retained.get(node.callId)
      if (existing === undefined) continue
      mergeCallRecord(retained, {
        ...existing,
        time: node.time,
        seq: node.seq,
        state: node.isError ? 'error' : 'ok',
      })
    }
    publish(projectModifiedFiles([...retained.values()]))
  }

  const unsubscribeList = sessions.list.subscribe(refresh)
  refresh()

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    dispose() {
      disposed = true
      unsubscribeList()
      unsubscribeSession?.()
      listeners.clear()
    },
  }
}
