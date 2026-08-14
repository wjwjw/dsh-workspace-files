/**
 * Lazy file tree over the workspace-files Remote. Directories expand on
 * demand (one `list` call per expanded level, cached in component-local
 * state — only the tree knows its loaded listings), hidden rows follow the
 * store toggle, and a non-blank filter swaps the tree for a flat list of
 * matching loaded entries. Pure component: every external fact arrives
 * through props; the listing cache is the tree's own private state.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  IconChevronDownOutline14, IconChevronRightOutline14, IconFolderClose16,
  IconFolderOpenOutline16, IconRefreshOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  WorkspaceFileEntry, WorkspaceFileListing, WorkspaceFilesFailure,
} from '@deepseek-ai/dsh-host-workspace-files/types'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import { FileRowActions } from './FileRowActions.tsx'
import type { FileRowActionsFace } from './FileRowActions.tsx'
import { formatBytes } from './format.ts'
import css from './FileTree.module.css'

/** The tree's own loading/error bookkeeping per directory path. */
interface FileTreeProps {
  /** Explorer root (the Host working directory); null while unknown. */
  root: string | null
  showHidden: boolean
  /** Non-blank switches to the flat filter view over loaded listings. */
  filter: string
  expanded: Readonly<Record<string, boolean>>
  selected: string | null
  onToggleExpanded: (path: string) => void
  onSelect: (path: string) => void
  onPreview: (path: string) => void
  rowActions: FileRowActionsFace
  list: (path: string, signal: AbortSignal) => Promise<{ ok: true; value: WorkspaceFileListing } | { ok: false; error: WorkspaceFilesFailure }>
  t: TranslateNS<typeof NS>
}

export function FileTree(props: FileTreeProps) {
  const { root, showHidden, filter, expanded, selected, onToggleExpanded, onSelect, onPreview, rowActions, list, t } = props
  const [levels, setLevels] = useState<ReadonlyMap<string, WorkspaceFileListing>>(() => new Map())
  const [loading, setLoading] = useState<ReadonlySet<string>>(() => new Set())
  const [errors, setErrors] = useState<ReadonlyMap<string, WorkspaceFilesFailure>>(() => new Map())
  const [generation, setGeneration] = useState(0)

  // Refs mirror the state so async callbacks never act on a stale closure.
  const levelsRef = useRef(levels)
  const loadingRef = useRef(loading)
  const errorsRef = useRef(errors)
  levelsRef.current = levels
  loadingRef.current = loading
  errorsRef.current = errors

  const load = useCallback((path: string): void => {
    if (levelsRef.current.has(path) || loadingRef.current.has(path)) return
    const loadingNext = new Set(loadingRef.current)
    loadingNext.add(path)
    loadingRef.current = loadingNext
    setLoading(loadingNext)
    list(path, new AbortController().signal).then((result) => {
      const afterLoad = new Set(loadingRef.current)
      afterLoad.delete(path)
      loadingRef.current = afterLoad
      setLoading(afterLoad)
      if (result.ok) {
        levelsRef.current = new Map(levelsRef.current).set(path, result.value)
        setLevels(levelsRef.current)
      } else {
        errorsRef.current = new Map(errorsRef.current).set(path, result.error)
        setErrors(errorsRef.current)
      }
    }).catch(() => {
      // Aborted reads (refresh or unmount) leave no error behind.
      const afterAbort = new Set(loadingRef.current)
      afterAbort.delete(path)
      loadingRef.current = afterAbort
      setLoading(afterAbort)
    })
  }, [list])

  const resetAll = useCallback((): void => {
    levelsRef.current = new Map()
    loadingRef.current = new Set()
    errorsRef.current = new Map()
    setLevels(levelsRef.current)
    setLoading(loadingRef.current)
    setErrors(errorsRef.current)
  }, [])

  // Root (re)load: a new root resets the whole tree.
  useEffect(() => {
    if (root === null) return
    resetAll()
    load(root)
  }, [root, load, resetAll])

  // Expand-driven loads: every expanded directory whose level is not loaded.
  // `expanded` identity changes on each toggle; `generation` bumps on refresh.
  useEffect(() => {
    const paths = Object.keys(expanded).filter(path => expanded[path] === true)
    for (const path of paths) load(path)
  }, [expanded, generation, load])

  const refresh = useCallback((): void => {
    if (root === null) return
    resetAll()
    setGeneration(value => value + 1)
    load(root)
  }, [root, resetAll, load])

  const retry = useCallback((path: string): void => {
    const errorsNext = new Map(errorsRef.current)
    errorsNext.delete(path)
    errorsRef.current = errorsNext
    setErrors(errorsNext)
    load(path)
  }, [load])

  const isVisible = useCallback((entry: WorkspaceFileEntry): boolean =>
    showHidden || !entry.hidden, [showHidden])

  // ── flat filter view over loaded listings ─────────────────────────────────
  if (filter.trim().length > 0) {
    const query = filter.trim().toLowerCase()
    const matches: WorkspaceFileEntry[] = []
    for (const level of levels.values()) {
      for (const entry of level.entries) {
        if (entry.name.toLowerCase().includes(query)) matches.push(entry)
      }
    }
    if (matches.length === 0) {
      return <div className={css.empty}>{t('tree.filterEmpty')}</div>
    }
    return (
      <div className={css.scroll} role="tree" aria-label={t('panel.title')}>
        {matches.map(entry => (
          <div
            key={entry.path}
            className={css.row}
            style={{ paddingLeft: 12 }}
            data-kind={entry.kind}
            title={entry.path}
          >
            <button
              type="button"
              className={css.rowMain}
              onClick={() => {
                if (entry.kind === 'directory') onToggleExpanded(entry.path)
                else { onSelect(entry.path); onPreview(entry.path) }
              }}
            >
              <span className={css.chevron} aria-hidden="true">
                {entry.kind === 'directory' ? <IconChevronRightOutline14 /> : null}
              </span>
              <span className={css.name}>{entry.name}</span>
              {entry.kind === 'file' && entry.size !== null && (
                <span className={css.size}>{t(formatBytes(entry.size).key, { count: formatBytes(entry.size).count })}</span>
              )}
            </button>
            {entry.kind === 'file' && (
              <FileRowActions path={entry.path} t={t} {...rowActions} />
            )}
          </div>
        ))}
      </div>
    )
  }

  if (root === null) {
    return <div className={css.empty}>{t('tree.loading')}</div>
  }

  const renderLevel = (dirPath: string, depth: number): ReactNode => {
    const level = levels.get(dirPath)
    const error = errors.get(dirPath)
    if (level === undefined && loading.has(dirPath)) {
      return <div className={css.row} style={{ paddingLeft: 12 + depth * 14 }} data-kind="loading">{t('tree.loading')}</div>
    }
    if (error !== undefined) {
      return (
        <div className={css.errorRow} style={{ paddingLeft: 12 + depth * 14 }}>
          <span>{t('tree.unreadable', { path: dirPath })}</span>
          <button type="button" className={css.retry} onClick={() => { retry(dirPath) }}>{t('tree.retry')}</button>
        </div>
      )
    }
    if (level === undefined) return null
    const entries = level.entries.filter(isVisible)
    if (entries.length === 0) {
      return <div className={css.empty} style={{ paddingLeft: 12 + depth * 14 }}>{t('tree.empty')}</div>
    }
    return (
      <>
        {entries.map(entry => {
          if (entry.kind !== 'directory') {
            return (
              <div
                key={entry.path}
                className={css.row}
                style={{ paddingLeft: 12 + depth * 14 }}
                data-kind="file"
                data-selected={selected === entry.path || undefined}
                title={entry.path}
              >
                <button
                  type="button"
                  className={css.rowMain}
                  onClick={() => { onSelect(entry.path); onPreview(entry.path) }}
                >
                  <span className={css.chevron} aria-hidden="true" />
                  <span className={css.name}>{entry.name}</span>
                  {entry.size !== null && (
                    <span className={css.size}>{t(formatBytes(entry.size).key, { count: formatBytes(entry.size).count })}</span>
                  )}
                </button>
                <FileRowActions path={entry.path} t={t} {...rowActions} />
              </div>
            )
          }
          const isOpen = expanded[entry.path] === true
          return (
            <div key={entry.path}>
              <button
                type="button"
                className={css.rowMain}
                style={{ paddingLeft: 12 + depth * 14 }}
                data-kind="directory"
                data-open={isOpen || undefined}
                title={entry.path}
                onClick={() => { onToggleExpanded(entry.path) }}
              >
                <span className={css.chevron} aria-hidden="true">
                  {isOpen ? <IconChevronDownOutline14 /> : <IconChevronRightOutline14 />}
                </span>
                {isOpen ? <IconFolderOpenOutline16 className={css.folder} /> : <IconFolderClose16 className={css.folder} />}
                <span className={css.name}>{entry.name}</span>
              </button>
              {isOpen && renderLevel(entry.path, depth + 1)}
            </div>
          )
        })}
      </>
    )
  }

  return (
    <div className={css.scroll} role="tree" aria-label={t('panel.title')}>
      <div className={css.rootRow} data-kind="directory">
        <IconFolderOpenOutline16 className={css.folder} />
        <span className={css.name}>{root}</span>
        <button type="button" className={css.refresh} onClick={refresh} aria-label={t('tree.refresh')} title={t('tree.refresh')}>
          <IconRefreshOutline16 />
        </button>
      </div>
      {renderLevel(root, 0)}
    </div>
  )
}
