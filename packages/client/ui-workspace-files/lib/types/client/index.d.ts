/**
 * Workspace-files plugin, browser half: the right-docked explorer entry in the
 * layout-owned `shell.overlay` list slot. All policy lives here — the tree's
 * lazy listing flow, the modified-file derivation source, the desktop-open and
 * composer-insert verbs, and the copy — so composing this plugin out of
 * cordis.yml removes the whole surface; the overlay renders empty.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type WorkspaceFilesKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Workspace-files dock copy. */
        'workspace-files': WorkspaceFilesKey;
    }
}
export type { WorkspaceFilesInjected } from './slots.ts';
export type { ModifiedFile, ModifiedFileState } from './modified-files.ts';
export type { WorkspaceFilesKey } from './locales.ts';
export { createWorkspaceFilesStore } from './store.ts';
/** Required services for the overlay registration, its dictionaries, and its callbacks. */
export declare const inject: string[];
/**
 * Client plugin body: register the dictionaries and the overlay dock entry.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map