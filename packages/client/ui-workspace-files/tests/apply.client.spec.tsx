// @vitest-environment jsdom
/**
 * ui-workspace-files browser half on a real cordis Context with fake
 * connection/remote/sessions faces: the plugin registers the shell.overlay
 * dock entry with its store, locale seat, and injected face (hostDescription
 * + modifiedFiles hooks, list/read/openPath verbs), and registration removal
 * rides the plugin fiber (HMR safety).
 */
import { Context, Service } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { TestSessions } from '@deepseek-ai/dsh-client-test-runtime'
import type { WorkspaceFilesInjected } from '../src/client/slots.ts'
import { apply, inject } from '../src/client/index.ts'

const stabilize = async (fn: () => void | Promise<void>): Promise<void> => { await fn() }

function hostDescriptionSource() {
  const listeners = new Set<() => void>()
  let value: { version: string; cwd: string; attachedSessions: number; canOpenPath: boolean } | undefined
    = { version: '1', cwd: '/ws', attachedSessions: 0, canOpenPath: true }
  return {
    getSnapshot: () => value,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

async function bench(declare = true) {
  const ctx = new Context()
  const calls: { method: string; args: unknown[] }[] = []
  const connection = {
    isLoopback: true,
    hostDescription: hostDescriptionSource(),
  }
  const workspaceFiles = {
    list: vi.fn(async (...args: unknown[]) => { calls.push({ method: 'list', args }); return { ok: true, value: { path: '/ws', root: '/ws', truncated: false, entries: [] } } }),
    read: vi.fn(async (...args: unknown[]) => { calls.push({ method: 'read', args }); return { ok: true, value: { content: 'x', truncated: false, byteLength: 1 } } }),
    open: vi.fn(async (...args: unknown[]) => { calls.push({ method: 'open', args }); return { ok: true, value: { ok: true, value: { path: '/ws/a.txt' } } } }),
    reveal: vi.fn(async (...args: unknown[]) => { calls.push({ method: 'reveal', args }); return { ok: true, value: { ok: true, value: { path: '/ws/a.txt' } } } }),
    stat: vi.fn(async (...args: unknown[]) => { calls.push({ method: 'stat', args }); return { ok: true, value: { path: '/ws', kind: 'directory', size: null } } }),
  }
  // The client apply self-mounts the workspace-files Remote onto the shared
  // `remote` service; stub $mount as a no-op (returning a disposer) and keep
  // the fake namespace provided directly, so the verbs under test still reach
  // the fake.
  const mountRemote = vi.fn(async () => () => {})
  class RemoteService extends Service {
    constructor(serviceCtx: Context) {
      super(serviceCtx, 'remote')
      this.$mount = mountRemote
    }
  }
  new RemoteService(ctx)
  ctx.provide('remote.workspaceFiles', workspaceFiles)
  await ctx.plugin(SlotRegistry).await()
  const sessions = new TestSessions(stabilize, ctx)
  ctx.provide('sessions', sessions)
  // The conversation service face: the composer input the attach verb writes.
  const setDraft = vi.fn()
  const conversation = {
    input: { for: () => ({ state: { getSnapshot: () => ({ draft: '' }) }, setDraft }) },
  }
  ctx.provide('conversation', conversation)
  ctx.provide('connection', connection)
  ctx.provide('locale', new LocaleRuntime(ctx))
  const slots = ctx.get('slots') as SlotRegistry
  if (declare) {
    slots.register(
      { name: 'root', children: { 'shell.overlay': { kind: 'list', scope: 'root' } } } as never,
      () => null,
    )
  }
  const fiber = ctx.plugin({ inject: [...inject], apply })
  return {
    ctx, fiber, slots, sessions, workspaceFiles, conversation, setDraft, connection, mountRemote,
    entry: () => slots.entries('shell.overlay')[0],
  }
}

afterEach(() => { cleanupCtxs() })
const ctxs: Context[] = []
function cleanupCtxs() {
  void Promise.all(ctxs.splice(0).map(ctx => ctx.fiber.dispose()))
}

describe('ui-workspace-files apply', () => {
  it('declares only the services it uses', () => {
    // `remote.workspaceFiles` must NOT appear: the apply mounts it itself.
    expect(inject).toEqual(['slots', 'locale', 'connection', 'sessions', 'conversation', 'remote'])
  })

  it('registers the shell.overlay dock entry with store, locale, and injected face', async () => {
    const b = await bench()
    ctxs.push(b.ctx)
    await b.fiber.await()
    const entry = b.entry()
    expect(entry).toBeDefined()
    if (entry === undefined) return
    expect(entry.locale).toBe('workspace-files')
    expect(entry.store).toBeDefined()
    // The apply self-mounts the Remote namespace onto the shared service.
    expect(b.mountRemote).toHaveBeenCalledTimes(1)
    const face = entry.inject as unknown as () => WorkspaceFilesInjected
    const injected = face()
    expect(Object.keys(injected.hooks)).toEqual(['hostDescription', 'modifiedFiles'])
    expect(typeof injected.list).toBe('function')
    expect(typeof injected.read).toBe('function')
    expect(typeof injected.open).toBe('function')
    expect(typeof injected.reveal).toBe('function')
    expect(typeof injected.addToComposer).toBe('function')

    // The verbs reach the Remote namespace.
    await injected.list('/ws', new AbortController().signal)
    expect(b.workspaceFiles.list).toHaveBeenCalledWith('/ws', expect.anything())
    await injected.read('/ws/a.txt', new AbortController().signal)
    expect(b.workspaceFiles.read).toHaveBeenCalledWith('/ws/a.txt', expect.anything())
    await injected.open('/ws/a.txt')
    expect(b.workspaceFiles.open).toHaveBeenCalledWith('/ws/a.txt', expect.anything())
    await injected.reveal('/ws/a.txt')
    expect(b.workspaceFiles.reveal).toHaveBeenCalledWith('/ws/a.txt', expect.anything())

    // Adding the name without a session answers no-session without touching
    // the composer.
    const attach = await injected.addToComposer('/ws/a.txt')
    expect(attach).toEqual({ ok: false, error: { code: 'no-session', message: 'no current session' } })
  })

  it('inserts the file name into the current session composer', async () => {
    const b = await bench()
    ctxs.push(b.ctx)
    await b.fiber.await()
    await b.sessions.add({ id: 's1' })
    const entry = b.entry()
    if (entry === undefined) throw new Error('entry missing')
    const injected = (entry.inject as unknown as () => WorkspaceFilesInjected)()

    const result = await injected.addToComposer('/ws/a.txt')
    expect(result).toEqual({ ok: true })
    expect(b.setDraft).toHaveBeenCalledWith('a.txt')
  })

  it('waits for the shell.overlay declaration instead of registering into an undeclared slot', async () => {
    const b = await bench(false)
    ctxs.push(b.ctx)
    const fiber = b.fiber
    await fiber.await()
    // slots.inject is the waiting form: no declaration, no entry.
    expect(b.entry()).toBeUndefined()

    // A later declaration reconciles the contribution in.
    b.slots.register(
      { name: 'root', children: { 'shell.overlay': { kind: 'list', scope: 'root' } } } as never,
      () => null,
    )
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(b.entry()).toBeDefined()
  })

  it('removes the entry on teardown', async () => {
    const b = await bench()
    ctxs.push(b.ctx)
    const fiber = b.fiber
    await fiber.await()
    expect(b.entry()).toBeDefined()
    await fiber.dispose()
    expect(b.entry()).toBeUndefined()
  })
})
