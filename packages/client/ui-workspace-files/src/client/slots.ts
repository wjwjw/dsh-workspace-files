/** Injected business face of the workspace-files dock (components never see ctx). */

import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type { HostDescriptionSource } from '@deepseek-ai/dsh-client-connection/client'
// Type-only: pulls ui-layout's SlotMap merge (the shell.overlay seat) into
// this program so PropsRuntime and slots.inject see the declared slot.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {
  WorkspaceFileListResult, WorkspaceFileReadResult,
} from '@deepseek-ai/dsh-host-workspace-files/types'
import type { ModifiedFile } from './modified-files.ts'

/** Outcome of adding the file name into the current session's composer. */
export type AddToComposerResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: { readonly code: 'no-session'; readonly message: string } }

/** The registrant-private face bound as `useHostDescription` / `useModifiedFiles`. */
export interface WorkspaceFilesInjected {
  /** Whether the browser itself is connected over loopback (gates the preview's OS-open button). */
  isLoopback: boolean
  hooks: {
    /** Current generation's Host description (cwd roots the tree, canOpenPath gates OS open). */
    hostDescription: HostDescriptionSource
    /** Current session's modified-file list, republished on session or conversation change. */
    modifiedFiles: HostObservable<readonly ModifiedFile[]>
  }
  /** List one directory level through the workspace-files Remote. */
  list: (path: string, signal: AbortSignal) => Promise<WorkspaceFileListResult>
  /** Read one bounded text preview through the workspace-files Remote. */
  read: (path: string, signal: AbortSignal) => Promise<WorkspaceFileReadResult>
  /** Open a path with the Host's default application; rejects on failure. */
  open: (path: string) => Promise<void>
  /** Reveal a path in the Host's file manager (show-in-folder); rejects on failure. */
  reveal: (path: string) => Promise<void>
  /** Insert the file's name into the current session's composer draft. */
  addToComposer: (path: string) => Promise<AddToComposerResult>
}
