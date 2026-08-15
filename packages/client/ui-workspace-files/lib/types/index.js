/**
 * Host loader entry for the browser-only workspace-files plugin.
 *
 * The browser half ships via exports["./client"], discovered through the
 * package.json dsh.client declaration. The Remote namespace is mounted from
 * the browser-side apply (src/client/index.ts) onto the shared `remote`
 * service — that service only exists in the browser, so no host-side
 * behavior belongs here.
 */
/** Host plugin body — no host-side behavior for the workspace-files plugin. */
export function apply() { }
//# sourceMappingURL=index.js.map