/** Path helpers shared by the tree, preview, and modified list (client-side best effort). */

/** Trailing path segment. */
export function basename(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/\/+$/u, '')
  const at = normalized.lastIndexOf('/')
  return at === -1 ? normalized : normalized.slice(at + 1)
}

/** Parent directory of a path, or an empty string when there is none. */
export function dirname(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/\/+$/u, '')
  const at = normalized.lastIndexOf('/')
  if (at <= 0) return ''
  return normalized.slice(0, at)
}
