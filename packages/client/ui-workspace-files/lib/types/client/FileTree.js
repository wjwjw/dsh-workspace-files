import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Lazy file tree over the workspace-files Remote. Directories expand on
 * demand (one `list` call per expanded level, cached in component-local
 * state — only the tree knows its loaded listings), hidden rows follow the
 * store toggle, and a non-blank filter swaps the tree for a flat list of
 * matching loaded entries. Pure component: every external fact arrives
 * through props; the listing cache is the tree's own private state.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconChevronDownOutline14, IconChevronRightOutline14, IconFolderClose16, IconFolderOpenOutline16, IconRefreshOutline16, } from '@deepseek-ai/dsh-client-ui-primitives';
import { FileRowActions } from "./FileRowActions.js";
import { formatBytes } from "./format.js";
import css from './FileTree.module.css';
export function FileTree(props) {
    const { root, showHidden, filter, expanded, selected, onToggleExpanded, onSelect, onPreview, rowActions, list, t } = props;
    const [levels, setLevels] = useState(() => new Map());
    const [loading, setLoading] = useState(() => new Set());
    const [errors, setErrors] = useState(() => new Map());
    const [generation, setGeneration] = useState(0);
    // Refs mirror the state so async callbacks never act on a stale closure.
    const levelsRef = useRef(levels);
    const loadingRef = useRef(loading);
    const errorsRef = useRef(errors);
    levelsRef.current = levels;
    loadingRef.current = loading;
    errorsRef.current = errors;
    const load = useCallback((path) => {
        if (levelsRef.current.has(path) || loadingRef.current.has(path))
            return;
        const loadingNext = new Set(loadingRef.current);
        loadingNext.add(path);
        loadingRef.current = loadingNext;
        setLoading(loadingNext);
        list(path, new AbortController().signal).then((result) => {
            const afterLoad = new Set(loadingRef.current);
            afterLoad.delete(path);
            loadingRef.current = afterLoad;
            setLoading(afterLoad);
            if (result.ok) {
                levelsRef.current = new Map(levelsRef.current).set(path, result.value);
                setLevels(levelsRef.current);
            }
            else {
                errorsRef.current = new Map(errorsRef.current).set(path, result.error);
                setErrors(errorsRef.current);
            }
        }).catch(() => {
            // Aborted reads (refresh or unmount) leave no error behind.
            const afterAbort = new Set(loadingRef.current);
            afterAbort.delete(path);
            loadingRef.current = afterAbort;
            setLoading(afterAbort);
        });
    }, [list]);
    const resetAll = useCallback(() => {
        levelsRef.current = new Map();
        loadingRef.current = new Set();
        errorsRef.current = new Map();
        setLevels(levelsRef.current);
        setLoading(loadingRef.current);
        setErrors(errorsRef.current);
    }, []);
    // Root (re)load: a new root resets the whole tree.
    useEffect(() => {
        if (root === null)
            return;
        resetAll();
        load(root);
    }, [root, load, resetAll]);
    // Expand-driven loads: every expanded directory whose level is not loaded.
    // `expanded` identity changes on each toggle; `generation` bumps on refresh.
    useEffect(() => {
        const paths = Object.keys(expanded).filter(path => expanded[path] === true);
        for (const path of paths)
            load(path);
    }, [expanded, generation, load]);
    const refresh = useCallback(() => {
        if (root === null)
            return;
        resetAll();
        setGeneration(value => value + 1);
        load(root);
    }, [root, resetAll, load]);
    const retry = useCallback((path) => {
        const errorsNext = new Map(errorsRef.current);
        errorsNext.delete(path);
        errorsRef.current = errorsNext;
        setErrors(errorsNext);
        load(path);
    }, [load]);
    const isVisible = useCallback((entry) => showHidden || !entry.hidden, [showHidden]);
    // ── flat filter view over loaded listings ─────────────────────────────────
    if (filter.trim().length > 0) {
        const query = filter.trim().toLowerCase();
        const matches = [];
        for (const level of levels.values()) {
            for (const entry of level.entries) {
                if (entry.name.toLowerCase().includes(query))
                    matches.push(entry);
            }
        }
        if (matches.length === 0) {
            return _jsx("div", { className: css.empty, children: t('tree.filterEmpty') });
        }
        return (_jsx("div", { className: css.scroll, role: "tree", "aria-label": t('panel.title'), children: matches.map(entry => (_jsxs("div", { className: css.row, style: { paddingLeft: 12 }, "data-kind": entry.kind, title: entry.path, children: [_jsxs("button", { type: "button", className: css.rowMain, onClick: () => {
                            if (entry.kind === 'directory')
                                onToggleExpanded(entry.path);
                            else {
                                onSelect(entry.path);
                                onPreview(entry.path);
                            }
                        }, children: [_jsx("span", { className: css.chevron, "aria-hidden": "true", children: entry.kind === 'directory' ? _jsx(IconChevronRightOutline14, {}) : null }), _jsx("span", { className: css.name, children: entry.name }), entry.kind === 'file' && entry.size !== null && (_jsx("span", { className: css.size, children: t(formatBytes(entry.size).key, { count: formatBytes(entry.size).count }) }))] }), entry.kind === 'file' && (_jsx(FileRowActions, { path: entry.path, t: t, ...rowActions }))] }, entry.path))) }));
    }
    if (root === null) {
        return _jsx("div", { className: css.empty, children: t('tree.loading') });
    }
    const renderLevel = (dirPath, depth) => {
        const level = levels.get(dirPath);
        const error = errors.get(dirPath);
        if (level === undefined && loading.has(dirPath)) {
            return _jsx("div", { className: css.row, style: { paddingLeft: 12 + depth * 14 }, "data-kind": "loading", children: t('tree.loading') });
        }
        if (error !== undefined) {
            return (_jsxs("div", { className: css.errorRow, style: { paddingLeft: 12 + depth * 14 }, children: [_jsx("span", { children: t('tree.unreadable', { path: dirPath }) }), _jsx("button", { type: "button", className: css.retry, onClick: () => { retry(dirPath); }, children: t('tree.retry') })] }));
        }
        if (level === undefined)
            return null;
        const entries = level.entries.filter(isVisible);
        if (entries.length === 0) {
            return _jsx("div", { className: css.empty, style: { paddingLeft: 12 + depth * 14 }, children: t('tree.empty') });
        }
        return (_jsx(_Fragment, { children: entries.map(entry => {
                if (entry.kind !== 'directory') {
                    return (_jsxs("div", { className: css.row, style: { paddingLeft: 12 + depth * 14 }, "data-kind": "file", "data-selected": selected === entry.path || undefined, title: entry.path, children: [_jsxs("button", { type: "button", className: css.rowMain, onClick: () => { onSelect(entry.path); onPreview(entry.path); }, children: [_jsx("span", { className: css.chevron, "aria-hidden": "true" }), _jsx("span", { className: css.name, children: entry.name }), entry.size !== null && (_jsx("span", { className: css.size, children: t(formatBytes(entry.size).key, { count: formatBytes(entry.size).count }) }))] }), _jsx(FileRowActions, { path: entry.path, t: t, ...rowActions })] }, entry.path));
                }
                const isOpen = expanded[entry.path] === true;
                return (_jsxs("div", { children: [_jsxs("button", { type: "button", className: css.rowMain, style: { paddingLeft: 12 + depth * 14 }, "data-kind": "directory", "data-open": isOpen || undefined, title: entry.path, onClick: () => { onToggleExpanded(entry.path); }, children: [_jsx("span", { className: css.chevron, "aria-hidden": "true", children: isOpen ? _jsx(IconChevronDownOutline14, {}) : _jsx(IconChevronRightOutline14, {}) }), isOpen ? _jsx(IconFolderOpenOutline16, { className: css.folder }) : _jsx(IconFolderClose16, { className: css.folder }), _jsx("span", { className: css.name, children: entry.name })] }), isOpen && renderLevel(entry.path, depth + 1)] }, entry.path));
            }) }));
    };
    return (_jsxs("div", { className: css.scroll, role: "tree", "aria-label": t('panel.title'), children: [_jsxs("div", { className: css.rootRow, "data-kind": "directory", children: [_jsx(IconFolderOpenOutline16, { className: css.folder }), _jsx("span", { className: css.name, children: root }), _jsx("button", { type: "button", className: css.refresh, onClick: refresh, "aria-label": t('tree.refresh'), title: t('tree.refresh'), children: _jsx(IconRefreshOutline16, {}) })] }), renderLevel(root, 0)] }));
}
//# sourceMappingURL=FileTree.js.map