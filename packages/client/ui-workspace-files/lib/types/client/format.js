/** Byte formatting shared by the tree and the preview (unit names live in the dictionary). */
/**
 * Format a byte count into the nearest conventional unit.
 * @param bytes - raw byte count (0 stays 0 B).
 * @returns the unit phrase parameters.
 */
export function formatBytes(bytes) {
    if (bytes < 1024)
        return { key: 'bytes.b', count: String(bytes) };
    if (bytes < 1024 * 1024)
        return { key: 'bytes.kb', count: String(Math.round(bytes / 1024)) };
    return { key: 'bytes.mb', count: String((bytes / (1024 * 1024)).toFixed(1)) };
}
//# sourceMappingURL=format.js.map