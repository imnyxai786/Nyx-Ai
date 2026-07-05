// ── Unified Diff Streaming Handler ──────────────────────────────────────────
// Manages incremental streaming of unified diff content into a Monaco editor,
// allowing users to type manually while an external agent streams edits.

import type { ParsedDiff, DiffHunk } from "./parser";
import { parseUnifiedDiff, applyDiff, isDiffStart, hasCompleteHunk } from "./parser";

// ── Types ──────────────────────────────────────────────────────────────────

export type StreamingState = "idle" | "streaming" | "applying" | "complete" | "error";

export interface StreamingDiffConfig {
  /** Minimum time between diff applications (ms), prevents UI thrashing */
  applyThrottleMs?: number;
  /** Whether to auto-apply hunks as they complete */
  autoApply?: boolean;
  /** Callback when streaming state changes */
  onStateChange?: (state: StreamingState) => void;
  /** Callback when a diff is applied to the editor content */
  onApply?: (newContent: string, hunksApplied: number) => void;
  /** Callback on streaming error */
  onError?: (error: Error) => void;
}

export interface StreamingDiffSnapshot {
  state: StreamingState;
  /** Total hunks received so far */
  hunksReceived: number;
  /** Total hunks applied to content */
  hunksApplied: number;
  /** Bytes of diff content received */
  bytesReceived: number;
  /** Current accumulated diff buffer */
  bufferLength: number;
}

// ── Streaming Diff Handler ──────────────────────────────────────────────────

export class StreamingDiffHandler {
  private config: Required<StreamingDiffConfig>;
  private state: StreamingState = "idle";
  private buffer = "";
  private appliedUpTo = 0;
  private hunksReceived = 0;
  private bytesReceived = 0;
  private lastApplyTime = 0;
  private applyTimer: ReturnType<typeof setTimeout> | null = null;
  private currentContent: string;

  constructor(currentContent: string, config?: StreamingDiffConfig) {
    this.currentContent = currentContent;
    this.config = {
      applyThrottleMs: config?.applyThrottleMs ?? 150,
      autoApply: config?.autoApply ?? true,
      onStateChange: config?.onStateChange ?? (() => {}),
      onApply: config?.onApply ?? (() => {}),
      onError: config?.onError ?? (() => {}),
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Feed a chunk of streaming diff content into the handler.
   * Called as new SSE/stream data arrives from the agent.
   */
  feedChunk(chunk: string): void {
    if (this.state === "idle" || this.state === "streaming") {
      this.buffer += chunk;
      this.bytesReceived += chunk.length;

      if (this.state === "idle" && isDiffStart(this.buffer)) {
        this.setState("streaming");
      }

      // Check if we have complete hunks to apply
      if (this.config.autoApply && hasCompleteHunk(this.buffer)) {
        this.scheduleApply();
      }
    }
  }

  /**
   * Signal that the stream has ended. Applies any remaining buffered diff.
   */
  finalize(): void {
    if (this.applyTimer) {
      clearTimeout(this.applyTimer);
      this.applyTimer = null;
    }

    if (this.buffer.trim()) {
      this.applyBuffer();
    }

    this.setState("complete");
  }

  /**
   * Manually trigger application of all buffered hunks.
   * Useful when autoApply is disabled.
   */
  applyNow(): string {
    this.applyBuffer();
    return this.currentContent;
  }

  /**
   * Get the current editor content (with all applied diffs).
   */
  getContent(): string {
    return this.currentContent;
  }

  /**
   * Update the base content (e.g., when user types in the editor).
   * This allows concurrent editing — user changes are preserved
   * and diff application uses fuzzy matching to find the right position.
   */
  updateBaseContent(content: string): void {
    this.currentContent = content;
  }

  /**
   * Get a snapshot of the current streaming state.
   */
  getSnapshot(): StreamingDiffSnapshot {
    const parsed = parseUnifiedDiff(this.buffer);
    return {
      state: this.state,
      hunksReceived: parsed.hunks.length,
      hunksApplied: this.appliedUpTo,
      bytesReceived: this.bytesReceived,
      bufferLength: this.buffer.length,
    };
  }

  /**
   * Reset the handler for a new streaming session.
   */
  reset(newContent?: string): void {
    if (this.applyTimer) {
      clearTimeout(this.applyTimer);
      this.applyTimer = null;
    }
    this.buffer = "";
    this.appliedUpTo = 0;
    this.hunksReceived = 0;
    this.bytesReceived = 0;
    this.lastApplyTime = 0;
    if (newContent !== undefined) {
      this.currentContent = newContent;
    }
    this.setState("idle");
  }

  /**
   * Cancel the current streaming session without applying remaining diffs.
   */
  cancel(): void {
    if (this.applyTimer) {
      clearTimeout(this.applyTimer);
      this.applyTimer = null;
    }
    this.setState("idle");
  }

  // ── Internals ─────────────────────────────────────────────────────────

  private setState(newState: StreamingState): void {
    this.state = newState;
    this.config.onStateChange(newState);
  }

  private scheduleApply(): void {
    if (this.applyTimer) return;

    const elapsed = Date.now() - this.lastApplyTime;
    const delay = Math.max(0, this.config.applyThrottleMs - elapsed);

    this.applyTimer = setTimeout(() => {
      this.applyTimer = null;
      this.applyBuffer();
    }, delay);
  }

  private applyBuffer(): void {
    if (this.state === "applying") return;

    this.setState("applying");
    this.lastApplyTime = Date.now();

    try {
      const parsed: ParsedDiff = parseUnifiedDiff(this.buffer);

      if (parsed.hunks.length === 0) {
        this.setState("streaming");
        return;
      }

      // Only apply new hunks that haven't been applied yet
      const newHunks: DiffHunk[] = parsed.hunks.slice(this.appliedUpTo);

      if (newHunks.length > 0) {
        // Build a partial diff with only the new hunks
        const partialDiff: ParsedDiff = {
          oldFilePath: parsed.oldFilePath,
          newFilePath: parsed.newFilePath,
          hunks: newHunks,
        };

        this.currentContent = applyDiff(this.currentContent, partialDiff);
        this.appliedUpTo = parsed.hunks.length;
        this.hunksReceived = parsed.hunks.length;

        this.config.onApply(this.currentContent, newHunks.length);
      }

      this.setState("streaming");
    } catch (error) {
      this.setState("error");
      this.config.onError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

// ── Monaco Integration Helper ───────────────────────────────────────────────

/**
 * Create a StreamingDiffHandler wired to a Monaco editor instance.
 * Handles the coordination between user edits and agent-streamed diffs.
 *
 * Usage:
 * ```ts
 * const handler = createMonacoStreamingHandler(editor, model);
 * handler.feedChunk(chunk);
 * handler.finalize();
 * ```
 */
export function createMonacoStreamingHandler(
  getContent: () => string,
  setContent: (content: string) => void,
  config?: StreamingDiffConfig
): StreamingDiffHandler {
  const handler = new StreamingDiffHandler(getContent(), {
    ...config,
    onApply: (newContent, hunksApplied) => {
      setContent(newContent);
      config?.onApply?.(newContent, hunksApplied);
    },
  });

  return handler;
}