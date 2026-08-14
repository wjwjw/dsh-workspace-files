/**
 * Pure derivation contract of the modified-file list: argument parsing, cwd
 * resolution, settlement precedence, and first-seen ordering/dedup — all
 * over fixture conversation snapshots (no render machinery).
 */
import { describe, expect, it } from 'vitest'
import { conversationSnapshot } from '@deepseek-ai/dsh-client-test-runtime'
import type {
  AssistantMessageNode, ConversationNode, ConversationSnapshot, RunningToolCall, ToolResultNode,
} from '@deepseek-ai/dsh-client-runtime/client'
import {
  deriveModifiedFiles, isAbsolutePath, mergeCallRecord, pathFromArgs, projectModifiedFiles,
  resolveAgainstCwd, writeOperationFromMeta, type CallRecord,
} from '../src/client/modified-files.ts'

const sid = 'session-1'

function snapshotWith(nodes: readonly ConversationNode[], runningCalls: readonly RunningToolCall[] = []): ConversationSnapshot {
  return { ...conversationSnapshot(sid as never), nodes: [...nodes], runningCalls: [...runningCalls] }
}

/** A finalized assistant message carrying one tool-call block. */
function assistant(seq: number, callId: string, name: string, argsRaw: string): AssistantMessageNode {
  return {
    kind: 'assistant', seq, time: 1000 + seq, turn: 1, step: 1,
    blocks: [{ kind: 'tool-call', callId, name, argsRaw }],
  }
}

/** A settled tool result paired with its call head; meta carries the write diff facts. */
function result(seq: number, callId: string, name: string, argsRaw: string, isError = false, meta?: unknown): ToolResultNode {
  return {
    kind: 'tool-result', seq, time: 2000 + seq, callId,
    call: { name, argsRaw },
    callTime: 1500 + seq, content: [], isError,
    ...(meta !== undefined ? { meta } : {}),
    callView: null, resultView: null, subCalls: [],
  }
}

function running(callId: string, name: string, argsRaw: string): RunningToolCall {
  return { callId, name, argsRaw, turn: 1, step: 1, time: 500, callView: null, subCalls: [] }
}

describe('pathFromArgs', () => {
  it('extracts file_path from write and edit calls', () => {
    expect(pathFromArgs('write', '{"file_path":"src/a.ts","content":"x"}')).toBe('src/a.ts')
    expect(pathFromArgs('edit', '{"file_path":"/abs/b.ts","old_string":"a","new_string":"b"}')).toBe('/abs/b.ts')
  })

  it('ignores reads, unknown tools, malformed JSON, and missing targets', () => {
    expect(pathFromArgs('read', '{"file_path":"a.ts"}')).toBeUndefined()
    expect(pathFromArgs('str_replace', '{"path":"a.ts"}')).toBeUndefined()
    expect(pathFromArgs('write', '{not json')).toBeUndefined()
    expect(pathFromArgs('write', '{"content":"x"}')).toBeUndefined()
    expect(pathFromArgs('write', '{"file_path":"   "}')).toBeUndefined()
  })
})

describe('resolveAgainstCwd', () => {
  it('passes absolute paths through and joins relative ones against the cwd', () => {
    expect(resolveAgainstCwd('/ws', 'src/a.ts')).toBe('/ws/src/a.ts')
    expect(resolveAgainstCwd('/ws', '/abs/a.ts')).toBe('/abs/a.ts')
    expect(resolveAgainstCwd('C:\\ws', 'C:\\abs\\a.ts')).toBe('C:/abs/a.ts')
    expect(resolveAgainstCwd('C:\\ws', 'a.ts')).toBe('C:/ws/a.ts')
    expect(resolveAgainstCwd(undefined, 'a.ts')).toBe('a.ts')
  })

  it('normalizes backslashes and collapses redundant separators', () => {
    expect(resolveAgainstCwd('C:\\ws\\', 'sub\\a.ts')).toBe('C:/ws/sub/a.ts')
    expect(resolveAgainstCwd('/ws/', '/sub/a.ts')).toBe('/sub/a.ts')
    expect(isAbsolutePath('/x')).toBe(true)
    expect(isAbsolutePath('C:\\x')).toBe(true)
    expect(isAbsolutePath('x')).toBe(false)
  })
})

describe('writeOperationFromMeta', () => {
  it('reports create for an empty diff list and update for a populated one', () => {
    expect(writeOperationFromMeta({ diffs: [] })).toBe('create')
    expect(writeOperationFromMeta({ diffs: [{ path: 'a', oldText: 'x', newText: 'y' }] })).toBe('update')
    expect(writeOperationFromMeta(null)).toBeUndefined()
    expect(writeOperationFromMeta({})).toBeUndefined()
  })
})

describe('deriveModifiedFiles', () => {
  it('collects write and edit calls in first-seen order', () => {
    const snapshot = snapshotWith([
      assistant(1, 'c1', 'write', '{"file_path":"a.txt"}'),
      assistant(2, 'c2', 'read', '{"file_path":"b.txt"}'),
      assistant(3, 'c3', 'edit', '{"file_path":"c.txt"}'),
    ])
    // Unsettled heads fall back to update; settled results carry the real op.
    expect(deriveModifiedFiles(snapshot, '/ws')).toEqual([
      { path: '/ws/a.txt', tool: 'write', operation: 'update', time: 1001, seq: 1, state: 'ok' },
      { path: '/ws/c.txt', tool: 'edit', operation: 'update', time: 1003, seq: 3, state: 'ok' },
    ])
  })

  it('lets a failed result override the provisional ok head', () => {
    const snapshot = snapshotWith([
      assistant(1, 'c1', 'write', '{"file_path":"a.txt"}'),
      result(2, 'c1', 'write', '{"file_path":"a.txt"}', true),
    ])
    expect(deriveModifiedFiles(snapshot, undefined)).toEqual([
      { path: 'a.txt', tool: 'write', operation: 'update', time: 2002, seq: 2, state: 'error' },
    ])
  })

  it('marks a created file from an empty write diff list', () => {
    const snapshot = snapshotWith([
      result(1, 'c1', 'write', '{"file_path":"fresh.txt"}', false, { diffs: [] }),
      result(2, 'c2', 'write', '{"file_path":"touched.txt"}', false, { diffs: [{ path: 'x', oldText: 'a', newText: 'b' }] }),
      result(3, 'c3', 'edit', '{"file_path":"edited.txt"}', false),
    ])
    const derived = deriveModifiedFiles(snapshot, '/ws')
    expect(derived[0]).toMatchObject({ path: '/ws/fresh.txt', operation: 'create' })
    expect(derived[1]).toMatchObject({ path: '/ws/touched.txt', operation: 'update' })
    expect(derived[2]).toMatchObject({ path: '/ws/edited.txt', operation: 'update' })
  })

  it('lets a settled result supersede its in-window head and carry the create op', () => {
    // Head and result both in-window: same call, same ok rank — the later
    // event (the result) wins, so the diff-derived create is not lost.
    const snapshot = snapshotWith([
      assistant(1, 'c1', 'write', '{"file_path":"fresh.txt"}'),
      result(2, 'c1', 'write', '{"file_path":"fresh.txt"}', false, { diffs: [] }),
    ])
    expect(deriveModifiedFiles(snapshot, '/ws')).toEqual([
      { path: '/ws/fresh.txt', tool: 'write', operation: 'create', time: 2002, seq: 2, state: 'ok' },
    ])
  })

  it('keeps a failed result overriding its in-window head regardless of order', () => {
    const snapshot = snapshotWith([
      result(1, 'c1', 'edit', '{"file_path":"a.txt"}', true),
      assistant(2, 'c1', 'edit', '{"file_path":"a.txt"}'),
    ])
    // Error rank outranks ok even when the head node sorts after the result.
    expect(deriveModifiedFiles(snapshot, '/ws')).toEqual([
      { path: '/ws/a.txt', tool: 'edit', operation: 'update', time: 2001, seq: 1, state: 'error' },
    ])
  })

  it('lists still-running calls', () => {
    const snapshot = snapshotWith([], [running('c9', 'write', '{"file_path":"live.txt"}')])
    expect(deriveModifiedFiles(snapshot, '/ws')).toEqual([
      { path: '/ws/live.txt', tool: 'write', operation: 'update', time: 500, seq: Number.POSITIVE_INFINITY, state: 'running' },
    ])
  })

  it('dedupes a written-then-edited file to one entry carrying the later call', () => {
    const snapshot = snapshotWith([
      assistant(1, 'c1', 'write', '{"file_path":"same.txt"}'),
      assistant(2, 'c2', 'edit', '{"file_path":"same.txt"}'),
      assistant(3, 'c3', 'write', '{"file_path":"other.txt"}'),
    ])
    const derived = deriveModifiedFiles(snapshot, '/ws')
    expect(derived).toHaveLength(2)
    expect(derived[0]).toMatchObject({ path: '/ws/same.txt', tool: 'edit', state: 'ok' })
    expect(derived[1]).toMatchObject({ path: '/ws/other.txt', tool: 'write' })
  })

  it('resolves relative targets against the session cwd', () => {
    const snapshot = snapshotWith([assistant(1, 'c1', 'write', '{"file_path":"src/hello.ts"}')])
    expect(deriveModifiedFiles(snapshot, 'C:\\repo')[0]?.path).toBe('C:/repo/src/hello.ts')
  })
})

describe('mergeCallRecord', () => {
  const head = (callId: string, seq: number, path: string, extra?: Partial<CallRecord>): CallRecord => ({
    callId, path, tool: 'write', time: 1000 + seq, seq, state: 'ok', ...extra,
  })

  it('inserts new calls in first-seen order and keeps that order on overwrite', () => {
    const calls = new Map<string, CallRecord>()
    mergeCallRecord(calls, head('c1', 1, 'a.txt'))
    mergeCallRecord(calls, head('c2', 2, 'b.txt'))
    mergeCallRecord(calls, head('c1', 3, 'a.txt', { operation: 'create', state: 'ok' }))
    expect([...calls.keys()]).toEqual(['c1', 'c2'])
    expect(calls.get('c1')).toMatchObject({ seq: 3, operation: 'create' })
  })

  it('lets a later same-rank record win but keeps an earlier error', () => {
    const calls = new Map<string, CallRecord>()
    mergeCallRecord(calls, head('c1', 1, 'a.txt'))
    // Later ok (the settled result) supersedes the provisional head.
    mergeCallRecord(calls, head('c1', 2, 'a.txt', { operation: 'create' }))
    expect(calls.get('c1')).toMatchObject({ seq: 2, operation: 'create', state: 'ok' })
    // A fresh ok cannot un-seat an error, even at a later seq.
    const calls2 = new Map<string, CallRecord>()
    mergeCallRecord(calls2, head('c1', 2, 'a.txt', { state: 'error' }))
    mergeCallRecord(calls2, head('c1', 3, 'a.txt'))
    expect(calls2.get('c1')).toMatchObject({ seq: 2, state: 'error' })
  })

  it('lets a settled result supersede a running call', () => {
    const calls = new Map<string, CallRecord>()
    mergeCallRecord(calls, head('c9', 1, 'a.txt', { time: 500, seq: Number.POSITIVE_INFINITY, state: 'running' }))
    mergeCallRecord(calls, head('c9', 2, 'a.txt', { operation: 'create' }))
    expect(calls.get('c9')).toMatchObject({ seq: 2, state: 'ok', operation: 'create' })
  })
})

describe('projectModifiedFiles', () => {
  const record = (callId: string, seq: number, path: string, tool: string, state: 'ok' | 'error' = 'ok'): CallRecord => ({
    callId, path, tool, time: 1000 + seq, seq, state,
  })

  it('dedupes by path keeping first-seen position with the later call data', () => {
    const projected = projectModifiedFiles([
      record('c1', 1, '/ws/same.txt', 'write'),
      record('c2', 2, '/ws/same.txt', 'edit'),
      record('c3', 3, '/ws/other.txt', 'write'),
    ])
    expect(projected).toHaveLength(2)
    expect(projected[0]).toMatchObject({ path: '/ws/same.txt', tool: 'edit', seq: 2 })
    expect(projected[1]).toMatchObject({ path: '/ws/other.txt', tool: 'write', seq: 3 })
  })
})
