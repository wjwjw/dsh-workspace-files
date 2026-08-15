/**
 * Panel geometry and viewing state of the workspace-files dock. Transient by
 * design (the layout shell's geometry is transient too): reload restores the
 * dock closed and the split at its default; nothing here reads or writes
 * localStorage.
 */
import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';
/** Dock width drag clamp floor. */
export const DOCK_MIN = 320;
/** Dock width drag clamp ceiling. */
export const DOCK_MAX = 560;
/** Dock width before any user drag. */
export const DOCK_DEFAULT = 380;
/** Tree share of the vertical split (the modified list takes the remainder). */
export const SPLIT_DEFAULT = 0.58;
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
export function createWorkspaceFilesStore() {
    return defineStore({
        init: () => ({
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
            setOpen: (d, open) => { d.open = open; },
            toggleOpen: (d) => { d.open = !d.open; },
            setWidth: (d, px) => { d.width = clamp(Math.round(px), DOCK_MIN, DOCK_MAX); },
            setSplit: (d, ratio) => { d.split = clamp(ratio, 0.2, 0.8); },
            toggleShowHidden: (d) => { d.showHidden = !d.showHidden; },
            setExpanded: (d, path, expanded) => {
                d.expanded = { ...d.expanded, [path]: expanded };
            },
            toggleExpanded: (d, path) => {
                d.expanded = { ...d.expanded, [path]: d.expanded[path] !== true };
            },
            /** Expand every ancestor directory of `path` so the file becomes visible. */
            expandPath: (d, path) => {
                const segments = path.split('/').filter(Boolean);
                const next = {};
                let acc = '';
                for (const segment of segments.slice(0, -1)) {
                    acc += `/${segment}`;
                    next[acc] = true;
                }
                d.expanded = { ...d.expanded, ...next };
            },
            collapseAll: (d) => { d.expanded = {}; },
            select: (d, path) => { d.selected = path; },
            setPreview: (d, path) => {
                d.preview = path;
                if (path !== null)
                    d.selected = path;
            },
            /**
             * Record an archive point from the current modified list: the list is
             * recomputed from the newest logged modification onward. Re-archiving
             * moves the point forward.
             * @param files - the current derived list (the archive consumes it).
             */
            archive: (d, files) => {
                d.archiveSeq = files.reduce((max, file) => (Number.isFinite(file.seq) ? Math.max(max, file.seq) : max), 0);
            },
            setNotice: (d, text) => { d.notice = text; },
            setFilter: (d, text) => { d.filter = text; },
        },
    });
}
//# sourceMappingURL=store.js.map