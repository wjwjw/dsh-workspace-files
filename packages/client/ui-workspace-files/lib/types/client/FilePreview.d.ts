/**
 * Bounded text preview of one file. Owns its read lifecycle (loading /
 * ready / failure) locally — only the preview knows its own request — and
 * renders the decoded head, a truncation notice, or the business failure.
 */
import type { WorkspaceFileReadResult } from '@deepseek-ai/dsh-host-workspace-files/types';
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { NS } from './locales.ts';
import type { FileRowActionsFace } from './FileRowActions.tsx';
/** File-preview props (the read callback arrives through the inject face). */
export interface FilePreviewProps {
    path: string;
    canOpenPath: boolean;
    onBack: () => void;
    onOpen: (path: string) => void;
    /** The row verb set plus the addressed path (renders the trailing actions menu). */
    rowActions: {
        path: string;
    } & FileRowActionsFace;
    read: (path: string, signal: AbortSignal) => Promise<WorkspaceFileReadResult>;
    t: TranslateNS<typeof NS>;
}
export declare function FilePreview({ path, canOpenPath, onBack, onOpen, rowActions, read, t }: FilePreviewProps): import("react").JSX.Element;
//# sourceMappingURL=FilePreview.d.ts.map