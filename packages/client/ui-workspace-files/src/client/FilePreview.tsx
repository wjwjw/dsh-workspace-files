/**
 * Bounded text preview of one file. Owns its read lifecycle (loading /
 * ready / failure) locally — only the preview knows its own request — and
 * renders the decoded head, a truncation notice, or the business failure.
 */

import { useEffect, useRef, useState } from 'react'
import type { WorkspaceFileReadResult, WorkspaceFilesFailure } from '@deepseek-ai/dsh-host-workspace-files/types'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import { FileRowActions } from './FileRowActions.tsx'
import type { FileRowActionsFace } from './FileRowActions.tsx'
import { formatBytes } from './format.ts'
import { basename } from './path.ts'
import css from './FilePreview.module.css'

/** The preview's own read lifecycle. */
type PreviewState =
  | { status: 'loading' }
  | { status: 'ready'; content: string; truncated: boolean; byteLength: number }
  | { status: 'error'; failure: WorkspaceFilesFailure }

/** File-preview props (the read callback arrives through the inject face). */
export interface FilePreviewProps {
  path: string
  canOpenPath: boolean
  onBack: () => void
  onOpen: (path: string) => void
  /** The row verb set plus the addressed path (renders the trailing actions menu). */
  rowActions: { path: string } & FileRowActionsFace
  read: (path: string, signal: AbortSignal) => Promise<WorkspaceFileReadResult>
  t: TranslateNS<typeof NS>
}

/** Human copy for one business failure code. */
function failureMessage(failure: WorkspaceFilesFailure): 'preview.notFound' | 'preview.binary' | 'preview.error' {
  switch (failure.code) {
    case 'path-unavailable': return 'preview.notFound'
    case 'not-a-text-file': return 'preview.binary'
    default: return 'preview.error'
  }
}

export function FilePreview({ path, canOpenPath, onBack, onOpen, rowActions, read, t }: FilePreviewProps) {
  const [state, setState] = useState<PreviewState>({ status: 'loading' })
  const request = useRef(0)

  useEffect(() => {
    const id = ++request.current
    const controller = new AbortController()
    setState({ status: 'loading' })
    read(path, controller.signal).then((result) => {
      if (id !== request.current) return
      if (result.ok) {
        setState({
          status: 'ready',
          content: result.value.content,
          truncated: result.value.truncated,
          byteLength: result.value.byteLength,
        })
      } else {
        setState({ status: 'error', failure: result.error })
      }
    }).catch(() => {
      // Aborted superseded reads leave the newer request's state alone.
    })
    return () => { controller.abort() }
  }, [path, read])

  const sizeText = state.status === 'ready'
    ? t(formatBytes(state.byteLength).key, { count: formatBytes(state.byteLength).count })
    : ''

  return (
    <div className={css.preview}>
      <div className={css.header}>
        <button type="button" className={css.back} onClick={onBack} aria-label={t('preview.back')} title={t('preview.back')}>←</button>
        <div className={css.titles}>
          <span className={css.name}>{basename(path)}</span>
          <span className={css.path} title={path}>{path}</span>
        </div>
        {canOpenPath && (
          <button type="button" className={css.open} onClick={() => { onOpen(path) }} title={t('preview.open')}>
            {t('preview.open')}
          </button>
        )}
        <FileRowActions t={t} {...rowActions} />
      </div>
      {state.status === 'loading' && <div className={css.notice}>{t('preview.loading')}</div>}
      {state.status === 'ready' && (
        <>
          <pre className={css.content}>{state.content}</pre>
          {state.truncated && (
            <div className={css.notice}>{t('preview.truncated', { size: sizeText })}</div>
          )}
        </>
      )}
      {state.status === 'error' && (
        <div className={css.notice}>{t(failureMessage(state.failure))}</div>
      )}
    </div>
  )
}
