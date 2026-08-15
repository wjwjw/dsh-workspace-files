window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-workspace-files",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region \0dsh-css:E:\git_proj\dsh_proj\deepseek-harness\packages\client\ui-workspace-files\src\client\FileRowActions.module.css.mjs
		const css$4 = ".b5jteq_wrap{opacity:1;flex:none;align-items:center;padding-right:4px;display:inline-flex}.b5jteq_trigger{min-width:24px;height:24px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;margin:0;padding:0;line-height:0;display:inline-flex}.b5jteq_trigger:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.b5jteq_trigger:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-border-l3);outline:none}";
		const tagId$4 = "@deepseek-ai/dsh-client-ui-workspace-files/FileRowActions.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-workspace-files";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var FileRowActions_module_css_default = {
			"trigger": "b5jteq_trigger",
			"wrap": "b5jteq_wrap"
		};
		//#endregion
		//#region lib/types/client/FileRowActions.js
		/**
		* Per-row action menu for one file: open in system, reveal in the containing
		* folder, or add the name to the composer. A single always-visible ellipsis
		* opens the shared primitives Menu (portaled, so tree scroll clipping cannot
		* crop it). Open/reveal are always enabled — failures surface as a notice.
		*/
		function FileRowActions({ path, open, openFolder, attach, t }) {
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
			const items = [
				{
					id: "open",
					label: t("row.open"),
					icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRightUpOutline16, {})
				},
				{
					id: "folder",
					label: t("row.openFolder"),
					icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {})
				},
				{
					id: "attach",
					label: t("row.attach"),
					icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconLinkOutline16, {})
				}
			];
			return (0, react_jsx_runtime.jsx)("span", {
				className: FileRowActions_module_css_default.wrap,
				"data-row-actions": true,
				"data-open": menuOpen || void 0,
				children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
					open: menuOpen,
					portal: true,
					align: "end",
					side: "bottom",
					dense: true,
					anchor: (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: FileRowActions_module_css_default.trigger,
						"aria-label": t("row.more"),
						"aria-haspopup": "menu",
						"aria-expanded": menuOpen,
						title: t("row.more"),
						onClick: (event) => {
							event.stopPropagation();
							setMenuOpen(true);
						},
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
					}),
					items,
					onSelect: (id) => {
						setMenuOpen(false);
						if (id === "open") open(path);
						else if (id === "folder") openFolder(path);
						else if (id === "attach") attach(path);
					},
					onClose: () => {
						setMenuOpen(false);
					}
				})
			});
		}
		//#endregion
		//#region lib/types/client/format.js
		/** Byte formatting shared by the tree and the preview (unit names live in the dictionary). */
		/**
		* Format a byte count into the nearest conventional unit.
		* @param bytes - raw byte count (0 stays 0 B).
		* @returns the unit phrase parameters.
		*/
		function formatBytes(bytes) {
			if (bytes < 1024) return {
				key: "bytes.b",
				count: String(bytes)
			};
			if (bytes < 1024 * 1024) return {
				key: "bytes.kb",
				count: String(Math.round(bytes / 1024))
			};
			return {
				key: "bytes.mb",
				count: String((bytes / (1024 * 1024)).toFixed(1))
			};
		}
		//#endregion
		//#region \0dsh-css:E:\git_proj\dsh_proj\deepseek-harness\packages\client\ui-workspace-files\src\client\FileTree.module.css.mjs
		const css$3 = ".yfiY4W_scroll{min-height:0;color:var(--dsw-alias-label-secondary);flex:auto;padding:4px 0 8px;font-size:13px;line-height:22px;overflow:auto}.yfiY4W_rootRow{color:var(--dsw-alias-label-primary);border-radius:6px;align-items:center;gap:6px;margin:0 4px;padding:2px 8px;font-weight:600;display:flex}.yfiY4W_row{box-sizing:border-box;white-space:nowrap;border-radius:6px;align-items:center;width:100%;margin:0;display:flex}.yfiY4W_rowMain{min-width:0;color:inherit;font:inherit;text-align:left;cursor:pointer;white-space:nowrap;background:0 0;border:none;border-radius:6px;flex:auto;align-items:center;gap:6px;margin:0;padding:2px 8px;display:flex}.yfiY4W_row:hover .yfiY4W_rowMain{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.yfiY4W_row[data-selected] .yfiY4W_rowMain{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}.yfiY4W_row:focus-visible,.yfiY4W_rowMain:focus-visible,.yfiY4W_refresh:focus-visible,.yfiY4W_retry:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-border-l3);outline:none}.yfiY4W_row[data-kind=loading]{cursor:default;color:var(--dsw-alias-label-tertiary);padding:2px 8px}.yfiY4W_rowMain[data-kind=directory]{border-radius:6px}.yfiY4W_chevron{color:var(--dsw-alias-label-tertiary);flex:0 0 12px;font-size:11px}.yfiY4W_name{text-overflow:ellipsis;flex:0 auto;min-width:0;overflow:hidden}.yfiY4W_size{color:var(--dsw-alias-label-tertiary);flex:none;margin-left:auto;padding-left:8px;font-size:12px}.yfiY4W_empty{color:var(--dsw-alias-label-tertiary);padding:8px 12px}.yfiY4W_errorRow{color:var(--dsw-alias-label-tertiary);align-items:center;gap:8px;padding:2px 8px;display:flex}.yfiY4W_retry{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border:none;border-radius:4px;flex:none;margin:0;padding:0 6px;line-height:20px}.yfiY4W_retry:hover{color:var(--dsw-alias-label-primary)}.yfiY4W_refresh{color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:none;border-radius:4px;flex:none;margin:0 0 0 auto;padding:2px;line-height:0;display:inline-flex}.yfiY4W_refresh:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.yfiY4W_folder{color:var(--dsw-alias-label-tertiary);flex:none}";
		const tagId$3 = "@deepseek-ai/dsh-client-ui-workspace-files/FileTree.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-workspace-files";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var FileTree_module_css_default = {
			"empty": "yfiY4W_empty",
			"folder": "yfiY4W_folder",
			"retry": "yfiY4W_retry",
			"size": "yfiY4W_size",
			"row": "yfiY4W_row",
			"chevron": "yfiY4W_chevron",
			"name": "yfiY4W_name",
			"errorRow": "yfiY4W_errorRow",
			"rootRow": "yfiY4W_rootRow",
			"rowMain": "yfiY4W_rowMain",
			"scroll": "yfiY4W_scroll",
			"refresh": "yfiY4W_refresh"
		};
		//#endregion
		//#region lib/types/client/FileTree.js
		/**
		* Lazy file tree over the workspace-files Remote. Directories expand on
		* demand (one `list` call per expanded level, cached in component-local
		* state — only the tree knows its loaded listings), hidden rows follow the
		* store toggle, and a non-blank filter swaps the tree for a flat list of
		* matching loaded entries. Pure component: every external fact arrives
		* through props; the listing cache is the tree's own private state.
		*/
		function FileTree(props) {
			const { root, showHidden, filter, expanded, selected, onToggleExpanded, onSelect, onPreview, rowActions, list, t } = props;
			const [levels, setLevels] = (0, react.useState)(() => /* @__PURE__ */ new Map());
			const [loading, setLoading] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [errors, setErrors] = (0, react.useState)(() => /* @__PURE__ */ new Map());
			const [generation, setGeneration] = (0, react.useState)(0);
			const levelsRef = (0, react.useRef)(levels);
			const loadingRef = (0, react.useRef)(loading);
			const errorsRef = (0, react.useRef)(errors);
			levelsRef.current = levels;
			loadingRef.current = loading;
			errorsRef.current = errors;
			const load = (0, react.useCallback)((path) => {
				if (levelsRef.current.has(path) || loadingRef.current.has(path)) return;
				const loadingNext = new Set(loadingRef.current);
				loadingNext.add(path);
				loadingRef.current = loadingNext;
				setLoading(loadingNext);
				list(path, new AbortController().signal).then((result) => {
					const afterLoad = new Set(loadingRef.current);
					afterLoad.delete(path);
					loadingRef.current = afterLoad;
					setLoading(afterLoad);
					if (result.ok) {
						levelsRef.current = new Map(levelsRef.current).set(path, result.value);
						setLevels(levelsRef.current);
					} else {
						errorsRef.current = new Map(errorsRef.current).set(path, result.error);
						setErrors(errorsRef.current);
					}
				}).catch(() => {
					const afterAbort = new Set(loadingRef.current);
					afterAbort.delete(path);
					loadingRef.current = afterAbort;
					setLoading(afterAbort);
				});
			}, [list]);
			const resetAll = (0, react.useCallback)(() => {
				levelsRef.current = /* @__PURE__ */ new Map();
				loadingRef.current = /* @__PURE__ */ new Set();
				errorsRef.current = /* @__PURE__ */ new Map();
				setLevels(levelsRef.current);
				setLoading(loadingRef.current);
				setErrors(errorsRef.current);
			}, []);
			(0, react.useEffect)(() => {
				if (root === null) return;
				resetAll();
				load(root);
			}, [
				root,
				load,
				resetAll
			]);
			(0, react.useEffect)(() => {
				const paths = Object.keys(expanded).filter((path) => expanded[path] === true);
				for (const path of paths) load(path);
			}, [
				expanded,
				generation,
				load
			]);
			const refresh = (0, react.useCallback)(() => {
				if (root === null) return;
				resetAll();
				setGeneration((value) => value + 1);
				load(root);
			}, [
				root,
				resetAll,
				load
			]);
			const retry = (0, react.useCallback)((path) => {
				const errorsNext = new Map(errorsRef.current);
				errorsNext.delete(path);
				errorsRef.current = errorsNext;
				setErrors(errorsNext);
				load(path);
			}, [load]);
			const isVisible = (0, react.useCallback)((entry) => showHidden || !entry.hidden, [showHidden]);
			if (filter.trim().length > 0) {
				const query = filter.trim().toLowerCase();
				const matches = [];
				for (const level of levels.values()) for (const entry of level.entries) if (entry.name.toLowerCase().includes(query)) matches.push(entry);
				if (matches.length === 0) return (0, react_jsx_runtime.jsx)("div", {
					className: FileTree_module_css_default.empty,
					children: t("tree.filterEmpty")
				});
				return (0, react_jsx_runtime.jsx)("div", {
					className: FileTree_module_css_default.scroll,
					role: "tree",
					"aria-label": t("panel.title"),
					children: matches.map((entry) => (0, react_jsx_runtime.jsxs)("div", {
						className: FileTree_module_css_default.row,
						style: { paddingLeft: 12 },
						"data-kind": entry.kind,
						title: entry.path,
						children: [(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: FileTree_module_css_default.rowMain,
							onClick: () => {
								if (entry.kind === "directory") onToggleExpanded(entry.path);
								else {
									onSelect(entry.path);
									onPreview(entry.path);
								}
							},
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: FileTree_module_css_default.chevron,
									"aria-hidden": "true",
									children: entry.kind === "directory" ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, {}) : null
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: FileTree_module_css_default.name,
									children: entry.name
								}),
								entry.kind === "file" && entry.size !== null && (0, react_jsx_runtime.jsx)("span", {
									className: FileTree_module_css_default.size,
									children: t(formatBytes(entry.size).key, { count: formatBytes(entry.size).count })
								})
							]
						}), entry.kind === "file" && (0, react_jsx_runtime.jsx)(FileRowActions, {
							path: entry.path,
							t,
							...rowActions
						})]
					}, entry.path))
				});
			}
			if (root === null) return (0, react_jsx_runtime.jsx)("div", {
				className: FileTree_module_css_default.empty,
				children: t("tree.loading")
			});
			const renderLevel = (dirPath, depth) => {
				const level = levels.get(dirPath);
				const error = errors.get(dirPath);
				if (level === void 0 && loading.has(dirPath)) return (0, react_jsx_runtime.jsx)("div", {
					className: FileTree_module_css_default.row,
					style: { paddingLeft: 12 + depth * 14 },
					"data-kind": "loading",
					children: t("tree.loading")
				});
				if (error !== void 0) return (0, react_jsx_runtime.jsxs)("div", {
					className: FileTree_module_css_default.errorRow,
					style: { paddingLeft: 12 + depth * 14 },
					children: [(0, react_jsx_runtime.jsx)("span", { children: t("tree.unreadable", { path: dirPath }) }), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: FileTree_module_css_default.retry,
						onClick: () => {
							retry(dirPath);
						},
						children: t("tree.retry")
					})]
				});
				if (level === void 0) return null;
				const entries = level.entries.filter(isVisible);
				if (entries.length === 0) return (0, react_jsx_runtime.jsx)("div", {
					className: FileTree_module_css_default.empty,
					style: { paddingLeft: 12 + depth * 14 },
					children: t("tree.empty")
				});
				return (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: entries.map((entry) => {
					if (entry.kind !== "directory") return (0, react_jsx_runtime.jsxs)("div", {
						className: FileTree_module_css_default.row,
						style: { paddingLeft: 12 + depth * 14 },
						"data-kind": "file",
						"data-selected": selected === entry.path || void 0,
						title: entry.path,
						children: [(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: FileTree_module_css_default.rowMain,
							onClick: () => {
								onSelect(entry.path);
								onPreview(entry.path);
							},
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: FileTree_module_css_default.chevron,
									"aria-hidden": "true"
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: FileTree_module_css_default.name,
									children: entry.name
								}),
								entry.size !== null && (0, react_jsx_runtime.jsx)("span", {
									className: FileTree_module_css_default.size,
									children: t(formatBytes(entry.size).key, { count: formatBytes(entry.size).count })
								})
							]
						}), (0, react_jsx_runtime.jsx)(FileRowActions, {
							path: entry.path,
							t,
							...rowActions
						})]
					}, entry.path);
					const isOpen = expanded[entry.path] === true;
					return (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: FileTree_module_css_default.rowMain,
						style: { paddingLeft: 12 + depth * 14 },
						"data-kind": "directory",
						"data-open": isOpen || void 0,
						title: entry.path,
						onClick: () => {
							onToggleExpanded(entry.path);
						},
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: FileTree_module_css_default.chevron,
								"aria-hidden": "true",
								children: isOpen ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, {})
							}),
							isOpen ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, { className: FileTree_module_css_default.folder }) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, { className: FileTree_module_css_default.folder }),
							(0, react_jsx_runtime.jsx)("span", {
								className: FileTree_module_css_default.name,
								children: entry.name
							})
						]
					}), isOpen && renderLevel(entry.path, depth + 1)] }, entry.path);
				}) });
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: FileTree_module_css_default.scroll,
				role: "tree",
				"aria-label": t("panel.title"),
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: FileTree_module_css_default.rootRow,
					"data-kind": "directory",
					children: [
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, { className: FileTree_module_css_default.folder }),
						(0, react_jsx_runtime.jsx)("span", {
							className: FileTree_module_css_default.name,
							children: root
						}),
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: FileTree_module_css_default.refresh,
							onClick: refresh,
							"aria-label": t("tree.refresh"),
							title: t("tree.refresh"),
							children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, {})
						})
					]
				}), renderLevel(root, 0)]
			});
		}
		//#endregion
		//#region lib/types/client/path.js
		/** Path helpers shared by the tree, preview, and modified list (client-side best effort). */
		/** Trailing path segment. */
		function basename(path) {
			const normalized = path.replace(/\\/g, "/").replace(/\/+$/u, "");
			const at = normalized.lastIndexOf("/");
			return at === -1 ? normalized : normalized.slice(at + 1);
		}
		/** Parent directory of a path, or an empty string when there is none. */
		function dirname(path) {
			const normalized = path.replace(/\\/g, "/").replace(/\/+$/u, "");
			const at = normalized.lastIndexOf("/");
			if (at <= 0) return "";
			return normalized.slice(0, at);
		}
		//#endregion
		//#region \0dsh-css:E:\git_proj\dsh_proj\deepseek-harness\packages\client\ui-workspace-files\src\client\FilePreview.module.css.mjs
		const css$2 = "._4qFyYa_preview{flex-direction:column;flex:auto;min-height:0;display:flex}._4qFyYa_header{border-bottom:1px solid var(--dsw-alias-border-l1);flex:none;align-items:center;gap:8px;padding:4px 8px;display:flex}._4qFyYa_back{color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border:none;border-radius:4px;flex:none;margin:0;padding:0 6px;line-height:22px}._4qFyYa_back:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}._4qFyYa_titles{flex-direction:column;flex:auto;min-width:0;line-height:18px;display:flex}._4qFyYa_name{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:13px;overflow:hidden}._4qFyYa_path{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:12px;overflow:hidden}._4qFyYa_open{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border-radius:6px;flex:none;margin:0;padding:1px 8px;font-size:12px;line-height:20px}._4qFyYa_open:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}._4qFyYa_open:focus-visible,._4qFyYa_back:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-border-l3);outline:none}._4qFyYa_content{min-height:0;font-family:var(--dsw-font-mono,monospace);color:var(--dsw-alias-label-secondary);white-space:pre;tab-size:2;flex:auto;margin:0;padding:8px 12px;font-size:12px;line-height:1.5;overflow:auto}._4qFyYa_notice{color:var(--dsw-alias-label-tertiary);padding:8px 12px;font-size:13px;line-height:20px}";
		const tagId$2 = "@deepseek-ai/dsh-client-ui-workspace-files/FilePreview.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-workspace-files";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var FilePreview_module_css_default = {
			"preview": "_4qFyYa_preview",
			"content": "_4qFyYa_content",
			"path": "_4qFyYa_path",
			"back": "_4qFyYa_back",
			"titles": "_4qFyYa_titles",
			"header": "_4qFyYa_header",
			"open": "_4qFyYa_open",
			"name": "_4qFyYa_name",
			"notice": "_4qFyYa_notice"
		};
		//#endregion
		//#region lib/types/client/FilePreview.js
		/**
		* Bounded text preview of one file. Owns its read lifecycle (loading /
		* ready / failure) locally — only the preview knows its own request — and
		* renders the decoded head, a truncation notice, or the business failure.
		*/
		/** Human copy for one business failure code. */
		function failureMessage(failure) {
			switch (failure.code) {
				case "path-unavailable": return "preview.notFound";
				case "not-a-text-file": return "preview.binary";
				default: return "preview.error";
			}
		}
		function FilePreview({ path, canOpenPath, onBack, onOpen, rowActions, read, t }) {
			const [state, setState] = (0, react.useState)({ status: "loading" });
			const request = (0, react.useRef)(0);
			(0, react.useEffect)(() => {
				const id = ++request.current;
				const controller = new AbortController();
				setState({ status: "loading" });
				read(path, controller.signal).then((result) => {
					if (id !== request.current) return;
					if (result.ok) setState({
						status: "ready",
						content: result.value.content,
						truncated: result.value.truncated,
						byteLength: result.value.byteLength
					});
					else setState({
						status: "error",
						failure: result.error
					});
				}).catch(() => {});
				return () => {
					controller.abort();
				};
			}, [path, read]);
			const sizeText = state.status === "ready" ? t(formatBytes(state.byteLength).key, { count: formatBytes(state.byteLength).count }) : "";
			return (0, react_jsx_runtime.jsxs)("div", {
				className: FilePreview_module_css_default.preview,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: FilePreview_module_css_default.header,
						children: [
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: FilePreview_module_css_default.back,
								onClick: onBack,
								"aria-label": t("preview.back"),
								title: t("preview.back"),
								children: "←"
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: FilePreview_module_css_default.titles,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: FilePreview_module_css_default.name,
									children: basename(path)
								}), (0, react_jsx_runtime.jsx)("span", {
									className: FilePreview_module_css_default.path,
									title: path,
									children: path
								})]
							}),
							canOpenPath && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: FilePreview_module_css_default.open,
								onClick: () => {
									onOpen(path);
								},
								title: t("preview.open"),
								children: t("preview.open")
							}),
							(0, react_jsx_runtime.jsx)(FileRowActions, {
								t,
								...rowActions
							})
						]
					}),
					state.status === "loading" && (0, react_jsx_runtime.jsx)("div", {
						className: FilePreview_module_css_default.notice,
						children: t("preview.loading")
					}),
					state.status === "ready" && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("pre", {
						className: FilePreview_module_css_default.content,
						children: state.content
					}), state.truncated && (0, react_jsx_runtime.jsx)("div", {
						className: FilePreview_module_css_default.notice,
						children: t("preview.truncated", { size: sizeText })
					})] }),
					state.status === "error" && (0, react_jsx_runtime.jsx)("div", {
						className: FilePreview_module_css_default.notice,
						children: t(failureMessage(state.failure))
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:E:\git_proj\dsh_proj\deepseek-harness\packages\client\ui-workspace-files\src\client\ModifiedFilesList.module.css.mjs
		const css$1 = ".i4tmjW_list{flex:auto;min-height:0;margin:0;padding:4px 0 8px;font-size:13px;line-height:20px;list-style:none;overflow:auto}.i4tmjW_empty{color:var(--dsw-alias-label-tertiary);padding:8px 12px;font-size:13px;line-height:20px}.i4tmjW_item{box-sizing:border-box;border-radius:6px;align-items:center;width:100%;margin:0;padding:0 4px 0 2px;display:flex}.i4tmjW_item:hover{background:var(--dsw-alias-interactive-bg-hover)}.i4tmjW_row{min-width:0;color:var(--dsw-alias-label-secondary);font:inherit;text-align:left;cursor:pointer;background:0 0;border:none;border-radius:6px;flex:auto;align-items:center;gap:8px;margin:0;padding:3px 4px 3px 8px;display:flex}.i4tmjW_item:hover .i4tmjW_row{color:var(--dsw-alias-label-primary)}.i4tmjW_row:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-border-l3);outline:none}.i4tmjW_dot{background:var(--dsw-alias-label-tertiary);border-radius:50%;flex:0 0 8px;width:8px;height:8px}.i4tmjW_dot[data-state=running]{background:var(--dsw-alias-state-business-primary)}.i4tmjW_dot[data-state=error]{background:var(--dsw-alias-state-error-primary)}.i4tmjW_dot[data-state=ok]{background:var(--dsw-alias-state-success-primary)}.i4tmjW_text{flex-direction:column;flex:auto;min-width:0;display:flex}.i4tmjW_name{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);overflow:hidden}.i4tmjW_dir{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:12px;overflow:hidden}.i4tmjW_meta{flex:none;align-items:center;gap:6px;display:flex}.i4tmjW_tool{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);border-radius:4px;padding:0 6px;font-size:12px;line-height:18px}.i4tmjW_state{color:var(--dsw-alias-label-tertiary);font-size:12px}.i4tmjW_state[data-state=running]{color:var(--dsw-alias-state-business-primary)}.i4tmjW_state[data-state=error]{color:var(--dsw-alias-state-error-primary)}";
		const tagId$1 = "@deepseek-ai/dsh-client-ui-workspace-files/ModifiedFilesList.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-workspace-files";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var ModifiedFilesList_module_css_default = {
			"dir": "i4tmjW_dir",
			"state": "i4tmjW_state",
			"meta": "i4tmjW_meta",
			"dot": "i4tmjW_dot",
			"tool": "i4tmjW_tool",
			"empty": "i4tmjW_empty",
			"row": "i4tmjW_row",
			"text": "i4tmjW_text",
			"item": "i4tmjW_item",
			"list": "i4tmjW_list",
			"name": "i4tmjW_name"
		};
		//#endregion
		//#region lib/types/client/ModifiedFilesList.js
		/** Operation badge copy key: 新增 when created, 编辑 when edited in place. */
		function operationKey(operation) {
			return operation === "create" ? "modified.created" : "modified.edited";
		}
		function ModifiedFilesList({ files, hasSession, archived, onReveal, rowActions, t }) {
			if (!hasSession) return (0, react_jsx_runtime.jsx)("div", {
				className: ModifiedFilesList_module_css_default.empty,
				children: t("modified.noSession")
			});
			if (files.length === 0) return (0, react_jsx_runtime.jsx)("div", {
				className: ModifiedFilesList_module_css_default.empty,
				children: t(archived ? "modified.archivedEmpty" : "modified.empty")
			});
			return (0, react_jsx_runtime.jsx)("ul", {
				className: ModifiedFilesList_module_css_default.list,
				children: files.map((file) => (0, react_jsx_runtime.jsxs)("li", {
					className: ModifiedFilesList_module_css_default.item,
					title: file.path,
					children: [(0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: ModifiedFilesList_module_css_default.row,
						"data-state": file.state,
						onClick: () => {
							onReveal(file.path);
						},
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: ModifiedFilesList_module_css_default.dot,
								"aria-hidden": "true",
								"data-state": file.state
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								className: ModifiedFilesList_module_css_default.text,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: ModifiedFilesList_module_css_default.name,
									children: basename(file.path)
								}), (0, react_jsx_runtime.jsx)("span", {
									className: ModifiedFilesList_module_css_default.dir,
									children: dirname(file.path)
								})]
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								className: ModifiedFilesList_module_css_default.meta,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: ModifiedFilesList_module_css_default.tool,
									"data-tool": file.operation,
									children: t(operationKey(file.operation))
								}), (0, react_jsx_runtime.jsx)("span", {
									className: ModifiedFilesList_module_css_default.state,
									"data-state": file.state,
									children: file.state === "running" ? t("modified.running") : file.state === "error" ? t("modified.failed") : new Date(file.time).toLocaleTimeString()
								})]
							})
						]
					}), (0, react_jsx_runtime.jsx)(FileRowActions, {
						path: file.path,
						t,
						...rowActions
					})]
				}, `${file.path}:${file.tool}:${file.time}`))
			});
		}
		//#endregion
		//#region \0dsh-css:E:\git_proj\dsh_proj\deepseek-harness\packages\client\ui-workspace-files\src\client\WorkspaceFilesDock.module.css.mjs
		const css = ".webtVW_root{z-index:21;display:flex;position:absolute;top:0;bottom:0;right:0}.webtVW_root:not([data-open]){width:28px}.webtVW_tab{border:1px solid var(--dsw-alias-border-l2-darkmode-thin);background:var(--dsw-alias-button-floating-fill);width:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;border-right:none;border-radius:10px 0 0 10px;justify-content:center;align-self:center;align-items:center;margin:0;padding:10px 0;display:inline-flex}.webtVW_tab:hover{background:var(--dsw-alias-button-floating-hover);color:var(--dsw-alias-label-primary)}.webtVW_tab:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-border-l3);outline:none}.webtVW_panel{background:var(--dsw-alias-bg-layer-2);border-left:1px solid var(--dsw-alias-border-l2);flex-direction:column;width:100%;min-width:0;height:100%;display:none;position:relative;box-shadow:-8px 0 24px #00000014}.webtVW_panel[data-open]{display:flex}.webtVW_notice{background:var(--dsw-alias-tooltip-bg);max-width:calc(100% - 24px);color:var(--dsw-alias-label-primary);white-space:nowrap;text-overflow:ellipsis;z-index:3;border-radius:8px;padding:3px 10px;font-size:12px;line-height:18px;position:absolute;bottom:10px;left:50%;overflow:hidden;transform:translate(-50%);box-shadow:0 4px 12px #00000029}.webtVW_header{border-bottom:1px solid var(--dsw-alias-border-l1);flex:none;align-items:center;gap:6px;padding:6px 8px;display:flex}.webtVW_title{color:var(--dsw-alias-label-primary);flex:none;font-size:13px;font-weight:600}.webtVW_search{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);min-width:0;color:var(--dsw-alias-label-tertiary);border-radius:6px;flex:auto;align-items:center;gap:4px;padding:0 6px;display:inline-flex}.webtVW_search:focus-within{border-color:var(--dsw-alias-border-l3)}.webtVW_searchIcon{flex:none}.webtVW_filter{min-width:0;color:var(--dsw-alias-label-primary);font:inherit;background:0 0;border:none;flex:auto;margin:0;padding:2px 0;font-size:12px;line-height:20px}.webtVW_filter:focus{outline:none}.webtVW_pill{border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border-radius:6px;flex:none;margin:0;padding:1px 8px;font-size:12px;line-height:20px}.webtVW_pill:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}.webtVW_pill[data-active]{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}.webtVW_iconBtn{color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:6px;flex:none;justify-content:center;align-items:center;margin:0;padding:3px;display:inline-flex}.webtVW_iconBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.webtVW_iconBtn:focus-visible,.webtVW_pill:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-border-l3);outline:none}.webtVW_body{flex:auto;min-height:0;display:grid}.webtVW_upper{flex-direction:column;min-height:0;display:flex;overflow:hidden}.webtVW_lower{border-top:none;flex-direction:column;min-height:0;display:flex;overflow:hidden}.webtVW_divider{cursor:row-resize;touch-action:none;background:0 0}.webtVW_divider:hover{background:var(--dsw-alias-border-l2)}.webtVW_sectionHeader{flex:none;align-items:center;gap:6px;padding:6px 10px 4px;display:flex}.webtVW_sectionTitle{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:600}.webtVW_count{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-tertiary);border-radius:8px;padding:0 6px;font-size:11px;line-height:16px}.webtVW_widthHandle{cursor:col-resize;touch-action:none;z-index:2;width:8px;position:absolute;top:0;bottom:0;left:-4px}";
		const tagId = "@deepseek-ai/dsh-client-ui-workspace-files/WorkspaceFilesDock.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-workspace-files";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var WorkspaceFilesDock_module_css_default = {
			"widthHandle": "webtVW_widthHandle",
			"title": "webtVW_title",
			"notice": "webtVW_notice",
			"body": "webtVW_body",
			"search": "webtVW_search",
			"searchIcon": "webtVW_searchIcon",
			"pill": "webtVW_pill",
			"divider": "webtVW_divider",
			"sectionTitle": "webtVW_sectionTitle",
			"panel": "webtVW_panel",
			"tab": "webtVW_tab",
			"iconBtn": "webtVW_iconBtn",
			"upper": "webtVW_upper",
			"filter": "webtVW_filter",
			"count": "webtVW_count",
			"lower": "webtVW_lower",
			"sectionHeader": "webtVW_sectionHeader",
			"root": "webtVW_root",
			"header": "webtVW_header"
		};
		//#endregion
		//#region lib/types/client/WorkspaceFilesDock.js
		/**
		* Right-docked workspace explorer: the shell.overlay entry. A floating tab
		* opens a panel holding the file tree (or a preview / editor) above a
		* draggable divider and the modified-files list below. The panel stays
		* mounted while closed (display:none preserves React state) so the tree keeps
		* its loaded listings; width and split geometry are store state.
		*/
		function WorkspaceFilesDock({ useStore, actions, useHostDescription, useModifiedFiles, useSessions, t, isLoopback, list, read, open, reveal, addToComposer }) {
			const state = useStore((s) => s);
			const modified = useModifiedFiles((files) => files);
			const cwd = useHostDescription((description) => description?.cwd ?? null);
			const hostCanOpenPath = useHostDescription((description) => description?.canOpenPath === true);
			const canOpenPath = isLoopback && hostCanOpenPath;
			const hasSession = useSessions((s) => s.current !== void 0);
			const bodyRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (state.notice === null) return;
				const id = window.setTimeout(() => {
					actions.setNotice(null);
				}, 4e3);
				return () => {
					window.clearTimeout(id);
				};
			}, [state.notice, actions]);
			const revealInTree = (0, react.useCallback)((path) => {
				actions.expandPath(path);
				actions.setPreview(path);
			}, [actions]);
			/** The shared row-level verb set (failures surface as a notice line). */
			const rowActions = (0, react.useCallback)(() => ({
				open: (path) => {
					open(path).catch(() => {
						actions.setNotice(t("row.openFailed"));
					});
				},
				openFolder: (path) => {
					reveal(path).catch(() => {
						actions.setNotice(t("row.openFailed"));
					});
				},
				attach: (path) => {
					addToComposer(path).then((result) => {
						actions.setNotice(result.ok ? t("row.addedToInput") : t("row.attachNoSession"));
					});
				}
			}), [
				open,
				reveal,
				addToComposer,
				actions,
				t
			]);
			const archiveSeq = state.archiveSeq;
			const visibleModified = archiveSeq === null ? modified : modified.filter((file) => file.seq > archiveSeq);
			const archiveNow = (0, react.useCallback)(() => {
				actions.archive(modified);
				actions.setNotice(t("modified.archived"));
			}, [
				actions,
				modified,
				t
			]);
			const onWidthPointerDown = (0, react.useCallback)((event) => {
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				const startX = event.clientX;
				const startWidth = state.width;
				const move = (moveEvent) => {
					actions.setWidth(startWidth + (startX - moveEvent.clientX));
				};
				const up = () => {
					window.removeEventListener("pointermove", move);
					window.removeEventListener("pointerup", up);
				};
				window.addEventListener("pointermove", move);
				window.addEventListener("pointerup", up);
			}, [state.width, actions]);
			const onSplitPointerDown = (0, react.useCallback)((event) => {
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				const body = bodyRef.current;
				if (body === null) return;
				const rect = body.getBoundingClientRect();
				const startTop = event.clientY - rect.top;
				const height = rect.height;
				const move = (moveEvent) => {
					if (height <= 0) return;
					const ratio = (startTop + (moveEvent.clientY - event.clientY)) / height;
					actions.setSplit(ratio);
				};
				const up = () => {
					window.removeEventListener("pointermove", move);
					window.removeEventListener("pointerup", up);
				};
				window.addEventListener("pointermove", move);
				window.addEventListener("pointerup", up);
			}, [actions]);
			const splitPx = Math.round(state.split * 100);
			const showPreview = state.preview !== null;
			const face = rowActions();
			return (0, react_jsx_runtime.jsxs)("div", {
				className: WorkspaceFilesDock_module_css_default.root,
				"data-open": state.open || void 0,
				style: state.open ? { width: state.width } : void 0,
				children: [
					!state.open && (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: WorkspaceFilesDock_module_css_default.tab,
						onClick: () => {
							actions.setOpen(true);
						},
						"aria-label": t("dock.toggle"),
						title: t("dock.toggle"),
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBrowseOutline16, { size: 18 })
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: WorkspaceFilesDock_module_css_default.panel,
						"data-open": state.open || void 0,
						children: [
							(0, react_jsx_runtime.jsxs)("div", {
								className: WorkspaceFilesDock_module_css_default.header,
								children: [
									(0, react_jsx_runtime.jsx)("span", {
										className: WorkspaceFilesDock_module_css_default.title,
										children: t("panel.title")
									}),
									(0, react_jsx_runtime.jsxs)("span", {
										className: WorkspaceFilesDock_module_css_default.search,
										children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { className: WorkspaceFilesDock_module_css_default.searchIcon }), (0, react_jsx_runtime.jsx)("input", {
											className: WorkspaceFilesDock_module_css_default.filter,
											value: state.filter,
											placeholder: t("tree.filter"),
											"aria-label": t("tree.filter"),
											onChange: (event) => {
												actions.setFilter(event.currentTarget.value);
											}
										})]
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: WorkspaceFilesDock_module_css_default.pill,
										"data-active": state.showHidden || void 0,
										onClick: () => {
											actions.toggleShowHidden();
										},
										title: t("tree.showHidden"),
										"aria-pressed": state.showHidden,
										children: t("tree.showHidden")
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: WorkspaceFilesDock_module_css_default.pill,
										onClick: () => {
											actions.collapseAll();
										},
										title: t("tree.collapseAll"),
										children: t("tree.collapseAll")
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: WorkspaceFilesDock_module_css_default.iconBtn,
										onClick: () => {
											actions.setOpen(false);
										},
										title: t("panel.close"),
										"aria-label": t("panel.close"),
										children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
									})
								]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								ref: bodyRef,
								className: WorkspaceFilesDock_module_css_default.body,
								style: { gridTemplateRows: `${splitPx}fr 4px ${100 - splitPx}fr` },
								children: [
									(0, react_jsx_runtime.jsx)("div", {
										className: WorkspaceFilesDock_module_css_default.upper,
										"data-workspace-files": "tree",
										children: showPreview ? (0, react_jsx_runtime.jsx)(FilePreview, {
											path: state.preview,
											canOpenPath,
											onBack: () => {
												actions.setPreview(null);
											},
											onOpen: (path) => {
												face.open(path);
											},
											rowActions: {
												path: state.preview,
												...face
											},
											read,
											t
										}) : (0, react_jsx_runtime.jsx)(FileTree, {
											root: cwd,
											showHidden: state.showHidden,
											filter: state.filter,
											expanded: state.expanded,
											selected: state.selected,
											onToggleExpanded: (path) => {
												actions.toggleExpanded(path);
											},
											onSelect: (path) => {
												actions.select(path);
											},
											onPreview: (path) => {
												actions.setPreview(path);
											},
											rowActions: face,
											list,
											t
										})
									}),
									(0, react_jsx_runtime.jsx)("div", {
										className: WorkspaceFilesDock_module_css_default.divider,
										role: "separator",
										"aria-orientation": "horizontal",
										onPointerDown: onSplitPointerDown
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: WorkspaceFilesDock_module_css_default.lower,
										"data-workspace-files": "modified",
										children: [(0, react_jsx_runtime.jsxs)("div", {
											className: WorkspaceFilesDock_module_css_default.sectionHeader,
											children: [
												(0, react_jsx_runtime.jsx)("span", {
													className: WorkspaceFilesDock_module_css_default.sectionTitle,
													children: t("modified.title")
												}),
												visibleModified.length > 0 && (0, react_jsx_runtime.jsx)("span", {
													className: WorkspaceFilesDock_module_css_default.count,
													children: visibleModified.length
												}),
												(0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: WorkspaceFilesDock_module_css_default.pill,
													"data-active": state.archiveSeq !== null || void 0,
													onClick: archiveNow,
													title: t("modified.archiveHint"),
													children: t("modified.archive")
												})
											]
										}), (0, react_jsx_runtime.jsx)(ModifiedFilesList, {
											files: visibleModified,
											hasSession,
											archived: state.archiveSeq !== null,
											onReveal: revealInTree,
											rowActions: face,
											t
										})]
									})
								]
							}),
							state.notice !== null && (0, react_jsx_runtime.jsx)("div", {
								className: WorkspaceFilesDock_module_css_default.notice,
								role: "status",
								children: state.notice
							})
						]
					}),
					state.open && (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceFilesDock_module_css_default.widthHandle,
						role: "separator",
						"aria-orientation": "vertical",
						onPointerDown: onWidthPointerDown
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** `workspace-files` namespace dictionaries. */
		/** Dictionary namespace owned by this plugin. */
		const NS = "workspace-files";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"dock.toggle": "打开文件浏览器",
			"panel.title": "工作区文件",
			"panel.close": "关闭文件浏览器",
			"tree.refresh": "刷新",
			"tree.collapseAll": "全部折叠",
			"tree.showHidden": "显示隐藏文件",
			"tree.filter": "筛选当前已加载的文件…",
			"tree.filterEmpty": "没有匹配的文件",
			"tree.loading": "加载中…",
			"tree.empty": "空目录",
			"tree.error": "无法读取该目录",
			"tree.retry": "重试",
			"tree.unreadable": "无法读取 {path}",
			"preview.title": "预览",
			"preview.back": "返回文件树",
			"preview.open": "在系统中打开",
			"preview.openFailed": "打开失败",
			"preview.loading": "读取中…",
			"preview.truncated": "文件约 {size}，仅支持预览前 256 KiB",
			"preview.binary": "二进制文件，无法预览",
			"preview.error": "读取失败：{message}",
			"preview.notFound": "文件不存在或已被移动",
			"modified.title": "对话修改的文件",
			"modified.empty": "本会话尚未修改文件",
			"modified.noSession": "打开一个会话后显示其修改的文件",
			"modified.running": "运行中",
			"modified.failed": "失败",
			"modified.created": "新增",
			"modified.edited": "编辑",
			"modified.reveal": "在文件树中定位并预览",
			"modified.archive": "存档",
			"modified.archiveHint": "从此刻起重新计算修改文件列表",
			"modified.archived": "已存档，列表从此刻重新计算",
			"modified.archivedEmpty": "存档点之后暂无修改",
			"row.more": "更多操作",
			"row.open": "在系统中打开",
			"row.openFolder": "打开所在文件夹",
			"row.attach": "加到对话中",
			"row.openFailed": "打开失败",
			"row.addedToInput": "已把文件名加入输入框",
			"row.attachNoSession": "没有打开的会话",
			"bytes.b": "{count} B",
			"bytes.kb": "{count} KB",
			"bytes.mb": "{count} MB"
		};
		/** English dictionary (same key set). */
		const en = {
			"dock.toggle": "Open file explorer",
			"panel.title": "Workspace files",
			"panel.close": "Close file explorer",
			"tree.refresh": "Refresh",
			"tree.collapseAll": "Collapse all",
			"tree.showHidden": "Show hidden files",
			"tree.filter": "Filter loaded files…",
			"tree.filterEmpty": "No matching files",
			"tree.loading": "Loading…",
			"tree.empty": "Empty directory",
			"tree.error": "Cannot read this directory",
			"tree.retry": "Retry",
			"tree.unreadable": "Cannot read {path}",
			"preview.title": "Preview",
			"preview.back": "Back to file tree",
			"preview.open": "Open in system",
			"preview.openFailed": "Failed to open",
			"preview.loading": "Reading…",
			"preview.truncated": "File is about {size}; only the first 256 KiB can be previewed",
			"preview.binary": "Binary file, cannot preview",
			"preview.error": "Read failed: {message}",
			"preview.notFound": "File does not exist or was moved",
			"modified.title": "Files modified in conversation",
			"modified.empty": "No files modified in this session yet",
			"modified.noSession": "Open a session to see the files it modified",
			"modified.running": "Running",
			"modified.failed": "Failed",
			"modified.created": "New",
			"modified.edited": "Edited",
			"modified.reveal": "Reveal and preview in the file tree",
			"modified.archive": "Archive",
			"modified.archiveHint": "Recompute the modified-file list from this moment",
			"modified.archived": "Archived — the list now starts from this moment",
			"modified.archivedEmpty": "No changes since the archive point",
			"row.more": "More actions",
			"row.open": "Open in system",
			"row.openFolder": "Open containing folder",
			"row.attach": "Add to conversation",
			"row.openFailed": "Failed to open",
			"row.addedToInput": "File name added to the input",
			"row.attachNoSession": "No open session",
			"bytes.b": "{count} B",
			"bytes.kb": "{count} KB",
			"bytes.mb": "{count} MB"
		};
		//#endregion
		//#region lib/types/client/modified-files.js
		/**
		* Session-scoped derivation of the files the current conversation modified.
		* A pure function over the conversation snapshot plus a registrant-private
		* Reactive source that republishes it for the current session — the modified
		* list is derived data, never its own subscription (web client AGENTS.md).
		*
		* The vocabulary is the mutation tools' own `file_path` argument, not the
		* closing prose: a modified file is listed whether or not the model named it.
		* `write` and `edit` (dsh-tool-fs) are the Web roster's mutation tools; a new
		* mutation tool joins by declaring itself here.
		*
		* Window retention: the source keeps a call-keyed table across conversation
		* window changes. A file whose events scroll out of the window (older history
		* truncation, reconnect window replacement) stays listed — the entry is only
		* dropped when the session itself changes. The pure derivations below remain
		* window-scoped views; retention lives in `createModifiedFilesSource`.
		*/
		/** The mutation tools whose successful calls count as modifying a file. */
		const MUTATION_TOOLS = new Set(["write", "edit"]);
		/** Stable empty list shared by every no-session/no-modification publication. */
		const EMPTY_MODIFIED_FILES = [];
		/** The archive cutoff for an in-flight call: always after any archive point. */
		const RUNNING_SEQ = Number.POSITIVE_INFINITY;
		/** Settlement rank: a later state supersedes an earlier one (error > ok > running). */
		const STATE_RANK = {
			running: 0,
			ok: 1,
			error: 2
		};
		/** Paths that look absolute: a POSIX root or a Windows drive root. */
		function isAbsolutePath(path) {
			return path.startsWith("/") || /^[A-Za-z]:[\\/]/.test(path);
		}
		/** Normalize a path for display: forward slashes except the drive colon. */
		function normalizePath(path) {
			return path.replace(/\\/g, "/");
		}
		/**
		* Resolve a tool-reported path against the session cwd when it is relative.
		* Client-side best effort only: the host's `resolve` remains authoritative;
		* symlinks and `..` segments stay unnormalized (documented limitation).
		*/
		function resolveAgainstCwd(cwd, path) {
			const normalized = normalizePath(path);
			if (cwd === void 0 || isAbsolutePath(normalized)) return normalized;
			const base = normalizePath(cwd).replace(/\/+$/u, "");
			const rest = normalized.replace(/^\/+/u, "");
			return rest.length === 0 ? base : `${base}/${rest}`;
		}
		/** Extract the mutation target path from a raw tool `arguments` JSON string. */
		function pathFromArgs(name, argsRaw) {
			if (!MUTATION_TOOLS.has(name)) return void 0;
			let parsed;
			try {
				parsed = JSON.parse(argsRaw);
			} catch {
				return;
			}
			if (typeof parsed !== "object" || parsed === null) return void 0;
			const filePath = parsed.file_path;
			if (typeof filePath !== "string" || filePath.trim().length === 0) return void 0;
			return filePath;
		}
		/**
		* Whether a `write` call created the file, from its result metadata: the
		* write tool's `presentationMeta` carries an empty `diffs` list exactly when
		* the file did not exist before (before === null). Absent metadata (older
		* logs, other call heads) reports nothing; the caller falls back to update.
		*/
		function writeOperationFromMeta(meta) {
			if (typeof meta !== "object" || meta === null) return void 0;
			const diffs = meta.diffs;
			if (Array.isArray(diffs) && diffs.length === 0) return "create";
			if (Array.isArray(diffs)) return "update";
		}
		/**
		* Merge one freshly observed call record into a call-keyed table (a window
		* derivation or the source's retained table). Settlement rank decides first
		* (error outranks ok outranks running); within a rank the later event (higher
		* seq) wins, so a settled result supersedes its provisional head and carries
		* the write diff-derived operation. First-seen insertion order is preserved
		* (Map insert keeps the original position on overwrite).
		*/
		function mergeCallRecord(calls, next) {
			const existing = calls.get(next.callId);
			if (existing === void 0) {
				calls.set(next.callId, next);
				return;
			}
			if (STATE_RANK[next.state] < STATE_RANK[existing.state]) return;
			if (STATE_RANK[next.state] > STATE_RANK[existing.state] || next.seq >= existing.seq) calls.set(next.callId, next);
		}
		/**
		* Derive call-keyed mutation records from one conversation snapshot.
		*
		* Sources, all keyed by call id so the same call never double-lists:
		* - finalized assistant tool-call blocks (provisional ok),
		* - settled tool results (authoritative ok/error; a result with a lost call
		*   head — `node.call === null` — is skipped, the retained head stays),
		* - still-running calls (running).
		*
		* @param snapshot - the session's current conversation snapshot.
		* @param cwd - the session's working directory (relative targets resolve against it).
		* @returns per-call records in first-seen call order.
		*/
		function deriveModifiedCalls(snapshot, cwd) {
			const calls = /* @__PURE__ */ new Map();
			for (const node of snapshot.nodes) switch (node.kind) {
				case "assistant":
					for (const block of node.blocks) {
						if (block.kind !== "tool-call") continue;
						const path = pathFromArgs(block.name, block.argsRaw);
						if (path === void 0) continue;
						mergeCallRecord(calls, {
							callId: block.callId,
							path: resolveAgainstCwd(cwd, path),
							tool: block.name,
							time: node.time,
							seq: node.seq,
							state: "ok"
						});
					}
					break;
				case "tool-result": {
					if (node.call === null) break;
					const path = pathFromArgs(node.call.name, node.call.argsRaw);
					if (path === void 0) break;
					const operation = node.call.name === "write" ? writeOperationFromMeta(node.meta) : "update";
					mergeCallRecord(calls, {
						callId: node.callId,
						path: resolveAgainstCwd(cwd, path),
						tool: node.call.name,
						...operation !== void 0 ? { operation } : {},
						time: node.time,
						seq: node.seq,
						state: node.isError ? "error" : "ok"
					});
					break;
				}
				default: break;
			}
			for (const call of snapshot.runningCalls) {
				const path = pathFromArgs(call.name, call.argsRaw);
				if (path === void 0) continue;
				mergeCallRecord(calls, {
					callId: call.callId,
					path: resolveAgainstCwd(cwd, path),
					tool: call.name,
					time: call.time,
					seq: RUNNING_SEQ,
					state: "running"
				});
			}
			return [...calls.values()];
		}
		/**
		* Project call records to the display list. Paths keep first-seen order and
		* appear once; a file written then edited is one entry carrying the later
		* call's data. Settlement rank governs the overwrite just as it does the
		* merge: a settled outcome outranks a running follow-up on the same path, so
		* a file that was successfully edited earlier does not flicker back to
		* "running" while a later edit is in flight.
		* @param calls - call records in first-seen order.
		* @returns the display list, one entry per distinct path.
		*/
		function projectModifiedFiles(calls) {
			const result = [];
			for (const mutation of calls) {
				const entry = {
					path: mutation.path,
					tool: mutation.tool,
					operation: mutation.operation ?? "update",
					time: mutation.time,
					seq: mutation.seq,
					state: mutation.state
				};
				const existing = result.findIndex((item) => item.path === entry.path);
				if (existing === -1) result.push(entry);
				else {
					const current = result[existing];
					if (current === void 0 || STATE_RANK[mutation.state] >= STATE_RANK[current.state]) result[existing] = entry;
				}
			}
			return result;
		}
		/**
		* Build the registrant-private Reactive source publishing the current
		* session's modified-file list. Subscribes to the global session list (the
		* current-selection authority) and to the bound session's conversation
		* snapshot, and republishes a fresh immutable list whenever either changes.
		*
		* Retention: the source keeps a call-keyed table for the current session and
		* merges every window derivation into it, so entries survive their events
		* leaving the window (truncation, reconnect window replacement). The table is
		* reset when the selection changes; `archiveSeq`-style pruning is left to the
		* caller (the dock's store filters by `seq`).
		*
		* @param sessions - the client sessions service.
		* @returns a HostObservable the renderer binds as `useModifiedFiles`, plus a
		*   `dispose` that releases both subscriptions (wired to the plugin fiber).
		*/
		function createModifiedFilesSource(sessions) {
			let snapshot = EMPTY_MODIFIED_FILES;
			const listeners = /* @__PURE__ */ new Set();
			let current;
			let unsubscribeSession;
			/** Per-session retained call table; reset on selection change. */
			let retained = /* @__PURE__ */ new Map();
			let disposed = false;
			const publish = (next) => {
				if (next === snapshot) return;
				snapshot = next;
				for (const listener of [...listeners]) listener();
			};
			const refresh = () => {
				if (disposed) return;
				const list = sessions.list.getSnapshot();
				const id = list.current;
				if (id !== current) {
					current = id;
					retained = /* @__PURE__ */ new Map();
					unsubscribeSession?.();
					unsubscribeSession = void 0;
				}
				if (current === void 0) {
					publish(EMPTY_MODIFIED_FILES);
					return;
				}
				const binding = sessions.binding(current);
				if (binding === void 0) {
					publish(EMPTY_MODIFIED_FILES);
					return;
				}
				if (unsubscribeSession === void 0) unsubscribeSession = binding.session.subscribe(refresh);
				const conversation = binding.session.getSnapshot();
				for (const record of deriveModifiedCalls(conversation, list.byId[current]?.cwd)) mergeCallRecord(retained, record);
				for (const node of conversation.nodes) {
					if (node.kind !== "tool-result" || node.call !== null) continue;
					const existing = retained.get(node.callId);
					if (existing === void 0) continue;
					mergeCallRecord(retained, {
						...existing,
						time: node.time,
						seq: node.seq,
						state: node.isError ? "error" : "ok"
					});
				}
				publish(projectModifiedFiles([...retained.values()]));
			};
			const unsubscribeList = sessions.list.subscribe(refresh);
			refresh();
			return {
				getSnapshot: () => snapshot,
				subscribe(listener) {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				dispose() {
					disposed = true;
					unsubscribeList();
					unsubscribeSession?.();
					listeners.clear();
				}
			};
		}
		/** Tree share of the vertical split (the modified list takes the remainder). */
		const SPLIT_DEFAULT = .58;
		function clamp(value, min, max) {
			return Math.min(max, Math.max(min, value));
		}
		function createWorkspaceFilesStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					open: false,
					width: 380,
					split: SPLIT_DEFAULT,
					showHidden: false,
					expanded: {},
					selected: null,
					preview: null,
					archiveSeq: null,
					notice: null,
					filter: ""
				}),
				actions: {
					setOpen: (d, open) => {
						d.open = open;
					},
					toggleOpen: (d) => {
						d.open = !d.open;
					},
					setWidth: (d, px) => {
						d.width = clamp(Math.round(px), 320, 560);
					},
					setSplit: (d, ratio) => {
						d.split = clamp(ratio, .2, .8);
					},
					toggleShowHidden: (d) => {
						d.showHidden = !d.showHidden;
					},
					setExpanded: (d, path, expanded) => {
						d.expanded = {
							...d.expanded,
							[path]: expanded
						};
					},
					toggleExpanded: (d, path) => {
						d.expanded = {
							...d.expanded,
							[path]: d.expanded[path] !== true
						};
					},
					/** Expand every ancestor directory of `path` so the file becomes visible. */
					expandPath: (d, path) => {
						const segments = path.split("/").filter(Boolean);
						const next = {};
						let acc = "";
						for (const segment of segments.slice(0, -1)) {
							acc += `/${segment}`;
							next[acc] = true;
						}
						d.expanded = {
							...d.expanded,
							...next
						};
					},
					collapseAll: (d) => {
						d.expanded = {};
					},
					select: (d, path) => {
						d.selected = path;
					},
					setPreview: (d, path) => {
						d.preview = path;
						if (path !== null) d.selected = path;
					},
					/**
					* Record an archive point from the current modified list: the list is
					* recomputed from the newest logged modification onward. Re-archiving
					* moves the point forward.
					* @param files - the current derived list (the archive consumes it).
					*/
					archive: (d, files) => {
						d.archiveSeq = files.reduce((max, file) => Number.isFinite(file.seq) ? Math.max(max, file.seq) : max, 0);
					},
					setNotice: (d, text) => {
						d.notice = text;
					},
					setFilter: (d, text) => {
						d.filter = text;
					}
				}
			});
		}
		//#endregion
		//#region lib/types/client/index.js
		/** Required services for the overlay registration, its dictionaries, and its callbacks. */
		const inject = [
			"slots",
			"locale",
			"connection",
			"sessions",
			"conversation",
			"remote",
			"remote.workspaceFiles"
		];
		/**
		* Client plugin body: register the dictionaries and the overlay dock entry.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-workspace-files: dictionaries");
			const connection = ctx.get("connection");
			const modifiedFiles = createModifiedFilesSource(ctx.sessions);
			ctx.effect(() => () => {
				modifiedFiles.dispose();
			}, "ui-workspace-files: modified-files source");
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "workspace-files",
				order: 0,
				locale: NS,
				store: createWorkspaceFilesStore,
				inject: () => ({
					isLoopback: connection.isLoopback,
					hooks: {
						hostDescription: connection.hostDescription,
						modifiedFiles
					},
					list: async (path, signal) => {
						const result = await ctx.remote.workspaceFiles.list(path, signal);
						return result.ok ? result.value : {
							ok: false,
							error: {
								code: "io-error",
								path
							}
						};
					},
					read: async (path, signal) => {
						const result = await ctx.remote.workspaceFiles.read(path, signal);
						return result.ok ? result.value : {
							ok: false,
							error: {
								code: "io-error",
								path
							}
						};
					},
					open: async (path) => {
						const result = await ctx.remote.workspaceFiles.open(path, new AbortController().signal);
						if (result.ok && result.value.ok) return;
						throw new Error("open failed");
					},
					reveal: async (path) => {
						const result = await ctx.remote.workspaceFiles.reveal(path, new AbortController().signal);
						if (result.ok && result.value.ok) return;
						throw new Error("reveal failed");
					},
					addToComposer: (path) => {
						const current = ctx.sessions.list.getSnapshot().current;
						const scope = current === void 0 ? void 0 : ctx.sessions.scope(current);
						if (scope === void 0) return Promise.resolve({
							ok: false,
							error: {
								code: "no-session",
								message: "no current session"
							}
						});
						const name = basename(path);
						const input = ctx.conversation.input.for(scope);
						const existing = input.state.getSnapshot().draft;
						input.setDraft(existing.trim() === "" ? name : `${existing} ${name}`);
						return Promise.resolve({ ok: true });
					}
				})
			}, WorkspaceFilesDock));
		}
		//#endregion
		exports.apply = apply;
		exports.createWorkspaceFilesStore = createWorkspaceFilesStore;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map