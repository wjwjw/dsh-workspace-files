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
/** The mutation tools whose successful calls count as modifying a file. */
export const MUTATION_TOOLS = new Set(['write', 'edit']);
/** Stable empty list shared by every no-session/no-modification publication. */
export const EMPTY_MODIFIED_FILES = [];
/** The archive cutoff for an in-flight call: always after any archive point. */
const RUNNING_SEQ = Number.POSITIVE_INFINITY;
/** Settlement rank: a later state supersedes an earlier one (error > ok > running). */
const STATE_RANK = { running: 0, ok: 1, error: 2 };
/** Paths that look absolute: a POSIX root or a Windows drive root. */
export function isAbsolutePath(path) {
    return path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path);
}
/** Normalize a path for display: forward slashes except the drive colon. */
export function normalizePath(path) {
    return path.replace(/\\/g, '/');
}
/**
 * Resolve a tool-reported path against the session cwd when it is relative.
 * Client-side best effort only: the host's `resolve` remains authoritative;
 * symlinks and `..` segments stay unnormalized (documented limitation).
 */
export function resolveAgainstCwd(cwd, path) {
    const normalized = normalizePath(path);
    if (cwd === undefined || isAbsolutePath(normalized))
        return normalized;
    const base = normalizePath(cwd).replace(/\/+$/u, '');
    const rest = normalized.replace(/^\/+/u, '');
    return rest.length === 0 ? base : `${base}/${rest}`;
}
/** Extract the mutation target path from a raw tool `arguments` JSON string. */
export function pathFromArgs(name, argsRaw) {
    if (!MUTATION_TOOLS.has(name))
        return undefined;
    let parsed;
    try {
        parsed = JSON.parse(argsRaw);
    }
    catch {
        return undefined;
    }
    if (typeof parsed !== 'object' || parsed === null)
        return undefined;
    const filePath = parsed.file_path;
    if (typeof filePath !== 'string' || filePath.trim().length === 0)
        return undefined;
    return filePath;
}
/**
 * Whether a `write` call created the file, from its result metadata: the
 * write tool's `presentationMeta` carries an empty `diffs` list exactly when
 * the file did not exist before (before === null). Absent metadata (older
 * logs, other call heads) reports nothing; the caller falls back to update.
 */
export function writeOperationFromMeta(meta) {
    if (typeof meta !== 'object' || meta === null)
        return undefined;
    const diffs = meta.diffs;
    if (Array.isArray(diffs) && diffs.length === 0)
        return 'create';
    if (Array.isArray(diffs))
        return 'update';
    return undefined;
}
/**
 * Merge one freshly observed call record into a call-keyed table (a window
 * derivation or the source's retained table). Settlement rank decides first
 * (error outranks ok outranks running); within a rank the later event (higher
 * seq) wins, so a settled result supersedes its provisional head and carries
 * the write diff-derived operation. First-seen insertion order is preserved
 * (Map insert keeps the original position on overwrite).
 */
export function mergeCallRecord(calls, next) {
    const existing = calls.get(next.callId);
    if (existing === undefined) {
        calls.set(next.callId, next);
        return;
    }
    if (STATE_RANK[next.state] < STATE_RANK[existing.state])
        return;
    if (STATE_RANK[next.state] > STATE_RANK[existing.state] || next.seq >= existing.seq) {
        calls.set(next.callId, next);
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
export function deriveModifiedCalls(snapshot, cwd) {
    const calls = new Map();
    for (const node of snapshot.nodes) {
        switch (node.kind) {
            case 'assistant': {
                for (const block of node.blocks) {
                    if (block.kind !== 'tool-call')
                        continue;
                    const path = pathFromArgs(block.name, block.argsRaw);
                    if (path === undefined)
                        continue;
                    mergeCallRecord(calls, {
                        callId: block.callId,
                        path: resolveAgainstCwd(cwd, path),
                        tool: block.name,
                        time: node.time,
                        seq: node.seq,
                        state: 'ok',
                    });
                }
                break;
            }
            case 'tool-result': {
                if (node.call === null)
                    break;
                const path = pathFromArgs(node.call.name, node.call.argsRaw);
                if (path === undefined)
                    break;
                const operation = node.call.name === 'write'
                    ? writeOperationFromMeta(node.meta)
                    : 'update';
                mergeCallRecord(calls, {
                    callId: node.callId,
                    path: resolveAgainstCwd(cwd, path),
                    tool: node.call.name,
                    ...(operation !== undefined ? { operation } : {}),
                    time: node.time,
                    seq: node.seq,
                    state: node.isError ? 'error' : 'ok',
                });
                break;
            }
            default:
                break;
        }
    }
    for (const call of snapshot.runningCalls) {
        const path = pathFromArgs(call.name, call.argsRaw);
        if (path === undefined)
            continue;
        mergeCallRecord(calls, {
            callId: call.callId,
            path: resolveAgainstCwd(cwd, path),
            tool: call.name,
            time: call.time,
            seq: RUNNING_SEQ,
            state: 'running',
        });
    }
    return [...calls.values()];
}
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
export function projectModifiedFiles(calls) {
    const result = [];
    for (const mutation of calls) {
        const entry = {
            path: mutation.path,
            tool: mutation.tool,
            operation: mutation.operation ?? 'update',
            time: mutation.time,
            seq: mutation.seq,
            state: mutation.state,
        };
        const existing = result.findIndex(item => item.path === entry.path);
        if (existing === -1)
            result.push(entry);
        else {
            // `existing !== -1` guarantees the slot is populated, but
            // `noUncheckedIndexedAccess` cannot prove it — guard the read.
            const current = result[existing];
            if (current === undefined || STATE_RANK[mutation.state] >= STATE_RANK[current.state]) {
                result[existing] = entry;
            }
        }
    }
    return result;
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
export function deriveModifiedFiles(snapshot, cwd) {
    return projectModifiedFiles(deriveModifiedCalls(snapshot, cwd));
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
export function createModifiedFilesSource(sessions) {
    let snapshot = EMPTY_MODIFIED_FILES;
    const listeners = new Set();
    let current;
    let unsubscribeSession;
    /** Per-session retained call table; reset on selection change. */
    let retained = new Map();
    let disposed = false;
    const publish = (next) => {
        if (next === snapshot)
            return;
        snapshot = next;
        for (const listener of [...listeners])
            listener();
    };
    const refresh = () => {
        if (disposed)
            return;
        const list = sessions.list.getSnapshot();
        const id = list.current;
        if (id !== current) {
            current = id;
            retained = new Map();
            unsubscribeSession?.();
            unsubscribeSession = undefined;
        }
        if (current === undefined) {
            publish(EMPTY_MODIFIED_FILES);
            return;
        }
        const binding = sessions.binding(current);
        if (binding === undefined) {
            publish(EMPTY_MODIFIED_FILES);
            return;
        }
        if (unsubscribeSession === undefined)
            unsubscribeSession = binding.session.subscribe(refresh);
        const conversation = binding.session.getSnapshot();
        for (const record of deriveModifiedCalls(conversation, list.byId[current]?.cwd)) {
            mergeCallRecord(retained, record);
        }
        // Settlement hints: a tool result whose call head left the window cannot
        // re-derive a path (its `call` is null), but the node's callId + isError
        // still settle the retained record — otherwise a long-running call whose
        // head was truncated would show 'running' forever after it settled.
        for (const node of conversation.nodes) {
            if (node.kind !== 'tool-result' || node.call !== null)
                continue;
            const existing = retained.get(node.callId);
            if (existing === undefined)
                continue;
            mergeCallRecord(retained, {
                ...existing,
                time: node.time,
                seq: node.seq,
                state: node.isError ? 'error' : 'ok',
            });
        }
        publish(projectModifiedFiles([...retained.values()]));
    };
    const unsubscribeList = sessions.list.subscribe(refresh);
    refresh();
    return {
        getSnapshot: () => snapshot,
        subscribe(listener) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
        dispose() {
            disposed = true;
            unsubscribeList();
            unsubscribeSession?.();
            listeners.clear();
        },
    };
}
//# sourceMappingURL=modified-files.js.map