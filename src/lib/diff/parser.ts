// ── Unified Diff Parser ─────────────────────────────────────────────────────
// Parses unified diff format strings into structured hunk objects for
// incremental application to Monaco editor content.

// ── Types ──────────────────────────────────────────────────────────────────

export interface DiffHunkHeader {
  /** Original file start line (1-based) */
  oldStart: number;
  /** Number of lines removed from original */
  oldLines: number;
  /** New file start line (1-based) */
  newStart: number;
  /** Number of lines added in new */
  newLines: number;
}

export interface DiffLine {
  type: "context" | "add" | "remove";
  content: string;
}

export interface DiffHunk {
  header: DiffHunkHeader;
  lines: DiffLine[];
}

export interface ParsedDiff {
  /** Original file path (from --- line) */
  oldFilePath: string | null;
  /** New file path (from +++ line) */
  newFilePath: string | null;
  /** Parsed hunks */
  hunks: DiffHunk[];
}

// ── Regex Patterns ──────────────────────────────────────────────────────────

/** Match the --- a/file.txt header */
const OLD_FILE_REGEX = /^---\s+(?:a\/)?(.+)$/;

/** Match the +++ b/file.txt header */
const NEW_FILE_REGEX = /^\+\+\+\s+(?:b\/)?(.+)$/;

/** Match the @@ -oldStart,oldLines +newStart,newLines @@ hunk header */
const HUNK_HEADER_REGEX =
  /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/;

// ── Parser ──────────────────────────────────────────────────────────────────

/**
 * Parse a complete unified diff string into structured DiffHunk objects.
 * Supports multi-hunk diffs and partial (streaming) diffs.
 */
export function parseUnifiedDiff(diffText: string): ParsedDiff {
  const lines = diffText.split("\n");

  let oldFilePath: string | null = null;
  let newFilePath: string | null = null;
  const hunks: DiffHunk[] = [];

  let currentHunk: DiffHunk | null = null;

  for (const rawLine of lines) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;

    // Try to match file headers
    const oldMatch = line.match(OLD_FILE_REGEX);
    if (oldMatch) {
      oldFilePath = oldMatch[1];
      continue;
    }

    const newMatch = line.match(NEW_FILE_REGEX);
    if (newMatch) {
      newFilePath = newMatch[1];
      continue;
    }

    // Try to match hunk header
    const hunkMatch = line.match(HUNK_HEADER_REGEX);
    if (hunkMatch) {
      // Save previous hunk
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      currentHunk = {
        header: {
          oldStart: parseInt(hunkMatch[1], 10),
          oldLines: hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1,
          newStart: parseInt(hunkMatch[3], 10),
          newLines: hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1,
        },
        lines: [],
      };
      continue;
    }

    // Parse diff lines within a hunk
    if (currentHunk) {
      if (line.startsWith(" ")) {
        currentHunk.lines.push({ type: "context", content: line.slice(1) });
      } else if (line.startsWith("+")) {
        currentHunk.lines.push({ type: "add", content: line.slice(1) });
      } else if (line.startsWith("-")) {
        currentHunk.lines.push({ type: "remove", content: line.slice(1) });
      }
      // Skip other lines (e.g., "\ No newline at end of file")
    }
  }

  // Push the last hunk
  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return { oldFilePath, newFilePath, hunks };
}

/**
 * Check if a string looks like the start of a unified diff.
 * Useful for detecting streaming diff content.
 */
export function isDiffStart(text: string): boolean {
  const firstLine = text.split("\n")[0]?.trim() ?? "";
  return firstLine.startsWith("---") || firstLine.startsWith("diff --git");
}

/**
 * Check if a diff string contains a complete hunk (has header + lines).
 */
export function hasCompleteHunk(diffText: string): boolean {
  return HUNK_HEADER_REGEX.test(diffText);
}

// ── Diff Application ────────────────────────────────────────────────────────

/**
 * Apply a single DiffHunk to source content, returning the modified content.
 * Uses line-based matching for resilience against concurrent edits.
 */
export function applyHunk(source: string, hunk: DiffHunk): string {
  const sourceLines = source.split("\n");

  // Build the replacement: collect remove/context lines to find position,
  // then replace with add/context lines
  const removeLines: string[] = [];
  const insertLines: string[] = [];

  for (const line of hunk.lines) {
    switch (line.type) {
      case "context":
        removeLines.push(line.content);
        insertLines.push(line.content);
        break;
      case "remove":
        removeLines.push(line.content);
        break;
      case "add":
        insertLines.push(line.content);
        break;
    }
  }

  // Find the position in source where the remove lines match
  const matchIndex = findLineSequence(sourceLines, removeLines, hunk.header.oldStart - 1);

  if (matchIndex === -1) {
    // Fallback: try to apply at the header position directly
    const insertPos = Math.min(hunk.header.newStart - 1, sourceLines.length);
    sourceLines.splice(insertPos, removeLines.length, ...insertLines);
  } else {
    sourceLines.splice(matchIndex, removeLines.length, ...insertLines);
  }

  return sourceLines.join("\n");
}

/**
 * Apply all hunks from a parsed diff to source content.
 * Hunks are applied in reverse order to preserve line positions.
 */
export function applyDiff(source: string, diff: ParsedDiff): string {
  // Apply hunks in reverse order so earlier hunks don't shift
  // line numbers for later hunks
  let result = source;
  const sortedHunks = [...diff.hunks].sort(
    (a, b) => b.header.oldStart - a.header.oldStart
  );

  for (const hunk of sortedHunks) {
    result = applyHunk(result, hunk);
  }

  return result;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Find the starting index of a sequence of lines within a larger array.
 * Starts searching from `startFrom` position for efficiency.
 * Returns -1 if not found.
 */
function findLineSequence(
  source: string[],
  target: string[],
  startFrom: number
): number {
  if (target.length === 0) return startFrom;

  const maxStart = source.length - target.length;

  for (let i = Math.max(0, startFrom - 2); i <= maxStart; i++) {
    let match = true;
    for (let j = 0; j < target.length; j++) {
      if (source[i + j]?.trimEnd() !== target[j]?.trimEnd()) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }

  return -1;
}