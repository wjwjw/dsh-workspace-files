import workspaceFilesRemote from "@deepseek-ai/dsh-host-workspace-files/remote";
//#region lib/types/index.js
/** Host loader entry for the browser-only workspace-files plugin. */
/** Require the shared Remote client surface before mounting onto it. */
const inject = ["remote"];
/**
* Mount the workspace-files Remote namespace onto the shared `remote` service
* so the browser half can read `ctx.remote.workspaceFiles`. The host-side
* `api-remotes` bundle no longer mounts it: this plugin owns its Remote, which
* is what lets it install standalone (through its `@deepseek-ai/dsh-bundle-workspace-files`
* bundle) instead of being hardcoded into the web-app bundle.
* @param ctx - Client Cordis root carrying the typed Remote service.
* @returns disposer that unmounts the namespace.
*/
async function apply(ctx) {
	const dispose = await ctx.remote.$mount(workspaceFilesRemote);
	return async () => {
		await dispose();
	};
}
//#endregion
export { apply, inject };
