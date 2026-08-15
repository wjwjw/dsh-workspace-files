/**
 * Right-docked workspace explorer: the shell.overlay entry. A floating tab
 * opens a panel holding the file tree (or a preview / editor) above a
 * draggable divider and the modified-files list below. The panel stays
 * mounted while closed (display:none preserves React state) so the tree keeps
 * its loaded listings; width and split geometry are store state.
 */
import type { PropsLocale, PropsRuntime, PropsStore, InjectFace } from '@deepseek-ai/dsh-client-ui-slots';
import type { createWorkspaceFilesStore } from './store.ts';
import type { WorkspaceFilesInjected } from './slots.ts';
import type { NS } from './locales.ts';
/** Full composed props: runtime share + store share + injected face + locale seat. */
export type WorkspaceFilesDockProps = PropsRuntime<'shell.overlay'> & PropsStore<ReturnType<typeof createWorkspaceFilesStore>> & InjectFace<WorkspaceFilesInjected> & PropsLocale<typeof NS>;
export declare function WorkspaceFilesDock({ useStore, actions, useHostDescription, useModifiedFiles, useSessions, t, isLoopback, list, read, open, reveal, addToComposer, }: WorkspaceFilesDockProps): import("react").JSX.Element;
//# sourceMappingURL=WorkspaceFilesDock.d.ts.map