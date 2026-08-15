/** Host loader entry for the browser-only workspace-files plugin. */
import type { Context } from '@deepseek-ai/cordis';
/** Require the shared Remote client surface before mounting onto it. */
export declare const inject: string[];
/**
 * Mount the workspace-files Remote namespace onto the shared `remote` service
 * so the browser half can read `ctx.remote.workspaceFiles`. The host-side
 * `api-remotes` bundle no longer mounts it: this plugin owns its Remote, which
 * is what lets it install standalone (through its `@deepseek-ai/dsh-bundle-workspace-files`
 * bundle) instead of being hardcoded into the web-app bundle.
 * @param ctx - Client Cordis root carrying the typed Remote service.
 * @returns disposer that unmounts the namespace.
 */
export declare function apply(ctx: Context): Promise<() => Promise<void>>;
//# sourceMappingURL=index.d.ts.map