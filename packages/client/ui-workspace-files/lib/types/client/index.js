import workspaceFilesRemote from '@deepseek-ai/dsh-host-workspace-files/remote';
import { WorkspaceFilesDock } from "./WorkspaceFilesDock.js";
import { en, NS, zh } from "./locales.js";
import { createModifiedFilesSource } from "./modified-files.js";
import { basename } from "./path.js";
import { createWorkspaceFilesStore } from "./store.js";
export { createWorkspaceFilesStore } from "./store.js";
/** Required services for the overlay registration, its dictionaries, and its callbacks. */
export const inject = ['slots', 'locale', 'connection', 'sessions', 'conversation', 'remote'];
/**
 * Client plugin body: mount the workspace-files Remote namespace onto the
 * shared `remote` service (the host-side api-remotes bundle no longer mounts
 * it — this plugin owns its Remote, which is what lets it install standalone
 * through its bundle), then register the dictionaries and the overlay dock
 * entry.
 * @param ctx - client root context.
 */
export async function apply(ctx) {
    // `remote` is provided by the api-gateway client half; `remote.workspaceFiles`
    // becomes available only after this mount, so it must not appear in inject
    // (an inject entry would wait for a service this apply itself creates).
    // `ctx.get('remote.workspaceFiles')` bypasses the inject-required property
    // proxy, so capture the mounted namespace once and close over it below.
    const disposeRemote = await ctx.remote.$mount(workspaceFilesRemote);
    const workspaceFiles = ctx.get('remote.workspaceFiles');
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
                const result = await workspaceFiles.list(path, signal);
                return result.ok ? result.value : { ok: false, error: { code: 'io-error', path } };
            },
            read: async (path, signal) => {
                const result = await workspaceFiles.read(path, signal);
                return result.ok ? result.value : { ok: false, error: { code: 'io-error', path } };
            },
            // Failures propagate so the dock can surface them. The open gesture
            // goes through the dedicated workspace-files open Remote (never an
            // undeclared service on the registrant context).
            open: async (path) => {
                const result = await workspaceFiles.open(path, new AbortController().signal);
                if (result.ok && result.value.ok)
                    return;
                throw new Error('open failed');
            },
            // Show-in-folder through the workspace-files reveal Remote; failures
            // reject so the dock can surface them.
            reveal: async (path) => {
                const result = await workspaceFiles.reveal(path, new AbortController().signal);
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
    // Unwind the Remote namespace before the fiber's own effects run their
    // disposal.
    return async () => { await disposeRemote(); };
}
//# sourceMappingURL=index.js.map