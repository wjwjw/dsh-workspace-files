/**
 * Per-row action menu for one file: open in system, reveal in the containing
 * folder, or add the name to the composer. A single always-visible ellipsis
 * opens the shared primitives Menu (portaled, so tree scroll clipping cannot
 * crop it). Open/reveal are always enabled — failures surface as a notice.
 */
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { NS } from './locales.ts';
/** The row-level verb set the tree, modified list, and preview share. */
export interface FileRowActionsFace {
    open: (path: string) => void;
    openFolder: (path: string) => void;
    attach: (path: string) => void;
}
/** Row-actions component props (the face plus the addressed file). */
export interface FileRowActionsProps extends FileRowActionsFace {
    path: string;
    t: TranslateNS<typeof NS>;
}
export declare function FileRowActions({ path, open, openFolder, attach, t }: FileRowActionsProps): import("react").JSX.Element;
//# sourceMappingURL=FileRowActions.d.ts.map