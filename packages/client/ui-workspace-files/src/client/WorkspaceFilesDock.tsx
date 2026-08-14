/**
 * Right-docked workspace explorer: the shell.overlay entry. A floating tab
 * opens a panel holding the file tree (or a preview / editor) above a
 * draggable divider and the modified-files list below. The panel stays
 * mounted while closed (display:none preserves React state) so the tree keeps
 * its loaded listings; width and split geometry are store state.
 */

import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  IconBrowseOutline16, IconCloseOutline16, IconSearchOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime, PropsStore, InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type { createWorkspaceFilesStore } from './store.ts'
import type { WorkspaceFilesInjected } from './slots.ts'
import type { NS } from './locales.ts'
import { FileTree } from './FileTree.tsx'
import { FilePreview } from './FilePreview.tsx'
import { ModifiedFilesList } from './ModifiedFilesList.tsx'
import type { FileRowActionsFace } from './FileRowActions.tsx'
import css from './WorkspaceFilesDock.module.css'

/** Full composed props: runtime share + store share + injected face + locale seat. */
export type WorkspaceFilesDockProps =
  & PropsRuntime<'shell.overlay'>
  & PropsStore<ReturnType<typeof createWorkspaceFilesStore>>
  & InjectFace<WorkspaceFilesInjected>
  & PropsLocale<typeof NS>

export function WorkspaceFilesDock({
  useStore, actions, useHostDescription, useModifiedFiles, useSessions, t, isLoopback,
  list, read, open, reveal, addToComposer,
}: WorkspaceFilesDockProps) {
  const state = useStore(s => s)
  const modified = useModifiedFiles(files => files)
  const cwd = useHostDescription(description => description?.cwd ?? null)
  const hostCanOpenPath = useHostDescription(description => description?.canOpenPath === true)
  const canOpenPath = isLoopback && hostCanOpenPath
  const hasSession = useSessions(s => s.current !== undefined)

  const bodyRef = useRef<HTMLDivElement>(null)

  // Transient notice line: auto-dismiss a few seconds after it appears.
  useEffect(() => {
    if (state.notice === null) return
    const id = window.setTimeout(() => { actions.setNotice(null) }, 4000)
    return () => { window.clearTimeout(id) }
  }, [state.notice, actions])

  const revealInTree = useCallback((path: string): void => {
    actions.expandPath(path)
    actions.setPreview(path)
  }, [actions])

  /** The shared row-level verb set (failures surface as a notice line). */
  const rowActions = useCallback((): FileRowActionsFace => ({
    open: (path) => {
      void open(path).catch(() => { actions.setNotice(t('row.openFailed')) })
    },
    openFolder: (path) => {
      void reveal(path).catch(() => { actions.setNotice(t('row.openFailed')) })
    },
    attach: (path) => {
      void addToComposer(path).then((result) => {
        actions.setNotice(result.ok
          ? t('row.addedToInput')
          : t('row.attachNoSession'))
      })
    },
  }), [open, reveal, addToComposer, actions, t])

  // The modified list recomputes from the archive point when one is set.
  const archiveSeq = state.archiveSeq
  const visibleModified = archiveSeq === null
    ? modified
    : modified.filter(file => file.seq > archiveSeq)

  const archiveNow = useCallback((): void => {
    actions.archive(modified)
    actions.setNotice(t('modified.archived'))
  }, [actions, modified, t])

  // Dock width: the left-edge handle widens the dock as it moves left.
  const onWidthPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const startX = event.clientX
    const startWidth = state.width
    const move = (moveEvent: PointerEvent): void => {
      actions.setWidth(startWidth + (startX - moveEvent.clientX))
    }
    const up = (): void => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [state.width, actions])

  // Vertical split: the divider row reports the top ratio inside the body.
  const onSplitPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const body = bodyRef.current
    if (body === null) return
    const rect = body.getBoundingClientRect()
    const startTop = event.clientY - rect.top
    const height = rect.height
    const move = (moveEvent: PointerEvent): void => {
      if (height <= 0) return
      const ratio = (startTop + (moveEvent.clientY - event.clientY)) / height
      actions.setSplit(ratio)
    }
    const up = (): void => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [actions])

  const splitPx = Math.round(state.split * 100)
  const showPreview = state.preview !== null
  const face = rowActions()

  return (
    <div
      className={css.root}
      data-open={state.open || undefined}
      style={state.open ? { width: state.width } : undefined}
    >
      {!state.open && (
        <button
          type="button"
          className={css.tab}
          onClick={() => { actions.setOpen(true) }}
          aria-label={t('dock.toggle')}
          title={t('dock.toggle')}
        >
          <IconBrowseOutline16 size={18} />
        </button>
      )}
      <div className={css.panel} data-open={state.open || undefined}>
        <div className={css.header}>
          <span className={css.title}>{t('panel.title')}</span>
          <span className={css.search}>
            <IconSearchOutline16 className={css.searchIcon} />
            <input
              className={css.filter}
              value={state.filter}
              placeholder={t('tree.filter')}
              aria-label={t('tree.filter')}
              onChange={(event) => { actions.setFilter(event.currentTarget.value) }}
            />
          </span>
          <button
            type="button"
            className={css.pill}
            data-active={state.showHidden || undefined}
            onClick={() => { actions.toggleShowHidden() }}
            title={t('tree.showHidden')}
            aria-pressed={state.showHidden}
          >
            {t('tree.showHidden')}
          </button>
          <button
            type="button"
            className={css.pill}
            onClick={() => { actions.collapseAll() }}
            title={t('tree.collapseAll')}
          >
            {t('tree.collapseAll')}
          </button>
          <button
            type="button"
            className={css.iconBtn}
            onClick={() => { actions.setOpen(false) }}
            title={t('panel.close')}
            aria-label={t('panel.close')}
          >
            <IconCloseOutline16 />
          </button>
        </div>
        <div
          ref={bodyRef}
          className={css.body}
          style={{ gridTemplateRows: `${splitPx}fr 4px ${100 - splitPx}fr` }}
        >
          <div className={css.upper} data-workspace-files="tree">
            {showPreview
              ? (
                <FilePreview
                  path={state.preview as string}
                  canOpenPath={canOpenPath}
                  onBack={() => { actions.setPreview(null) }}
                  onOpen={(path) => { face.open(path) }}
                  rowActions={{ path: state.preview as string, ...face }}
                  read={read}
                  t={t}
                />
              )
              : (
                  <FileTree
                    root={cwd}
                    showHidden={state.showHidden}
                    filter={state.filter}
                    expanded={state.expanded}
                    selected={state.selected}
                    onToggleExpanded={(path) => { actions.toggleExpanded(path) }}
                    onSelect={(path) => { actions.select(path) }}
                    onPreview={(path) => { actions.setPreview(path) }}
                    rowActions={face}
                    list={list}
                    t={t}
                  />
                )}
          </div>
          <div className={css.divider} role="separator" aria-orientation="horizontal" onPointerDown={onSplitPointerDown} />
          <div className={css.lower} data-workspace-files="modified">
            <div className={css.sectionHeader}>
              <span className={css.sectionTitle}>{t('modified.title')}</span>
              {visibleModified.length > 0 && <span className={css.count}>{visibleModified.length}</span>}
              <button
                type="button"
                className={css.pill}
                data-active={state.archiveSeq !== null || undefined}
                onClick={archiveNow}
                title={t('modified.archiveHint')}
              >
                {t('modified.archive')}
              </button>
            </div>
            <ModifiedFilesList files={visibleModified} hasSession={hasSession} archived={state.archiveSeq !== null} onReveal={revealInTree} rowActions={face} t={t} />
          </div>
        </div>
        {state.notice !== null && <div className={css.notice} role="status">{state.notice}</div>}
      </div>
      {state.open && <div className={css.widthHandle} role="separator" aria-orientation="vertical" onPointerDown={onWidthPointerDown} />}
    </div>
  )
}
