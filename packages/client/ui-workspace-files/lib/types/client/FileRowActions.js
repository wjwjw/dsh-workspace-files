import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Per-row action menu for one file: open in system, reveal in the containing
 * folder, or add the name to the composer. A single always-visible ellipsis
 * opens the shared primitives Menu (portaled, so tree scroll clipping cannot
 * crop it). Open/reveal are always enabled — failures surface as a notice.
 */
import { useState } from 'react';
import { IconEllipsisOutline16, IconFolderOpenOutline16, IconLinkOutline16, IconRightUpOutline16, Menu, } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './FileRowActions.module.css';
export function FileRowActions({ path, open, openFolder, attach, t }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const items = [
        { id: 'open', label: t('row.open'), icon: _jsx(IconRightUpOutline16, {}) },
        { id: 'folder', label: t('row.openFolder'), icon: _jsx(IconFolderOpenOutline16, {}) },
        { id: 'attach', label: t('row.attach'), icon: _jsx(IconLinkOutline16, {}) },
    ];
    return (_jsx("span", { className: css.wrap, "data-row-actions": true, "data-open": menuOpen || undefined, children: _jsx(Menu, { open: menuOpen, portal: true, align: "end", side: "bottom", dense: true, anchor: (_jsx("button", { type: "button", className: css.trigger, "aria-label": t('row.more'), "aria-haspopup": "menu", "aria-expanded": menuOpen, title: t('row.more'), onClick: (event) => { event.stopPropagation(); setMenuOpen(true); }, children: _jsx(IconEllipsisOutline16, {}) })), items: items, onSelect: (id) => {
                setMenuOpen(false);
                if (id === 'open')
                    open(path);
                else if (id === 'folder')
                    openFolder(path);
                else if (id === 'attach')
                    attach(path);
            }, onClose: () => { setMenuOpen(false); } }) }));
}
//# sourceMappingURL=FileRowActions.js.map