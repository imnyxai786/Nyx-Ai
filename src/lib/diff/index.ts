// ── Diff Module ─────────────────────────────────────────────────────────────
// Unified diff parsing, streaming application, and Monaco integration

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
  PatchFailureEvent,
} from "./streaming";

export {
  StreamingDiffHandler,
  createMonacoStreamingHandler,
  emitPatchFailure,
  onPatchFailure,
} from "./streaming";