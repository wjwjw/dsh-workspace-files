/**
 * Panel geometry and viewing state of the workspace-files dock. Transient by
 * design (the layout shell's geometry is transient too): reload restores the
 * dock closed and the split at its default; nothing here reads or writes
 * localStorage.
 */
import type { ModifiedFile } from './modified-files.ts';
/** Dock width drag clamp floor. */
export declare const DOCK_MIN = 320;
/** Dock width drag clamp ceiling. */
export declare const DOCK_MAX = 560;
/** Dock width before any user drag. */
export declare const DOCK_DEFAULT = 380;
/** Tree share of the vertical split (the modified list takes the remainder). */
export declare const SPLIT_DEFAULT = 0.58;
/** Immutable panel state (see actions for the write set). */
export interface WorkspaceFilesState {
    /** Whether the dock is open. */
    open: boolean;
    /** Dock width in px (0 never persists; closing is a separate flag). */
    width: number;
    /** Tree share of the vertical split between the tree and the modified list. */
    split: number;
    /** Whether hidden (dot-prefixed) entries are shown in the tree. */
    showHidden: boolean;
    /** Per-directory expansion, keyed by absolute path. */
    expanded: Readonly<Record<string, boolean>>;
    /** File path selected in the tree (highlighted row). */
    selected: string | null;
    /** File path currently previewed (the tree is replaced while set). */
    preview: string | null;
    /**
     * Archive point: the conversation seq recorded by the last 存档 action.
     * The modified list is recomputed from this moment (older entries hidden).
     */
    archiveSeq: number | null;
    /** Transient notice line (row-action outcomes); auto-dismissed by the dock. */
    notice: string | null;
    /** Non-blank when the tree is filtered to matching loaded entries. */
    filter: string;
}
export declare function createWorkspaceFilesStore(): import("@deepseek-ai/dsh-client-runtime/client").EngineStoreHandle<WorkspaceFilesState, {
    setOpen: (d: WorkspaceFilesState, open: boolean) => void;
    toggleOpen: (d: WorkspaceFilesState) => void;
    setWidth: (d: WorkspaceFilesState, px: number) => void;
    setSplit: (d: WorkspaceFilesState, ratio: number) => void;
    toggleShowHidden: (d: WorkspaceFilesState) => void;
    setExpanded: (d: WorkspaceFilesState, path: string, expanded: boolean) => void;
    toggleExpanded: (d: WorkspaceFilesState, path: string) => void;
    /** Expand every ancestor directory of `path` so the file becomes visible. */
    expandPath: (d: WorkspaceFilesState, path: string) => void;
    collapseAll: (d: WorkspaceFilesState) => void;
    select: (d: WorkspaceFilesState, path: string | null) => void;
    setPreview: (d: WorkspaceFilesState, path: string | null) => void;
    /**
     * Record an archive point from the current modified list: the list is
     * recomputed from the newest logged modification onward. Re-archiving
     * moves the point forward.
     * @param files - the current derived list (the archive consumes it).
     */
    archive: (d: WorkspaceFilesState, files: readonly ModifiedFile[]) => void;
    setNotice: (d: WorkspaceFilesState, text: string | null) => void;
    setFilter: (d: WorkspaceFilesState, text: string) => void;
}>;
//# sourceMappingURL=store.d.ts.map