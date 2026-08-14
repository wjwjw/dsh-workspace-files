/**
 * Workspace-files plugin, browser half: the right-docked explorer entry in the
 * layout-owned `shell.overlay` list slot. All policy lives here — the tree's
 * lazy listing flow, the modified-file derivation source, the desktop-open and
 * composer-insert verbs, and the copy — so composing this plugin out of
 * cordis.yml removes the whole surface; the overlay renders empty.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
// Type-only: pulls the generated workspaceFiles Remote API and ctx.remote merge.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-host-workspace-files/remote'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the conversation service face (ctx.conversation.input).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { WorkspaceFilesDock } from './WorkspaceFilesDock.tsx'
import { en, NS, zh, type WorkspaceFilesKey } from './locales.ts'
import { createModifiedFilesSource } from './modified-files.ts'
import { basename } from './path.ts'
import { createWorkspaceFilesStore } from './store.ts'
import type { WorkspaceFilesInjected } from './slots.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Workspace-files dock copy. */
    'workspace-files': WorkspaceFilesKey
  }
}

export type { WorkspaceFilesInjected } from './slots.ts'
export type { ModifiedFile, ModifiedFileState } from './modified-files.ts'
export type { WorkspaceFilesKey } from './locales.ts'
export { createWorkspaceFilesStore } from './store.ts'

/** Required services for the overlay registration, its dictionaries, and its callbacks. */
export const inject = ['slots', 'locale', 'connection', 'sessions', 'conversation', 'remote', 'remote.workspaceFiles']

/**
 * Client plugin body: register the dictionaries and the overlay dock entry.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-workspace-files: dictionaries')

  const connection = ctx.get('connection') as ConnectionHandle
  // One session-scoped derivation feeds every render of the dock; its
  // subscriptions die with the plugin fiber (HMR safety).
  const modifiedFiles = createModifiedFilesSource(ctx.sessions)
  ctx.effect(() => () => { modifiedFiles.dispose() }, 'ui-workspace-files: modified-files source')

  // shell.overlay is declared by ui-layout; the inject waits on the
  // declaration lifetime and re-registers after a redeclaration.
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'workspace-files',
    order: 0,
    locale: NS,
    store: createWorkspaceFilesStore,
    inject: (): WorkspaceFilesInjected => ({
      isLoopback: connection.isLoopback,
      hooks: {
        hostDescription: connection.hostDescription,
        modifiedFiles,
      },
      // The Remote face double-envelopes results (carrier + business); the
      // dock only speaks the business result, so carrier failures map to a
      // business io-error carrying the addressed path.
      list: async (path, signal) => {
        const result = await ctx.remote.workspaceFiles.list(path, signal)
        return result.ok ? result.value : { ok: false, error: { code: 'io-error', path } }
      },
      read: async (path, signal) => {
        const result = await ctx.remote.workspaceFiles.read(path, signal)
        return result.ok ? result.value : { ok: false, error: { code: 'io-error', path } }
      },
      // Failures propagate so the dock can surface them. The open gesture
      // goes through the dedicated workspace-files open Remote (never an
      // undeclared service on the registrant context).
      open: async (path) => {
        const result = await ctx.remote.workspaceFiles.open(path, new AbortController().signal)
        if (result.ok && result.value.ok) return
        throw new Error('open failed')
      },
      // Show-in-folder through the workspace-files reveal Remote; failures
      // reject so the dock can surface them.
      reveal: async (path) => {
        const result = await ctx.remote.workspaceFiles.reveal(path, new AbortController().signal)
        if (result.ok && result.value.ok) return
        throw new Error('reveal failed')
      },
      // Insert only the file name into the current session's composer draft;
      // the user reviews and sends it themselves.
      addToComposer: (path) => {
        const current = ctx.sessions.list.getSnapshot().current
        const scope = current === undefined ? undefined : ctx.sessions.scope(current)
        if (scope === undefined) {
          return Promise.resolve({ ok: false, error: { code: 'no-session', message: 'no current session' } })
        }
        const name = basename(path)
        const input = ctx.conversation.input.for(scope)
        const existing = input.state.getSnapshot().draft
        input.setDraft(existing.trim() === '' ? name : `${existing} ${name}`)
        return Promise.resolve({ ok: true })
      },
    }),
  }, WorkspaceFilesDock))
}
