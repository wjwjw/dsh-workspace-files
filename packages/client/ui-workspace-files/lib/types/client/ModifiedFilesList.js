import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { basename, dirname } from "./path.js";
import { FileRowActions } from "./FileRowActions.js";
import css from './ModifiedFilesList.module.css';
/** Operation badge copy key: 新增 when created, 编辑 when edited in place. */
function operationKey(operation) {
    return operation === 'create' ? 'modified.created' : 'modified.edited';
}
export function ModifiedFilesList({ files, hasSession, archived, onReveal, rowActions, t }) {
    if (!hasSession) {
        return _jsx("div", { className: css.empty, children: t('modified.noSession') });
    }
    if (files.length === 0) {
        return _jsx("div", { className: css.empty, children: t(archived ? 'modified.archivedEmpty' : 'modified.empty') });
    }
    return (_jsx("ul", { className: css.list, children: files.map(file => (_jsxs("li", { className: css.item, title: file.path, children: [_jsxs("button", { type: "button", className: css.row, "data-state": file.state, onClick: () => { onReveal(file.path); }, children: [_jsx("span", { className: css.dot, "aria-hidden": "true", "data-state": file.state }), _jsxs("span", { className: css.text, children: [_jsx("span", { className: css.name, children: basename(file.path) }), _jsx("span", { className: css.dir, children: dirname(file.path) })] }), _jsxs("span", { className: css.meta, children: [_jsx("span", { className: css.tool, "data-tool": file.operation, children: t(operationKey(file.operation)) }), _jsx("span", { className: css.state, "data-state": file.state, children: file.state === 'running' ? t('modified.running')
                                        : file.state === 'error' ? t('modified.failed')
                                            : new Date(file.time).toLocaleTimeString() })] })] }), _jsx(FileRowActions, { path: file.path, t: t, ...rowActions })] }, `${file.path}:${file.tool}:${file.time}`))) }));
}
//# sourceMappingURL=ModifiedFilesList.js.map