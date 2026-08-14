import { mkdtempSync, writeFileSync, mkdirSync, rmSync, realpathSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import LocalFileSystem from '@deepseek-ai/dsh-fs-local'
import { remoteMethods } from '@deepseek-ai/dsh-typert-protocol'
import WorkspaceFilesGateway, { READ_PREVIEW_BYTES, revealCommand, openCommand } from '../src/index.ts'

const contexts: Context[] = []
const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(contexts.splice(0).map(ctx => ctx.fiber.dispose()))
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function tempDir(): string {
  // The fs backend realpaths every target, so expectations compare against
  // the canonical path (the OS may hand mkdtemp a short 8.3 form).
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'workspace-files-')))
  tempRoots.push(root)
  return root
}

async function harness(root: string): Promise<{ ctx: Context; gateway: WorkspaceFilesGateway }> {
  const ctx = new Context()
  contexts.push(ctx)
  await ctx.plugin(LocalFileSystem, { cwd: root })
  await ctx.plugin(WorkspaceFilesGateway)
  const gateway = ctx.get('workspaceFiles') as WorkspaceFilesGateway
  return { ctx, gateway }
}

describe('WorkspaceFilesGateway', () => {
  it('publishes list/read/stat under the workspaceFiles namespace', async () => {
    const { gateway } = await harness(tempDir())
    expect(gateway.typertRemote).toMatchObject({
      serviceKey: 'workspaceFiles',
      namespace: 'workspaceFiles',
    })
    expect(remoteMethods(gateway)).toEqual([
      { method: 'list', invocation: { kind: 'direct' } },
      { method: 'read', invocation: { kind: 'direct' } },
      { method: 'stat', invocation: { kind: 'direct' } },
      { method: 'write', invocation: { kind: 'direct' } },
      { method: 'reveal', invocation: { kind: 'direct' } },
      { method: 'open', invocation: { kind: 'direct' } },
    ])
  })

  it('builds the platform reveal command without spawning anything', () => {
    expect(revealCommand('C:\\ws\\a.txt', 'win32')).toEqual({
      command: 'powershell.exe',
      args: ['-NoProfile', '-Command', "Explorer.exe '/select,C:\\ws\\a.txt'"],
    })
    // The whole argument is single-quoted so Explorer receives
    // `/select,<path>` as one argument even with spaces…
    expect(revealCommand('C:\\My Files\\a b.txt', 'win32')).toEqual({
      command: 'powershell.exe',
      args: ['-NoProfile', '-Command', "Explorer.exe '/select,C:\\My Files\\a b.txt'"],
    })
    // …and embedded single quotes double (PowerShell literal rules).
    expect(revealCommand("C:\\ws\\it's here.txt", 'win32')).toEqual({
      command: 'powershell.exe',
      args: ['-NoProfile', '-Command', "Explorer.exe '/select,C:\\ws\\it''s here.txt'"],
    })
    expect(revealCommand('/ws/a.txt', 'darwin')).toEqual({ command: 'open', args: ['-R', '/ws/a.txt'] })
    expect(revealCommand('/ws/a.txt', 'linux')).toEqual({ command: 'xdg-open', args: ['/ws'] })
    expect(() => revealCommand('/x', 'freebsd')).toThrow(/unsupported/)
  })

  it('builds the platform open command without spawning anything', () => {
    expect(openCommand('C:\\ws\\a.txt', 'win32')).toEqual({
      command: 'powershell.exe',
      args: ['-NoProfile', '-Command', "Start-Process -FilePath 'C:\\ws\\a.txt'"],
    })
    // Spaces survive: node passes the -Command script as one (quoted) argv
    // and the literal inside stays literal.
    expect(openCommand('C:\\My Files\\a b.txt', 'win32')).toEqual({
      command: 'powershell.exe',
      args: ['-NoProfile', '-Command', "Start-Process -FilePath 'C:\\My Files\\a b.txt'"],
    })
    expect(openCommand("C:\\ws\\it's here.txt", 'win32')).toEqual({
      command: 'powershell.exe',
      args: ['-NoProfile', '-Command', "Start-Process -FilePath 'C:\\ws\\it''s here.txt'"],
    })
    expect(openCommand('/ws/a.txt', 'darwin')).toEqual({ command: 'open', args: ['/ws/a.txt'] })
    expect(openCommand('/ws/a.txt', 'linux')).toEqual({ command: 'xdg-open', args: ['/ws/a.txt'] })
    expect(() => openCommand('/x', 'freebsd')).toThrow(/unsupported/)
  })

  it('creates and replaces files through write, and rejects directories', async () => {
    const root = tempDir()
    const { gateway } = await harness(root)

    const created = await gateway.write(join(root, 'fresh.txt'), 'hello')
    expect(created).toEqual({
      ok: true,
      value: { operation: 'create', path: join(root, 'fresh.txt'), byteLength: 5 },
    })
    expect(readFileSync(join(root, 'fresh.txt'), 'utf8')).toBe('hello')

    const replaced = await gateway.write(join(root, 'fresh.txt'), 'hello world')
    expect(replaced.ok && replaced.value.operation).toBe('update')
    expect(readFileSync(join(root, 'fresh.txt'), 'utf8')).toBe('hello world')

    mkdirSync(join(root, 'folder'))
    const dirWrite = await gateway.write(join(root, 'folder'), 'x')
    expect(dirWrite).toEqual({
      ok: false,
      error: { code: 'is-a-directory', path: join(root, 'folder') },
    })
  })

  it('lists one level with directories first, then files, each name-sorted', async () => {
    const root = tempDir()
    mkdirSync(join(root, 'src'))
    mkdirSync(join(root, 'zeta-dir'))
    writeFileSync(join(root, 'alpha.txt'), 'hello')
    writeFileSync(join(root, 'Beta.md'), 'world')
    writeFileSync(join(root, '.hidden'), 'secret')
    const { gateway } = await harness(root)

    const result = await gateway.list()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.root).toBe(root)
    expect(result.value.path).toBe(root)
    expect(result.value.entries.map(entry => entry.name)).toEqual([
      'src', 'zeta-dir', '.hidden', 'alpha.txt', 'Beta.md',
    ])
    const alpha = result.value.entries.find(entry => entry.name === 'alpha.txt')
    expect(alpha).toMatchObject({ kind: 'file', size: 5, hidden: false, path: join(root, 'alpha.txt') })
    const src = result.value.entries.find(entry => entry.name === 'src')
    expect(src).toMatchObject({ kind: 'directory', size: null })
    expect(result.value.entries.find(entry => entry.name === '.hidden')?.hidden).toBe(true)
    expect(result.value.truncated).toBe(false)
  })

  it('lists an explicit path and reports business failures', async () => {
    const root = tempDir()
    mkdirSync(join(root, 'sub'))
    writeFileSync(join(root, 'sub', 'note.txt'), 'x')
    const { gateway } = await harness(root)

    const sub = await gateway.list(join(root, 'sub'))
    expect(sub.ok && sub.value.entries.map(entry => entry.name)).toEqual(['note.txt'])

    const missing = await gateway.list(join(root, 'nope'))
    expect(missing).toEqual({ ok: false, error: { code: 'path-unavailable', path: join(root, 'nope') } })

    const notDir = await gateway.list(join(root, 'sub', 'note.txt'))
    expect(notDir).toEqual({ ok: false, error: { code: 'not-a-directory', path: join(root, 'sub', 'note.txt') } })
  })

  it('reads a bounded text preview and reports truncation without content', async () => {
    const root = tempDir()
    writeFileSync(join(root, 'small.txt'), 'hello preview')
    const big = Buffer.alloc(READ_PREVIEW_BYTES + 10, 0x61)
    writeFileSync(join(root, 'big.txt'), big)
    const { gateway } = await harness(root)

    const small = await gateway.read(join(root, 'small.txt'))
    expect(small).toEqual({
      ok: true,
      value: { content: 'hello preview', truncated: false, byteLength: 13 },
    })

    const bigRead = await gateway.read(join(root, 'big.txt'))
    expect(bigRead).toEqual({
      ok: true,
      value: { content: '', truncated: true, byteLength: READ_PREVIEW_BYTES + 10 },
    })
  })

  it('rejects directories, binary files, and missing paths on read', async () => {
    const root = tempDir()
    mkdirSync(join(root, 'folder'))
    writeFileSync(join(root, 'binary.bin'), Buffer.from([0xff, 0xfe, 0x00, 0x61]))
    const { gateway } = await harness(root)

    expect(await gateway.read(join(root, 'folder'))).toEqual({
      ok: false,
      error: { code: 'is-a-directory', path: join(root, 'folder') },
    })
    expect(await gateway.read(join(root, 'binary.bin'))).toEqual({
      ok: false,
      error: { code: 'not-a-text-file', path: join(root, 'binary.bin') },
    })
    expect(await gateway.read(join(root, 'ghost'))).toEqual({
      ok: false,
      error: { code: 'path-unavailable', path: join(root, 'ghost') },
    })
  })

  it('stats one path', async () => {
    const root = tempDir()
    writeFileSync(join(root, 'a.txt'), '12345')
    mkdirSync(join(root, 'd'))
    const { gateway } = await harness(root)

    expect(await gateway.stat(join(root, 'a.txt'))).toEqual({
      ok: true,
      value: { path: join(root, 'a.txt'), kind: 'file', size: 5 },
    })
    expect(await gateway.stat(join(root, 'd'))).toEqual({
      ok: true,
      value: { path: join(root, 'd'), kind: 'directory', size: null },
    })
    expect(await gateway.stat(join(root, 'ghost'))).toEqual({
      ok: false,
      error: { code: 'path-unavailable', path: join(root, 'ghost') },
    })
  })
})
