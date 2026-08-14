/**
 * Panel geometry and viewing state of the workspace-files dock. Transient by
 * design (the layout shell's geometry is transient too): reload restores the
 * dock closed and the split at its default; nothing here reads or writes
 * localStorage.
 */

import { defineStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { ModifiedFile } from './modified-files.ts'

/** Dock width drag clamp floor. */
export const DOCK_MIN = 320
/** Dock width drag clamp ceiling. */
export const DOCK_MAX = 560
/** Dock width before any user drag. */
export const DOCK_DEFAULT = 380
/** Tree share of the vertical split (the modified list takes the remainder). */
export const SPLIT_DEFAULT = 0.58

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Immutable panel state (see actions for the write set). */
export interface WorkspaceFilesState {
  /** Whether the dock is open. */
  open: boolean
  /** Dock width in px (0 never persists; closing is a separate flag). */
  width: number
  /** Tree share of the vertical split between the tree and the modified list. */
  split: number
  /** Whether hidden (dot-prefixed) entries are shown in the tree. */
  showHidden: boolean
  /** Per-directory expansion, keyed by absolute path. */
  expanded: Readonly<Record<string, boolean>>
  /** File path selected in the tree (highlighted row). */
  selected: string | null
  /** File path currently previewed (the tree is replaced while set). */
  preview: string | null
  /**
   * Archive point: the conversation seq recorded by the last 存档 action.
   * The modified list is recomputed from this moment (older entries hidden).
   */
  archiveSeq: number | null
  /** Transient notice line (row-action outcomes); auto-dismissed by the dock. */
  notice: string | null
  /** Non-blank when the tree is filtered to matching loaded entries. */
  filter: string
}

export function createWorkspaceFilesStore() {
  return defineStore({
    init: (): WorkspaceFilesState => ({
      open: false,
      width: DOCK_DEFAULT,
      split: SPLIT_DEFAULT,
      showHidden: false,
      expanded: {},
      selected: null,
      preview: null,
      archiveSeq: null,
      notice: null,
      filter: '',
    }),
    actions: {
      setOpen: (d, open: boolean) => { d.open = open },
      toggleOpen: (d) => { d.open = !d.open },
      setWidth: (d, px: number) => { d.width = clamp(Math.round(px), DOCK_MIN, DOCK_MAX) },
      setSplit: (d, ratio: number) => { d.split = clamp(ratio, 0.2, 0.8) },
      toggleShowHidden: (d) => { d.showHidden = !d.showHidden },
      setExpanded: (d, path: string, expanded: boolean) => {
        d.expanded = { ...d.expanded, [path]: expanded }
      },
      toggleExpanded: (d, path: string) => {
        d.expanded = { ...d.expanded, [path]: d.expanded[path] !== true }
      },
      /** Expand every ancestor directory of `path` so the file becomes visible. */
      expandPath: (d, path: string) => {
        const segments = path.split('/').filter(Boolean)
        const next: Record<string, boolean> = {}
        let acc = ''
        for (const segment of segments.slice(0, -1)) {
          acc += `/${segment}`
          next[acc] = true
        }
        d.expanded = { ...d.expanded, ...next }
      },
      collapseAll: (d) => { d.expanded = {} },
      select: (d, path: string | null) => { d.selected = path },
      setPreview: (d, path: string | null) => {
        d.preview = path
        if (path !== null) d.selected = path
      },
      /**
       * Record an archive point from the current modified list: the list is
       * recomputed from the newest logged modification onward. Re-archiving
       * moves the point forward.
       * @param files - the current derived list (the archive consumes it).
       */
      archive: (d, files: readonly ModifiedFile[]) => {
        d.archiveSeq = files.reduce(
          (max, file) => (Number.isFinite(file.seq) ? Math.max(max, file.seq) : max),
          0,
        )
      },
      setNotice: (d, text: string | null) => { d.notice = text },
      setFilter: (d, text: string) => { d.filter = text },
    },
  })
}
