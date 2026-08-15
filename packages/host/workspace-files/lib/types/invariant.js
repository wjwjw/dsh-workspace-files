/** Package-owned invariant companion. @module @deepseek-ai/dsh-host-workspace-files/invariant */
const PACKAGE_NAME = '@deepseek-ai/dsh-host-workspace-files';
/** Cordis companion plugin name. */
export const name = 'host-workspace-files-invariant';
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants'];
/** No runtime invariant: every listing is projected directly from `ctx.fs` state on each call. */
const install = () => { };
/** Register this package's invariant companion. */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map