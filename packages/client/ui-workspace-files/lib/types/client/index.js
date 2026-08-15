import { WorkspaceFilesDock } from "./WorkspaceFilesDock.js";
import { en, NS, zh } from "./locales.js";
import { createModifiedFilesSource } from "./modified-files.js";
import { basename } from "./path.js";
import { createWorkspaceFilesStore } from "./store.js";
export { createWorkspaceFilesStore } from "./store.js";
/** Required services for the overlay registration, its dictionaries, and its callbacks. */
export const inject = ['slots', 'locale', 'connection', 'sessions', 'conversation', 'remote', 'remote.workspaceFiles'];
/**
 * Client plugin body: register the dictionaries and the overlay dock entry.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-workspace-files: dictionaries');
    const connection = ctx.get('connection');
    // One session-scoped derivation feeds every render of the dock; its
    // subscriptions die with the plugin fiber (HMR safety).
    const modifiedFiles = createModifiedFilesSource(ctx.sessions);
    ctx.effect(() => () => { modifiedFiles.dispose(); }, 'ui-workspace-files: modified-files source');
    // shell.overlay is declared by ui-layout; the inject waits on the
    // declaration lifetime and re-registers after a redeclaration.
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'workspace-files',
        order: 0,
        locale: NS,
        store: createWorkspaceFilesStore,
        inject: () => ({
            isLoopback: connection.isLoopback,
            hooks: {
                hostDescription: connection.hostDescription,
                modifiedFiles,
            },
            // The Remote face double-envelopes results (carrier + business); the
            // dock only speaks the business result, so carrier failures map to a
            // business io-error carrying the addressed path.
            list: async (path, signal) => {
                const result = await ctx.remote.workspaceFiles.list(path, signal);
                return result.ok ? result.value : { ok: false, error: { code: 'io-error', path } };
            },
            read: async (path, signal) => {
                const result = await ctx.remote.workspaceFiles.read(path, signal);
                return result.ok ? result.value : { ok: false, error: { code: 'io-error', path } };
            },
            // Failures propagate so the dock can surface them. The open gesture
            // goes through the dedicated workspace-files open Remote (never an
            // undeclared service on the registrant context).
            open: async (path) => {
                const result = await ctx.remote.workspaceFiles.open(path, new AbortController().signal);
                if (result.ok && result.value.ok)
                    return;
                throw new Error('open failed');
            },
            // Show-in-folder through the workspace-files reveal Remote; failures
            // reject so the dock can surface them.
            reveal: async (path) => {
                const result = await ctx.remote.workspaceFiles.reveal(path, new AbortController().signal);
                if (result.ok && result.value.ok)
                    return;
                throw new Error('reveal failed');
            },
            // Insert only the file name into the current session's composer draft;
            // the user reviews and sends it themselves.
            addToComposer: (path) => {
                const current = ctx.sessions.list.getSnapshot().current;
                const scope = current === undefined ? undefined : ctx.sessions.scope(current);
                if (scope === undefined) {
                    return Promise.resolve({ ok: false, error: { code: 'no-session', message: 'no current session' } });
                }
                const name = basename(path);
                const input = ctx.conversation.input.for(scope);
                const existing = input.state.getSnapshot().draft;
                input.setDraft(existing.trim() === '' ? name : `${existing} ${name}`);
                return Promise.resolve({ ok: true });
            },
        }),
    }, WorkspaceFilesDock));
}
//# sourceMappingURL=index.js.map