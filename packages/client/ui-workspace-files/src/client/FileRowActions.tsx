/**
 * Per-row action menu for one file: open in system, reveal in the containing
 * folder, or add the name to the composer. A single always-visible ellipsis
 * opens the shared primitives Menu (portaled, so tree scroll clipping cannot
 * crop it). Open/reveal are always enabled — failures surface as a notice.
 */

import { useState } from 'react'
import {
  IconEllipsisOutline16, IconFolderOpenOutline16, IconLinkOutline16,
  IconRightUpOutline16, Menu,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './FileRowActions.module.css'

/** The row-level verb set the tree, modified list, and preview share. */
export interface FileRowActionsFace {
  open: (path: string) => void
  openFolder: (path: string) => void
  attach: (path: string) => void
}

/** Row-actions component props (the face plus the addressed file). */
export interface FileRowActionsProps extends FileRowActionsFace {
  path: string
  t: TranslateNS<typeof NS>
}

export function FileRowActions({ path, open, openFolder, attach, t }: FileRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const items = [
    { id: 'open', label: t('row.open'), icon: <IconRightUpOutline16 /> },
    { id: 'folder', label: t('row.openFolder'), icon: <IconFolderOpenOutline16 /> },
    { id: 'attach', label: t('row.attach'), icon: <IconLinkOutline16 /> },
  ]
  return (
    <span className={css.wrap} data-row-actions data-open={menuOpen || undefined}>
      <Menu
        open={menuOpen}
        portal
        align="end"
        side="bottom"
        dense
        anchor={(
          <button
            type="button"
            className={css.trigger}
            aria-label={t('row.more')}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={t('row.more')}
            onClick={(event) => { event.stopPropagation(); setMenuOpen(true) }}
          >
            <IconEllipsisOutline16 />
          </button>
        )}
        items={items}
        onSelect={(id) => {
          setMenuOpen(false)
          if (id === 'open') open(path)
          else if (id === 'folder') openFolder(path)
          else if (id === 'attach') attach(path)
        }}
        onClose={() => { setMenuOpen(false) }}
      />
    </span>
  )
}
