import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Right-docked workspace explorer: the shell.overlay entry. A floating tab
 * opens a panel holding the file tree (or a preview / editor) above a
 * draggable divider and the modified-files list below. The panel stays
 * mounted while closed (display:none preserves React state) so the tree keeps
 * its loaded listings; width and split geometry are store state.
 */
import { useCallback, useEffect, useRef } from 'react';
import { IconBrowseOutline16, IconCloseOutline16, IconSearchOutline16, } from '@deepseek-ai/dsh-client-ui-primitives';
import { FileTree } from "./FileTree.js";
import { FilePreview } from "./FilePreview.js";
import { ModifiedFilesList } from "./ModifiedFilesList.js";
import css from './WorkspaceFilesDock.module.css';
export function WorkspaceFilesDock({ useStore, actions, useHostDescription, useModifiedFiles, useSessions, t, isLoopback, list, read, open, reveal, addToComposer, }) {
    const state = useStore(s => s);
    const modified = useModifiedFiles(files => files);
    const cwd = useHostDescription(description => description?.cwd ?? null);
    const hostCanOpenPath = useHostDescription(description => description?.canOpenPath === true);
    const canOpenPath = isLoopback && hostCanOpenPath;
    const hasSession = useSessions(s => s.current !== undefined);
    const bodyRef = useRef(null);
    // Transient notice line: auto-dismiss a few seconds after it appears.
    useEffect(() => {
        if (state.notice === null)
            return;
        const id = window.setTimeout(() => { actions.setNotice(null); }, 4000);
        return () => { window.clearTimeout(id); };
    }, [state.notice, actions]);
    const revealInTree = useCallback((path) => {
        actions.expandPath(path);
        actions.setPreview(path);
    }, [actions]);
    /** The shared row-level verb set (failures surface as a notice line). */
    const rowActions = useCallback(() => ({
        open: (path) => {
            void open(path).catch(() => { actions.setNotice(t('row.openFailed')); });
        },
        openFolder: (path) => {
            void reveal(path).catch(() => { actions.setNotice(t('row.openFailed')); });
        },
        attach: (path) => {
            void addToComposer(path).then((result) => {
                actions.setNotice(result.ok
                    ? t('row.addedToInput')
                    : t('row.attachNoSession'));
            });
        },
    }), [open, reveal, addToComposer, actions, t]);
    // The modified list recomputes from the archive point when one is set.
    const archiveSeq = state.archiveSeq;
    const visibleModified = archiveSeq === null
        ? modified
        : modified.filter(file => file.seq > archiveSeq);
    const archiveNow = useCallback(() => {
        actions.archive(modified);
        actions.setNotice(t('modified.archived'));
    }, [actions, modified, t]);
    // Dock width: the left-edge handle widens the dock as it moves left.
    const onWidthPointerDown = useCallback((event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        const startX = event.clientX;
        const startWidth = state.width;
        const move = (moveEvent) => {
            actions.setWidth(startWidth + (startX - moveEvent.clientX));
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    }, [state.width, actions]);
    // Vertical split: the divider row reports the top ratio inside the body.
    const onSplitPointerDown = useCallback((event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        const body = bodyRef.current;
        if (body === null)
            return;
        const rect = body.getBoundingClientRect();
        const startTop = event.clientY - rect.top;
        const height = rect.height;
        const move = (moveEvent) => {
            if (height <= 0)
                return;
            const ratio = (startTop + (moveEvent.clientY - event.clientY)) / height;
            actions.setSplit(ratio);
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    }, [actions]);
    const splitPx = Math.round(state.split * 100);
    const showPreview = state.preview !== null;
    const face = rowActions();
    return (_jsxs("div", { className: css.root, "data-open": state.open || undefined, style: state.open ? { width: state.width } : undefined, children: [!state.open && (_jsx("button", { type: "button", className: css.tab, onClick: () => { actions.setOpen(true); }, "aria-label": t('dock.toggle'), title: t('dock.toggle'), children: _jsx(IconBrowseOutline16, { size: 18 }) })), _jsxs("div", { className: css.panel, "data-open": state.open || undefined, children: [_jsxs("div", { className: css.header, children: [_jsx("span", { className: css.title, children: t('panel.title') }), _jsxs("span", { className: css.search, children: [_jsx(IconSearchOutline16, { className: css.searchIcon }), _jsx("input", { className: css.filter, value: state.filter, placeholder: t('tree.filter'), "aria-label": t('tree.filter'), onChange: (event) => { actions.setFilter(event.currentTarget.value); } })] }), _jsx("button", { type: "button", className: css.pill, "data-active": state.showHidden || undefined, onClick: () => { actions.toggleShowHidden(); }, title: t('tree.showHidden'), "aria-pressed": state.showHidden, children: t('tree.showHidden') }), _jsx("button", { type: "button", className: css.pill, onClick: () => { actions.collapseAll(); }, title: t('tree.collapseAll'), children: t('tree.collapseAll') }), _jsx("button", { type: "button", className: css.iconBtn, onClick: () => { actions.setOpen(false); }, title: t('panel.close'), "aria-label": t('panel.close'), children: _jsx(IconCloseOutline16, {}) })] }), _jsxs("div", { ref: bodyRef, className: css.body, style: { gridTemplateRows: `${splitPx}fr 4px ${100 - splitPx}fr` }, children: [_jsx("div", { className: css.upper, "data-workspace-files": "tree", children: showPreview
                                    ? (_jsx(FilePreview, { path: state.preview, canOpenPath: canOpenPath, onBack: () => { actions.setPreview(null); }, onOpen: (path) => { face.open(path); }, rowActions: { path: state.preview, ...face }, read: read, t: t }))
                                    : (_jsx(FileTree, { root: cwd, showHidden: state.showHidden, filter: state.filter, expanded: state.expanded, selected: state.selected, onToggleExpanded: (path) => { actions.toggleExpanded(path); }, onSelect: (path) => { actions.select(path); }, onPreview: (path) => { actions.setPreview(path); }, rowActions: face, list: list, t: t })) }), _jsx("div", { className: css.divider, role: "separator", "aria-orientation": "horizontal", onPointerDown: onSplitPointerDown }), _jsxs("div", { className: css.lower, "data-workspace-files": "modified", children: [_jsxs("div", { className: css.sectionHeader, children: [_jsx("span", { className: css.sectionTitle, children: t('modified.title') }), visibleModified.length > 0 && _jsx("span", { className: css.count, children: visibleModified.length }), _jsx("button", { type: "button", className: css.pill, "data-active": state.archiveSeq !== null || undefined, onClick: archiveNow, title: t('modified.archiveHint'), children: t('modified.archive') })] }), _jsx(ModifiedFilesList, { files: visibleModified, hasSession: hasSession, archived: state.archiveSeq !== null, onReveal: revealInTree, rowActions: face, t: t })] })] }), state.notice !== null && _jsx("div", { className: css.notice, role: "status", children: state.notice })] }), state.open && _jsx("div", { className: css.widthHandle, role: "separator", "aria-orientation": "vertical", onPointerDown: onWidthPointerDown })] }));
}
//# sourceMappingURL=WorkspaceFilesDock.js.map