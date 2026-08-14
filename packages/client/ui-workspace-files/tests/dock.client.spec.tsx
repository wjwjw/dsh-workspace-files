// @vitest-environment jsdom
/**
 * WorkspaceFilesDock rendering and interaction: the toggle tab, the lazy
 * tree (root load, expand, preview, error retry), and the modified-list
 * reveal. Component specs feed props directly — a real store instance plus
 * stubbed framework hooks (web client AGENTS.md: no render machinery). The
 * store stub is a static read, so store-mutating gestures are followed by an
 * explicit rerender; jsdom applies no CSS, so panel visibility is asserted
 * through the data attributes rather than computed styles.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import type { HostDescription } from '@deepseek-ai/dsh-client-connection/client'
import type { SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import type { WorkspaceFileListing, WorkspaceFileReadResult } from '@deepseek-ai/dsh-host-workspace-files/types'
import { zh } from '../src/client/locales.ts'
import { createWorkspaceFilesStore } from '../src/client/store.ts'
import type { WorkspaceFilesState } from '../src/client/store.ts'
import type { ModifiedFile } from '../src/client/modified-files.ts'
import { WorkspaceFilesDock, type WorkspaceFilesDockProps } from '../src/client/WorkspaceFilesDock.tsx'

afterEach(cleanup)

const ROOT = '/ws'

function listing(path: string, entries: WorkspaceFileListing['entries']): WorkspaceFileListing {
  return { path, root: ROOT, truncated: false, entries }
}

function makeDock(overrides: {
  files?: readonly ModifiedFile[]
  list?: (path: string) => Promise<{ ok: true; value: WorkspaceFileListing } | { ok: false; error: { code: string } }>
  read?: (path: string, signal: AbortSignal) => Promise<WorkspaceFileReadResult>
  hostDescription?: HostDescription
  hasSession?: boolean
} = {}) {
  const instance = createWorkspaceFilesStore().create()
  const t = makeTranslate(zh)
  const list = overrides.list ?? vi.fn(async (path: string) => {
    if (path === ROOT) {
      return { ok: true, value: listing(ROOT, [
        { name: 'src', path: `${ROOT}/src`, kind: 'directory', size: null, hidden: false },
        { name: 'a.txt', path: `${ROOT}/a.txt`, kind: 'file', size: 5, hidden: false },
        { name: '.secret', path: `${ROOT}/.secret`, kind: 'file', size: 9, hidden: true },
      ]) }
    }
    return { ok: true, value: listing(path, [
      { name: 'b.ts', path: `${path}/b.ts`, kind: 'file', size: 10, hidden: false },
    ]) }
  })
  const read = overrides.read ?? vi.fn(
    async (_path: string, _signal: AbortSignal): Promise<WorkspaceFileReadResult> =>
      ({ ok: true, value: { content: 'hello preview', truncated: false, byteLength: 13 } }),
  )
  const reveal = vi.fn(async () => {})
  const addToComposer = vi.fn(async () => ({ ok: true }))
  const open = vi.fn(async () => {})
  const hostDescription = overrides.hostDescription ?? { version: '1', cwd: ROOT, attachedSessions: 0, canOpenPath: true }
  const files = overrides.files ?? [{ path: `${ROOT}/a.txt`, tool: 'write', operation: 'create', time: 1000, seq: 5, state: 'ok' } as const]
  const props = {
    useStore: (selector: (state: WorkspaceFilesState) => unknown) => selector(instance.getSnapshot()),
    actions: instance.actions,
    useHostDescription: (selector: (description: HostDescription | undefined) => unknown) => selector(hostDescription),
    useModifiedFiles: (selector: (files: readonly ModifiedFile[]) => unknown) => selector(files),
    useSessions: (selector: (state: SessionListState) => unknown) =>
      selector({ current: overrides.hasSession === false ? undefined : 's1' } as unknown as SessionListState),
    isLoopback: true,
    list,
    read,
    reveal,
    addToComposer,
    open,
    t,
  } as unknown as WorkspaceFilesDockProps
  return { instance, props, list, read, reveal, addToComposer, open, t }
}

/** Render the dock and scope tree/modified queries to their sections. */
function renderDock(overrides?: Parameters<typeof makeDock>[0]) {
  const harness = makeDock(overrides)
  const view = render(<WorkspaceFilesDock {...harness.props} />)
  const tree = () => within(view.container.querySelector('[data-workspace-files="tree"]') as HTMLElement)
  const modified = () => within(view.container.querySelector('[data-workspace-files="modified"]') as HTMLElement)
  const rerender = () => view.rerender(<WorkspaceFilesDock {...harness.props} />)
  return { ...harness, view, tree, modified, rerender }
}

/** Open the dock and reflect the store change with a rerender. */
function openDock(harness: ReturnType<typeof renderDock>) {
  fireEvent.click(screen.getByRole('button', { name: '打开文件浏览器' }))
  harness.rerender()
}

describe('WorkspaceFilesDock', () => {
  it('starts closed with only the toggle tab and opens the panel on click', () => {
    const h = renderDock()
    expect(h.view.container.querySelector('[data-open]')).toBeNull()
    expect(screen.getByRole('button', { name: '打开文件浏览器' })).toBeTruthy()

    openDock(h)
    expect(h.view.container.querySelector('[data-open]')).not.toBeNull()
    expect(screen.queryByRole('button', { name: '打开文件浏览器' })).toBeNull()
    expect(screen.getByRole('button', { name: '关闭文件浏览器' })).toBeTruthy()
  })

  it('loads the workspace root lazily and expands directories on demand', async () => {
    const h = renderDock()
    openDock(h)
    await h.tree().findByText('a.txt')
    expect(h.list).toHaveBeenCalledWith(ROOT, expect.anything())
    expect(h.tree().getByText(ROOT)).toBeTruthy()
    expect(h.tree().queryByText('b.ts')).toBeNull()

    fireEvent.click(h.tree().getByText('src'))
    h.rerender()
    await h.tree().findByText('b.ts')
    expect(h.list).toHaveBeenCalledWith(`${ROOT}/src`, expect.anything())
  })

  it('hides dot-entries until the hidden toggle is pressed', async () => {
    const h = renderDock()
    openDock(h)
    await h.tree().findByText('a.txt')
    expect(h.tree().queryByText('.secret')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '显示隐藏文件' }))
    h.rerender()
    expect(h.tree().getByText('.secret')).toBeTruthy()
  })

  it('previews a clicked file and returns to the tree', async () => {
    const h = renderDock()
    openDock(h)
    await h.tree().findByText('a.txt')

    fireEvent.click(h.tree().getByText('a.txt'))
    h.rerender()
    await screen.findByText('hello preview')
    expect(h.read).toHaveBeenCalledWith(`${ROOT}/a.txt`, expect.anything())
    expect(screen.getByRole('button', { name: '返回文件树' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '返回文件树' }))
    h.rerender()
    await h.tree().findByText('src')
  })

  it('renders the modified-files list and reveals a row in the tree', async () => {
    const h = renderDock()
    openDock(h)
    expect(h.modified().getByText('a.txt')).toBeTruthy()
    expect(h.modified().getByText('新增')).toBeTruthy()

    fireEvent.click(h.modified().getByText('a.txt'))
    h.rerender()
    await waitFor(() => {
      expect(h.instance.getSnapshot().expanded[ROOT]).toBe(true)
    })
    expect(h.instance.getSnapshot().preview).toBe(`${ROOT}/a.txt`)
    await screen.findByText('hello preview')
  })

  it('shows a retryable error when a directory cannot be listed', async () => {
    const list = vi.fn(async () => ({ ok: false, error: { code: 'path-unavailable' } }))
    const h = renderDock({ list: list as never })
    openDock(h)
    await screen.findByText('重试')
    const unreadable = h.tree().getByText(/无法读取/)
    expect(unreadable.textContent).toContain(ROOT)
  })

  it('filters the loaded tree to matching entries', async () => {
    const h = renderDock()
    openDock(h)
    await h.tree().findByText('a.txt')

    const input = screen.getByRole('textbox', { name: '筛选当前已加载的文件…' })
    fireEvent.change(input, { target: { value: 'src' } })
    h.rerender()
    expect(h.tree().getByText('src')).toBeTruthy()
    expect(h.tree().queryByText('a.txt')).toBeNull()
  })

  it('opens the file in the system from the row action menu', async () => {
    const h = renderDock()
    openDock(h)
    await h.tree().findByText('a.txt')

    fireEvent.click(h.tree().getByRole('button', { name: '更多操作' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: '在系统中打开' }))
    await waitFor(() => {
      expect(h.open).toHaveBeenCalledWith(`${ROOT}/a.txt`)
    })
  })

  it('reveals the containing folder from the row action menu', async () => {
    const h = renderDock()
    openDock(h)
    await h.tree().findByText('a.txt')

    fireEvent.click(h.tree().getByRole('button', { name: '更多操作' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: '打开所在文件夹' }))
    await waitFor(() => {
      expect(h.reveal).toHaveBeenCalledWith(`${ROOT}/a.txt`)
    })
  })

  it('adds the file name to the composer from the row action menu', async () => {
    const h = renderDock()
    openDock(h)
    await h.tree().findByText('a.txt')

    fireEvent.click(h.tree().getByRole('button', { name: '更多操作' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: '加到对话中' }))
    await waitFor(() => {
      expect(h.addToComposer).toHaveBeenCalledWith(`${ROOT}/a.txt`)
    })
    // The notice lands in the store; a render reflects it.
    h.rerender()
    await screen.findByText('已把文件名加入输入框')
  })

  it('archives the modified list and recomputes it from that moment', async () => {
    // Two modified files at different conversation positions.
    const files = [
      { path: `${ROOT}/old.txt`, tool: 'write', operation: 'create' as const, time: 1000, seq: 5, state: 'ok' as const },
      { path: `${ROOT}/new.txt`, tool: 'edit', operation: 'update' as const, time: 2000, seq: 10, state: 'ok' as const },
    ]
    const h = renderDock({ files })
    openDock(h)
    expect(h.modified().getByText('old.txt')).toBeTruthy()
    expect(h.modified().getByText('new.txt')).toBeTruthy()

    // Archive at the current end (seq 10): only later modifications remain.
    fireEvent.click(screen.getByRole('button', { name: '存档' }))
    h.rerender()
    expect(h.instance.getSnapshot().archiveSeq).toBe(10)
    await screen.findByText('已存档，列表从此刻重新计算')
    expect(h.modified().queryByText('old.txt')).toBeNull()
    expect(h.modified().queryByText('new.txt')).toBeNull()

    // A file modified after the archive appears again.
    const later = [
      { path: `${ROOT}/old.txt`, tool: 'write', operation: 'create' as const, time: 1000, seq: 5, state: 'ok' as const },
      { path: `${ROOT}/new.txt`, tool: 'edit', operation: 'update' as const, time: 2000, seq: 10, state: 'ok' as const },
      { path: `${ROOT}/later.txt`, tool: 'write', operation: 'create' as const, time: 3000, seq: 15, state: 'ok' as const },
    ]
    h.props.useModifiedFiles = ((selector: (files: readonly ModifiedFile[]) => unknown) => selector(later)) as never
    h.rerender()
    expect(h.modified().getByText('later.txt')).toBeTruthy()
    expect(h.modified().queryByText('new.txt')).toBeNull()
  })
})

describe('WorkspaceFilesDock without a session', () => {
  it('shows the no-session empty copy in the modified section', () => {
    const h = renderDock({ hasSession: false })
    openDock(h)
    expect(h.modified().getByText('打开一个会话后显示其修改的文件')).toBeTruthy()
  })
})
