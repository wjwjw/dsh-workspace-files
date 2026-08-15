/**
 * Modified-files list: the files the current conversation touched, in
 * first-seen call order, with settlement badges. Clicking a row reveals the
 * file in the tree and opens its preview; the trailing actions menu carries
 * the same row verbs as the tree (open / folder / attach).
 */
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { NS } from './locales.ts';
import type { ModifiedFile } from './modified-files.ts';
import type { FileRowActionsFace } from './FileRowActions.tsx';
/** The modified-files section props. */
export interface ModifiedFilesListProps {
    /** Files the current conversation modified (empty when none or no session). */
    files: readonly ModifiedFile[];
    /** Whether a session is currently selected (drives the empty copy). */
    hasSession: boolean;
    /** Whether an archive point is active (drives the archived empty copy). */
    archived: boolean;
    /** Reveal one file in the tree and open its preview. */
    onReveal: (path: string) => void;
    rowActions: FileRowActionsFace;
    t: TranslateNS<typeof NS>;
}
export declare function ModifiedFilesList({ files, hasSession, archived, onReveal, rowActions, t }: ModifiedFilesListProps): import("react").JSX.Element;
//# sourceMappingURL=ModifiedFilesList.d.ts.map