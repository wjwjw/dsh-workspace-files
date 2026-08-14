/**
 * Modified-files list: the files the current conversation touched, in
 * first-seen call order, with settlement badges. Clicking a row reveals the
 * file in the tree and opens its preview; the trailing actions menu carries
 * the same row verbs as the tree (open / folder / attach).
 */

import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import type { ModifiedFile } from './modified-files.ts'
import { basename, dirname } from './path.ts'
import { FileRowActions } from './FileRowActions.tsx'
import type { FileRowActionsFace } from './FileRowActions.tsx'
import css from './ModifiedFilesList.module.css'

/** The modified-files section props. */
export interface ModifiedFilesListProps {
  /** Files the current conversation modified (empty when none or no session). */
  files: readonly ModifiedFile[]
  /** Whether a session is currently selected (drives the empty copy). */
  hasSession: boolean
  /** Whether an archive point is active (drives the archived empty copy). */
  archived: boolean
  /** Reveal one file in the tree and open its preview. */
  onReveal: (path: string) => void
  rowActions: FileRowActionsFace
  t: TranslateNS<typeof NS>
}

/** Operation badge copy key: 新增 when created, 编辑 when edited in place. */
function operationKey(operation: ModifiedFile['operation']): 'modified.created' | 'modified.edited' {
  return operation === 'create' ? 'modified.created' : 'modified.edited'
}

export function ModifiedFilesList({ files, hasSession, archived, onReveal, rowActions, t }: ModifiedFilesListProps) {
  if (!hasSession) {
    return <div className={css.empty}>{t('modified.noSession')}</div>
  }
  if (files.length === 0) {
    return <div className={css.empty}>{t(archived ? 'modified.archivedEmpty' : 'modified.empty')}</div>
  }
  return (
    <ul className={css.list}>
      {files.map(file => (
        <li key={`${file.path}:${file.tool}:${file.time}`} className={css.item} title={file.path}>
          <button
            type="button"
            className={css.row}
            data-state={file.state}
            onClick={() => { onReveal(file.path) }}
          >
            <span className={css.dot} aria-hidden="true" data-state={file.state} />
            <span className={css.text}>
              <span className={css.name}>{basename(file.path)}</span>
              <span className={css.dir}>{dirname(file.path)}</span>
            </span>
            <span className={css.meta}>
              <span className={css.tool} data-tool={file.operation}>{t(operationKey(file.operation))}</span>
              <span className={css.state} data-state={file.state}>
                {file.state === 'running' ? t('modified.running')
                  : file.state === 'error' ? t('modified.failed')
                  : new Date(file.time).toLocaleTimeString()}
              </span>
            </span>
          </button>
          <FileRowActions path={file.path} t={t} {...rowActions} />
        </li>
      ))}
    </ul>
  )
}
