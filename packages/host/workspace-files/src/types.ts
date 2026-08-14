/**
 * Public request, value, and failure vocabulary for the workspace-files
 * Remote. This module contains types only so generated Remote clients can
 * consume it without importing Host runtime code.
 * @module @deepseek-ai/dsh-host-workspace-files/types
 */

/** The stable host working directory the explorer roots at (mirror of `host.describe`'s `cwd`). */
export type WorkspaceRoot = string

/** One direct child row of a workspace listing. */
export interface WorkspaceFileEntry {
  /** Base name shown in a browser row (the client never joins path segments). */
  readonly name: string
  /** Absolute host path of the entry. */
  readonly path: string
  /** Whether the entry is a regular file, a directory, or something else. */
  readonly kind: 'file' | 'directory' | 'other'
  /** Byte size of a regular file, when the backend can report it; null for directories. */
  readonly size: number | null
  /** Hidden by the host platform's convention (dot-prefixed on POSIX); the client owns whether to show it. */
  readonly hidden: boolean
}

/** One directory level plus the explorer root, as the workspace-files Remote reports it. */
export interface WorkspaceFileListing {
  /** Absolute path of the listed directory. */
  readonly path: string
  /** The host account's working directory (explorer root; breadcrumb "Workspace" rooting). */
  readonly root: WorkspaceRoot
  /** Direct children, name-sorted (directories and files interleaved). */
  readonly entries: readonly WorkspaceFileEntry[]
  /** True when the backend cut `entries` at its complete-result bound. */
  readonly truncated: boolean
}

/** One bounded text preview read. */
export interface WorkspaceFileRead {
  /** Decoded UTF-8 content of the file, at most the preview cap. */
  readonly content: string
  /** True when the file is larger than the preview cap and `content` is only a head slice. */
  readonly truncated: boolean
  /** Total byte length of the file on disk. */
  readonly byteLength: number
}

/** One path's metadata probe (the preview header). */
export interface WorkspaceFileStat {
  /** Absolute host path of the probed entry. */
  readonly path: string
  /** Whether the entry is a regular file, a directory, or something else. */
  readonly kind: 'file' | 'directory' | 'other'
  /** Byte size of a regular file, when the backend can report it; null for directories. */
  readonly size: number | null
}

/** One full-file text write (create or replace) committed through `ctx.fs`. */
export interface WorkspaceFileWrite {
  /** Whether the write created a new file or replaced an existing one. */
  readonly operation: 'create' | 'update'
  /** Absolute host path that was written. */
  readonly path: string
  /** UTF-8 byte length of the committed content. */
  readonly byteLength: number
}

/** The listed path cannot be resolved or read. */
export interface WorkspaceFilePathUnavailable {
  readonly code: 'path-unavailable'
  readonly path: string
}

/** The listed path exists but is not a directory. */
export interface WorkspaceFileNotDirectory {
  readonly code: 'not-a-directory'
  readonly path: string
}

/** The read target exists but is not a regular text file. */
export interface WorkspaceFileNotText {
  readonly code: 'not-a-text-file'
  readonly path: string
}

/** The read target is a directory; previews only cover regular files. */
export interface WorkspaceFileIsDirectory {
  readonly code: 'is-a-directory'
  readonly path: string
}

/** The host denied access to the path. */
export interface WorkspaceFileDenied {
  readonly code: 'permission-denied'
  readonly path: string
}

/** Any other filesystem failure while serving the request. */
export interface WorkspaceFileIoError {
  readonly code: 'io-error'
  readonly path: string
}

/** Failures shared by the public workspace-files operations. */
export type WorkspaceFilesFailure =
  | WorkspaceFilePathUnavailable
  | WorkspaceFileNotDirectory
  | WorkspaceFileNotText
  | WorkspaceFileIsDirectory
  | WorkspaceFileDenied
  | WorkspaceFileIoError

/** Successful public operation result. */
export interface WorkspaceFilesSuccess<T> {
  readonly ok: true
  readonly value: T
}

/** Rejected public operation result with a stable business failure. */
export interface WorkspaceFilesRejected<E extends WorkspaceFilesFailure> {
  readonly ok: false
  readonly error: E
}

/** Result returned by the `list` operation. */
export type WorkspaceFileListResult =
  | WorkspaceFilesSuccess<WorkspaceFileListing>
  | WorkspaceFilesRejected<WorkspaceFilePathUnavailable | WorkspaceFileNotDirectory | WorkspaceFileDenied | WorkspaceFileIoError>

/** Result returned by the `read` operation. */
export type WorkspaceFileReadResult =
  | WorkspaceFilesSuccess<WorkspaceFileRead>
  | WorkspaceFilesRejected<WorkspaceFilePathUnavailable | WorkspaceFileIsDirectory | WorkspaceFileNotText | WorkspaceFileDenied | WorkspaceFileIoError>

/** Result returned by the `stat` operation. */
export type WorkspaceFileStatResult =
  | WorkspaceFilesSuccess<WorkspaceFileStat>
  | WorkspaceFilesRejected<WorkspaceFilePathUnavailable | WorkspaceFileDenied | WorkspaceFileIoError>

/** Result returned by the `write` operation (sandbox-gated like every fs mutation). */
export type WorkspaceFileWriteResult =
  | WorkspaceFilesSuccess<WorkspaceFileWrite>
  | WorkspaceFilesRejected<WorkspaceFilePathUnavailable | WorkspaceFileIsDirectory | WorkspaceFileDenied | WorkspaceFileIoError>

/** Result returned by the `reveal` operation (show-in-folder on the host desktop). */
export type WorkspaceFileRevealResult =
  | WorkspaceFilesSuccess<{ readonly path: string }>
  | WorkspaceFilesRejected<WorkspaceFilePathUnavailable | WorkspaceFileDenied | WorkspaceFileIoError>

/** Result returned by the `open` operation (default-application open on the host desktop). */
export type WorkspaceFileOpenResult =
  | WorkspaceFilesSuccess<{ readonly path: string }>
  | WorkspaceFilesRejected<WorkspaceFilePathUnavailable | WorkspaceFileDenied | WorkspaceFileIoError>
