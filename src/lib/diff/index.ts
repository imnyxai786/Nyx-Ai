// ── Diff Module ──────────────────────────────────────────────────────────────
// Unified Diff Streaming Handler — incremental code additions for Monaco editor

export type {
  DiffHunkHeader,
  DiffLine,
  DiffHunk,
  ParsedDiff,
} from "./parser";

export {
  parseUnifiedDiff,
  isDiffStart,
  hasCompleteHunk,
  applyHunk,
  applyDiff,
} from "./parser";

export type {
  StreamingState,
  StreamingDiffConfig,
  StreamingDiffSnapshot,
} from "./streaming";

export {
  StreamingDiffHandler,
  createMonacoStreamingHandler,
} from "./streaming";