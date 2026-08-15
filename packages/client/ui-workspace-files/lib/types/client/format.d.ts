/** Byte formatting shared by the tree and the preview (unit names live in the dictionary). */
/** One localized byte-size phrase. */
export interface ByteSize {
    /** Dictionary key to translate (the `bytes.*` family). */
    key: 'bytes.b' | 'bytes.kb' | 'bytes.mb';
    /** Numeric value rendered into the phrase (already scaled to the unit). */
    count: string;
}
/**
 * Format a byte count into the nearest conventional unit.
 * @param bytes - raw byte count (0 stays 0 B).
 * @returns the unit phrase parameters.
 */
export declare function formatBytes(bytes: number): ByteSize;
//# sourceMappingURL=format.d.ts.map