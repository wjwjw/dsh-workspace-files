/**
 * The Reactive source behind the dock's modified list: it follows the
 * current session selection and that session's conversation snapshot, and
 * republishes an immutable derived list on every change (node environment —
 * the source is pure data-layer, no render machinery). Window retention: a
 * file whose events leave the window stays listed until the session changes.
 */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { TestSessions } from '@deepseek-ai/dsh-client-test-runtime'
import type {
  AssistantMessageNode, RunningToolCall, ToolResultNode,
} from '@deepseek-ai/dsh-client-runtime/client'
import { createModifiedFilesSource } from '../src/client/modified-files.ts'

const stabilize = async (fn: () => void | Promise<void>): Promise<void> => { await fn() }

function assistant(seq: number, callId: string, name: string, argsRaw: string): AssistantMessageNode {
  return {
    kind: 'assistant', seq, time: 1000 + seq, turn: 1, step: 1,
    blocks: [{ kind: 'tool-call', callId, name, argsRaw }],
  }
}

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

/** A settled tool result whose call head was truncated out of the window (`call: null`). */
function lostHeadResult(seq: number, callId: string, isError = false): ToolResultNode {
  return {
    kind: 'tool-result', seq, time: 2000 + seq, callId,
    call: null, callTime: 1500 + seq, content: [], isError,
    callView: null, resultView: null, subCalls: [],
  }
}

describe('createModifiedFilesSource', () => {
  it('publishes the current session list and retains files across window changes', async () => {
    const ctx = new Context()
    const sessions = new TestSessions(stabilize, ctx)
    const source = createModifiedFilesSource(sessions)

    expect(source.getSnapshot()).toEqual([])

    await sessions.add({
      id: 's1',
      snapshot: { nodes: [assistant(1, 'c1', 'write', '{"file_path":"a.txt"}')] },
      summary: { cwd: '/ws' },
    })
    expect(source.getSnapshot()).toEqual([
      { path: '/ws/a.txt', tool: 'write', operation: 'update', time: 1001, seq: 1, state: 'ok' },
    ])

    // Window replacement: c1's events fall out of the window (truncation /
    // reconnect), a newer call lands. The earlier file stays listed.
    await sessions.updateSnapshot('s1', (draft) => {
      draft.nodes = [assistant(2, 'c2', 'edit', '{"file_path":"b.txt"}')]
    })
    expect(source.getSnapshot()).toEqual([
      { path: '/ws/a.txt', tool: 'write', operation: 'update', time: 1001, seq: 1, state: 'ok' },
      { path: '/ws/b.txt', tool: 'edit', operation: 'update', time: 1002, seq: 2, state: 'ok' },
    ])

    await sessions.setCurrent(undefined)
    expect(source.getSnapshot()).toEqual([])
  })

  it('resets the retained table when the selection switches to another session', async () => {
    const ctx = new Context()
    const sessions = new TestSessions(stabilize, ctx)
    const source = createModifiedFilesSource(sessions)

    await sessions.add({
      id: 's1',
      snapshot: { nodes: [assistant(1, 'c1', 'write', '{"file_path":"a.txt"}')] },
      summary: { cwd: '/ws' },
    })
    await sessions.add({
      id: 's2',
      snapshot: { nodes: [assistant(3, 'c3', 'write', '{"file_path":"c.txt"}')] },
      summary: { cwd: '/ws' },
    })
    expect(source.getSnapshot()).toEqual([
      { path: '/ws/c.txt', tool: 'write', operation: 'update', time: 1003, seq: 3, state: 'ok' },
    ])

    await sessions.setCurrent('s1')
    expect(source.getSnapshot()).toEqual([
      { path: '/ws/a.txt', tool: 'write', operation: 'update', time: 1001, seq: 1, state: 'ok' },
    ])
  })

  it('updates a retained running call when its settlement lands in a later window', async () => {
    const ctx = new Context()
    const sessions = new TestSessions(stabilize, ctx)
    const source = createModifiedFilesSource(sessions)

    await sessions.add({
      id: 's1',
      snapshot: { nodes: [], runningCalls: [running('c9', 'write', '{"file_path":"live.txt"}')] },
      summary: { cwd: '/ws' },
    })
    expect(source.getSnapshot()).toEqual([
      { path: '/ws/live.txt', tool: 'write', operation: 'update', time: 500, seq: Number.POSITIVE_INFINITY, state: 'running' },
    ])

    // The call settles; the new window carries only the settled result.
    await sessions.updateSnapshot('s1', (draft) => {
      draft.nodes = [result(2, 'c9', 'write', '{"file_path":"live.txt"}', false, { diffs: [] })]
      draft.runningCalls = []
    })
    expect(source.getSnapshot()).toEqual([
      { path: '/ws/live.txt', tool: 'write', operation: 'create', time: 2002, seq: 2, state: 'ok' },
    ])
  })

  it('settles a retained call whose result arrives without its head in the window', async () => {
    const ctx = new Context()
    const sessions = new TestSessions(stabilize, ctx)
    const source = createModifiedFilesSource(sessions)

    await sessions.add({
      id: 's1',
      snapshot: { nodes: [], runningCalls: [running('c9', 'write', '{"file_path":"live.txt"}')] },
      summary: { cwd: '/ws' },
    })
    expect(source.getSnapshot()).toEqual([
      { path: '/ws/live.txt', tool: 'write', operation: 'update', time: 500, seq: Number.POSITIVE_INFINITY, state: 'running' },
    ])

    // The call settles, but its head was truncated out of the window: the
    // result node carries no call face. The hint pass still settles the
    // retained record via callId, keeping the path the head contributed.
    await sessions.updateSnapshot('s1', (draft) => {
      draft.nodes = [lostHeadResult(2, 'c9')]
      draft.runningCalls = []
    })
    expect(source.getSnapshot()).toEqual([
      { path: '/ws/live.txt', tool: 'write', operation: 'update', time: 2002, seq: 2, state: 'ok' },
    ])
  })

  it('notifies subscribers on republish and stops after unsubscribe', async () => {
    const ctx = new Context()
    const sessions = new TestSessions(stabilize, ctx)
    const source = createModifiedFilesSource(sessions)
    const seen: string[][] = []
    const unsubscribe = source.subscribe(() => { seen.push(source.getSnapshot().map(file => file.path)) })

    await sessions.add({ id: 's2', snapshot: { nodes: [assistant(1, 'c1', 'write', '{"file_path":"x.txt"}')] } })
    expect(seen).toEqual([['x.txt']])

    unsubscribe()
    await sessions.updateSnapshot('s2', (draft) => {
      draft.nodes = [assistant(2, 'c2', 'edit', '{"file_path":"y.txt"}')]
    })
    expect(seen).toEqual([['x.txt']])
    // No root-fiber dispose here: the vitest invariant host joins the agent
    // scope plugin to its readiness chain, and disposing the root mid-chain
    // would retire the mounted companion before it activates.
  })
})
