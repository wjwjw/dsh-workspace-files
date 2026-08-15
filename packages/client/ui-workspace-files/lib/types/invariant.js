/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-workspace-files`.
 * @module @deepseek-ai/dsh-client-ui-workspace-files/invariant
 */
const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-workspace-files';
/** Cordis companion plugin name. */
export const name = 'client-ui-workspace-files-invariant';
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants'];
/**
 * No runtime invariant: the overlay entry, dictionary, and injected Reactive
 * derivation are effect-owned with disposal proven by the plugin specs; this
 * package owns no cross-plugin mutable state.
 */
const install = () => { };
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map