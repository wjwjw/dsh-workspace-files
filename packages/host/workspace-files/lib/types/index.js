/**
 * Workspace file browsing Remote: read-only one-level listings with metadata,
 * bounded text previews, and stat probes over `ctx.fs`. The web GUI's file
 * explorer consumes this namespace; every method is deliberately read-only so
 * the surface can never mutate the host filesystem (creation goes through the
 * workspace `createDirectory` seam when a future explorer needs it).
 * @module @deepseek-ai/dsh-host-workspace-files
 */
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { FsError } from '@deepseek-ai/dsh-fs';
import { dirname } from 'node:path';
import { runNativeCommand } from '@deepseek-ai/dsh-native-command';
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol';
/**
 * The platform "show in folder" command for one path: Windows selects the
 * path in Explorer, macOS reveals it in Finder, and Linux opens the parent
 * directory. Pure so tests pin the exact argv without spawning anything.
 * Windows wraps Explorer in PowerShell because node's execFile waits for the
 * child and the GUI explorer stub exits non-zero after handing off to the
 * shell; PowerShell launches GUI apps without waiting and returns 0.
 * Explorer needs `/select,<path>` as ONE argument, so the whole argument is
 * single-quoted: unquoted, PowerShell would parse the comma as array syntax
 * and deliver `/select` and the path as two separate arguments. Single quotes
 * keep `$`, backtick and double-quote literals; embedded single quotes double.
 * @param path - absolute path to reveal (canonical form preferred).
 * @param platform - the host platform.
 * @returns the shell-free command.
 */
export function revealCommand(path, platform = process.platform) {
    switch (platform) {
        case 'win32': {
            const literal = path.replace(/'/g, "''");
            return { command: 'powershell.exe', args: ['-NoProfile', '-Command', `Explorer.exe '/select,${literal}'`] };
        }
        case 'darwin': return { command: 'open', args: ['-R', path] };
        case 'linux': return { command: 'xdg-open', args: [dirname(path)] };
        default: throw new Error(`reveal is unsupported on ${platform}`);
    }
}
/**
 * The platform "open with the default application" command for one path.
 * Windows uses PowerShell `Start-Process` — the document goes through
 * ShellExecute like `cmd start` would, but the path arrives intact: node's
 * argv quoting wraps the whole `-Command` script once, and the single-quoted
 * literal inside stays literal (the `cmd /c start "" <path>` form failed
 * paths with spaces — node's wrapping and cmd's own parser disagree on
 * quotes). `Start-Process` returns 0 immediately. Pure so tests pin the
 * exact argv.
 * @param path - absolute path to open.
 * @param platform - the host platform.
 * @returns the shell-free command.
 */
export function openCommand(path, platform = process.platform) {
    switch (platform) {
        case 'win32': {
            const literal = path.replace(/'/g, "''");
            return { command: 'powershell.exe', args: ['-NoProfile', '-Command', `Start-Process -FilePath '${literal}'`] };
        }
        case 'darwin': return { command: 'open', args: [path] };
        case 'linux': return { command: 'xdg-open', args: [path] };
        default: throw new Error(`open is unsupported on ${platform}`);
    }
}
/** Preview cap: files at or above this size are reported truncated without content. */
export const READ_PREVIEW_BYTES = 256 * 1024;
/** How the explorer counts hidden entries: the POSIX dot convention (the fs
 *  seam exposes no platform-hidden attribute; Windows hidden stays listed). */
function isHidden(name) {
    return name.startsWith('.');
}
/** Bucket order for the explorer's conventional sort: directories, files, then other. */
function kindRank(kind) {
    return kind === 'directory' ? 0 : kind === 'file' ? 1 : 2;
}
/** Name-sorted with directories first, then files, then other entries. */
function sortEntries(entries) {
    return [...entries].sort((left, right) => kindRank(left.kind) - kindRank(right.kind)
        || left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
}
/** Rejected operation result with a stable business failure. */
function rejected(error) {
    return { ok: false, error };
}
/** Successful operation result. */
function success(value) {
    return { ok: true, value };
}
/** Map one `ctx.fs` failure to the closed business failure vocabulary. */
function mapFsError(error, path) {
    if (error instanceof FsError) {
        switch (error.code) {
            case 'FS_NOT_FOUND': return { code: 'path-unavailable', path };
            case 'FS_NOT_DIRECTORY': return { code: 'not-a-directory', path };
            case 'FS_NOT_TEXT':
            case 'FS_NOT_REGULAR_FILE': return { code: 'not-a-text-file', path };
            case 'FS_PERMISSION_DENIED':
            case 'FS_SANDBOX_DENIED': return { code: 'permission-denied', path };
            default: return { code: 'io-error', path };
        }
    }
    return { code: 'io-error', path };
}
/**
 * Narrow one mapped failure to the codes one operation may report. Codes the
 * operation pre-validates against (a `read` on a directory is rejected before
 * any fs call) degrade to `io-error` rather than widening the result union.
 * @param error - the mapped wide failure.
 * @param path - the path the failure is about.
 * @returns the failure narrowed to `codes`.
 */
function narrowFailure(error, path, codes) {
    if (codes.includes(error.code)) {
        return error;
    }
    return { code: 'io-error', path };
}
/** The `ctx.fs` resolve options with `exactOptionalPropertyTypes` respected. */
function resolveOptions(signal) {
    return signal === undefined ? {} : { signal };
}
/** The host account's working directory — the explorer root the client already
 *  knows from `host.describe`'s `cwd`; computed through the fs seam so a
 *  non-local backend still reports its own execution root. */
function hostRoot(ctx, signal) {
    return ctx.fs.resolve('.', resolveOptions(signal)).then(target => ctx.fs.processPath(target));
}
/** Remote-only service exposing read-only workspace browsing primitives. */
let WorkspaceFilesGateway = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _list_decorators;
    let _read_decorators;
    let _stat_decorators;
    let _write_decorators;
    let _reveal_decorators;
    let _open_decorators;
    return class WorkspaceFilesGateway extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _list_decorators = [Remote('list')];
            _read_decorators = [Remote('read')];
            _stat_decorators = [Remote('stat')];
            _write_decorators = [Remote('write')];
            _reveal_decorators = [Remote('reveal')];
            _open_decorators = [Remote('open')];
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _read_decorators, { kind: "method", name: "read", static: false, private: false, access: { has: obj => "read" in obj, get: obj => obj.read }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _stat_decorators, { kind: "method", name: "stat", static: false, private: false, access: { has: obj => "stat" in obj, get: obj => obj.stat }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _write_decorators, { kind: "method", name: "write", static: false, private: false, access: { has: obj => "write" in obj, get: obj => obj.write }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reveal_decorators, { kind: "method", name: "reveal", static: false, private: false, access: { has: obj => "reveal" in obj, get: obj => obj.reveal }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _open_decorators, { kind: "method", name: "open", static: false, private: false, access: { has: obj => "open" in obj, get: obj => obj.open }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static inject = ['fs'];
        constructor(ctx) {
            super(ctx, 'workspaceFiles');
            __runInitializers(this, _instanceExtraInitializers);
        }
        /**
         * List one directory level through the host filesystem seam.
         * @param path - absolute directory to list; absent lists the host working directory.
         * @param signal - caller lifetime; abort stops the scan.
         * @returns the level's sorted listing plus the explorer root, or a business failure.
         */
        async list(path, signal) {
            const requested = path ?? '.';
            try {
                const target = await this.ctx.fs.resolve(requested, resolveOptions(signal));
                const info = await this.ctx.fs.stat(target, signal);
                if (info === undefined)
                    return rejected({ code: 'path-unavailable', path: requested });
                if (info.type !== 'directory')
                    return rejected({ code: 'not-a-directory', path: requested });
                const children = await this.ctx.fs.listDir(target, signal);
                const [root, entries] = await Promise.all([
                    hostRoot(this.ctx, signal),
                    Promise.all(children.map(async (child) => {
                        const name = child.name;
                        return {
                            name,
                            path: this.ctx.fs.processPath(child.target),
                            kind: child.type === 'directory' ? 'directory' : child.type === 'file' ? 'file' : 'other',
                            size: child.type === 'file' ? (child.size ?? null) : null,
                            hidden: isHidden(name),
                        };
                    })),
                ]);
                return success({
                    path: this.ctx.fs.processPath(target),
                    root,
                    entries: sortEntries(entries),
                    truncated: false,
                });
            }
            catch (error) {
                return rejected(narrowFailure(mapFsError(error, requested), requested, ['path-unavailable', 'not-a-directory', 'permission-denied', 'io-error']));
            }
        }
        /**
         * Read a bounded UTF-8 text preview of one regular file.
         * @param path - absolute regular file to preview.
         * @param signal - caller lifetime; abort stops the read.
         * @returns decoded content (head slice when the file exceeds the preview cap), or a business failure.
         */
        async read(path, signal) {
            try {
                const target = await this.ctx.fs.resolve(path, resolveOptions(signal));
                const info = await this.ctx.fs.stat(target, signal);
                if (info === undefined)
                    return rejected({ code: 'path-unavailable', path });
                if (info.type === 'directory')
                    return rejected({ code: 'is-a-directory', path });
                if (info.type !== 'file')
                    return rejected({ code: 'not-a-text-file', path });
                if (info.size !== undefined && info.size > READ_PREVIEW_BYTES) {
                    const preview = { content: '', truncated: true, byteLength: info.size };
                    return success(preview);
                }
                const bytes = await this.ctx.fs.readBytes(target, signal, READ_PREVIEW_BYTES);
                let content;
                try {
                    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
                }
                catch {
                    return rejected({ code: 'not-a-text-file', path });
                }
                return success({ content, truncated: false, byteLength: bytes.byteLength });
            }
            catch (error) {
                return rejected(narrowFailure(mapFsError(error, path), path, ['path-unavailable', 'is-a-directory', 'not-a-text-file', 'permission-denied', 'io-error']));
            }
        }
        /**
         * Probe one path's metadata without reading content.
         * @param path - absolute path to probe.
         * @param signal - caller lifetime; abort stops the probe.
         * @returns the entry's kind and byte size, or a business failure.
         */
        async stat(path, signal) {
            try {
                const target = await this.ctx.fs.resolve(path, resolveOptions(signal));
                const info = await this.ctx.fs.stat(target, signal);
                if (info === undefined)
                    return rejected({ code: 'path-unavailable', path });
                const result = {
                    path: this.ctx.fs.processPath(target),
                    kind: info.type === 'directory' ? 'directory' : info.type === 'file' ? 'file' : 'other',
                    size: info.type === 'file' ? (info.size ?? null) : null,
                };
                return success(result);
            }
            catch (error) {
                return rejected(narrowFailure(mapFsError(error, path), path, ['path-unavailable', 'permission-denied', 'io-error']));
            }
        }
        /**
         * Commit one full-file text write (create or replace) through `ctx.fs`.
         * The mounted backend's sandbox fence still applies — under the default
         * `workspace-write` policy the target must canonicalize under the workspace
         * root (or a platform temp area), so the explorer can edit the workspace it
         * browses but not arbitrary host files.
         * @param path - absolute regular file to create or replace.
         * @param content - full new UTF-8 text content.
         * @param signal - caller lifetime; abort stops the write.
         * @returns the write outcome, or a business failure.
         */
        async write(path, content, signal) {
            try {
                const target = await this.ctx.fs.resolve(path, resolveOptions(signal));
                const info = await this.ctx.fs.stat(target, signal);
                if (info !== undefined && info.type === 'directory') {
                    return rejected({ code: 'is-a-directory', path });
                }
                const outcome = await this.ctx.fs.writeText(target, content, undefined, signal);
                return success({
                    operation: outcome.operation,
                    path: this.ctx.fs.processPath(target),
                    byteLength: Buffer.byteLength(content, 'utf8'),
                });
            }
            catch (error) {
                return rejected(narrowFailure(mapFsError(error, path), path, ['path-unavailable', 'is-a-directory', 'permission-denied', 'io-error']));
            }
        }
        /**
         * Reveal one path on the host desktop (show-in-folder: Explorer selection
         * on Windows, Finder reveal on macOS, the parent directory on Linux).
         * More reliable than a bare open for the "open the containing folder"
         * gesture, and it never depends on a file-type association.
         * @param path - absolute path to reveal.
         * @param signal - caller lifetime; abort terminates the reveal command.
         * @returns the canonical revealed path, or a business failure.
         */
        async reveal(path, signal) {
            try {
                const target = await this.ctx.fs.resolve(path, resolveOptions(signal));
                const canonical = this.ctx.fs.processPath(target);
                const { command, args } = revealCommand(canonical);
                await runNativeCommand(command, args, signal ?? new AbortController().signal);
                return success({ path: canonical });
            }
            catch (error) {
                return rejected(narrowFailure(mapFsError(error, path), path, ['path-unavailable', 'permission-denied', 'io-error']));
            }
        }
        /**
         * Open one path with the host's default application (the "open in system"
         * gesture). A dedicated command per platform (Windows `cmd start`) so the
         * gesture never depends on the shared opener seam or an undeclared service.
         * @param path - absolute path to open.
         * @param signal - caller lifetime; abort terminates the open command.
         * @returns the canonical opened path, or a business failure.
         */
        async open(path, signal) {
            try {
                const target = await this.ctx.fs.resolve(path, resolveOptions(signal));
                const canonical = this.ctx.fs.processPath(target);
                const { command, args } = openCommand(canonical);
                await runNativeCommand(command, args, signal ?? new AbortController().signal);
                return success({ path: canonical });
            }
            catch (error) {
                return rejected(narrowFailure(mapFsError(error, path), path, ['path-unavailable', 'permission-denied', 'io-error']));
            }
        }
    };
})();
export { WorkspaceFilesGateway };
export default WorkspaceFilesGateway;
//# sourceMappingURL=index.js.map