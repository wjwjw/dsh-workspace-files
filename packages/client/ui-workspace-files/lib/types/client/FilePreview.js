import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Bounded text preview of one file. Owns its read lifecycle (loading /
 * ready / failure) locally — only the preview knows its own request — and
 * renders the decoded head, a truncation notice, or the business failure.
 */
import { useEffect, useRef, useState } from 'react';
import { FileRowActions } from "./FileRowActions.js";
import { formatBytes } from "./format.js";
import { basename } from "./path.js";
import css from './FilePreview.module.css';
/** Human copy for one business failure code. */
function failureMessage(failure) {
    switch (failure.code) {
        case 'path-unavailable': return 'preview.notFound';
        case 'not-a-text-file': return 'preview.binary';
        default: return 'preview.error';
    }
}
export function FilePreview({ path, canOpenPath, onBack, onOpen, rowActions, read, t }) {
    const [state, setState] = useState({ status: 'loading' });
    const request = useRef(0);
    useEffect(() => {
        const id = ++request.current;
        const controller = new AbortController();
        setState({ status: 'loading' });
        read(path, controller.signal).then((result) => {
            if (id !== request.current)
                return;
            if (result.ok) {
                setState({
                    status: 'ready',
                    content: result.value.content,
                    truncated: result.value.truncated,
                    byteLength: result.value.byteLength,
                });
            }
            else {
                setState({ status: 'error', failure: result.error });
            }
        }).catch(() => {
            // Aborted superseded reads leave the newer request's state alone.
        });
        return () => { controller.abort(); };
    }, [path, read]);
    const sizeText = state.status === 'ready'
        ? t(formatBytes(state.byteLength).key, { count: formatBytes(state.byteLength).count })
        : '';
    return (_jsxs("div", { className: css.preview, children: [_jsxs("div", { className: css.header, children: [_jsx("button", { type: "button", className: css.back, onClick: onBack, "aria-label": t('preview.back'), title: t('preview.back'), children: "\u2190" }), _jsxs("div", { className: css.titles, children: [_jsx("span", { className: css.name, children: basename(path) }), _jsx("span", { className: css.path, title: path, children: path })] }), canOpenPath && (_jsx("button", { type: "button", className: css.open, onClick: () => { onOpen(path); }, title: t('preview.open'), children: t('preview.open') })), _jsx(FileRowActions, { t: t, ...rowActions })] }), state.status === 'loading' && _jsx("div", { className: css.notice, children: t('preview.loading') }), state.status === 'ready' && (_jsxs(_Fragment, { children: [_jsx("pre", { className: css.content, children: state.content }), state.truncated && (_jsx("div", { className: css.notice, children: t('preview.truncated', { size: sizeText }) }))] })), state.status === 'error' && (_jsx("div", { className: css.notice, children: t(failureMessage(state.failure)) }))] }));
}
//# sourceMappingURL=FilePreview.js.map