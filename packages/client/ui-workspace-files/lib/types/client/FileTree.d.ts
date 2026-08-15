/**
 * Lazy file tree over the workspace-files Remote. Directories expand on
 * demand (one `list` call per expanded level, cached in component-local
 * state — only the tree knows its loaded listings), hidden rows follow the
 * store toggle, and a non-blank filter swaps the tree for a flat list of
 * matching loaded entries. Pure component: every external fact arrives
 * through props; the listing cache is the tree's own private state.
 */
import type { WorkspaceFileListing, WorkspaceFilesFailure } from '@deepseek-ai/dsh-host-workspace-files/types';
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { NS } from './locales.ts';
import type { FileRowActionsFace } from './FileRowActions.tsx';
/** The tree's own loading/error bookkeeping per directory path. */
interface FileTreeProps {
    /** Explorer root (the Host working directory); null while unknown. */
    root: string | null;
    showHidden: boolean;
    /** Non-blank switches to the flat filter view over loaded listings. */
    filter: string;
    expanded: Readonly<Record<string, boolean>>;
    selected: string | null;
    onToggleExpanded: (path: string) => void;
    onSelect: (path: string) => void;
    onPreview: (path: string) => void;
    rowActions: FileRowActionsFace;
    list: (path: string, signal: AbortSignal) => Promise<{
        ok: true;
        value: WorkspaceFileListing;
    } | {
        ok: false;
        error: WorkspaceFilesFailure;
    }>;
    t: TranslateNS<typeof NS>;
}
export declare function FileTree(props: FileTreeProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=FileTree.d.ts.map