//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-workspace-files`.
* @module @deepseek-ai/dsh-client-ui-workspace-files/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-workspace-files";
/** Cordis companion plugin name. */
const name = "client-ui-workspace-files-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the overlay entry, dictionary, and injected Reactive
* derivation are effect-owned with disposal proven by the plugin specs; this
* package owns no cross-plugin mutable state.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
