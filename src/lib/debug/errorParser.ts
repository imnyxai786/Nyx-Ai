// ── Debug Mode — Error Parser ───────────────────────────────────────────────
// Regex-based compilation error extraction and auto-fix prompt builder

// ── Types ──────────────────────────────────────────────────────────────────

export interface ParsedError {
  /** The file where the error occurred */
  filePath: string;
  /** The line number (1-based) */
  lineNumber: number;
  /** The column number (1-based), if available */
  columnNumber?: number;
  /** The error severity */
  severity: "error" | "warning";
  /** The error code (e.g., TS2307, E0401) */
  errorCode?: string;
  /** The human-readable error message */
  message: string;
  /** The original raw line from the stack trace */
  raw: string;
}

export interface AutoFixPrompt {
  /** The system prompt for the AI fix agent */
  systemPrompt: string;
  /** The user prompt describing the error and requesting a fix */
  userPrompt: string;
  /** The file path to apply the fix to */
  filePath: string;
  /** The line number where the fix should be applied */
  lineNumber: number;
  /** Suggested fix context (surrounding lines) */
  context?: string;
}

// ── Error Pattern Matchers ──────────────────────────────────────────────────
// Each regex captures: filePath, lineNumber, (optional) columnNumber, message, (optional) errorCode

const ERROR_PATTERNS: Array<{
  /** Pattern name for debugging */
  name: string;
  /** The regex — must have named groups or positional captures */
  regex: RegExp;
  /** How to map match groups to ParsedError fields */
  map: (match: RegExpMatchArray) => Omit<ParsedError, "raw">;
}> = [
  // TypeScript: src/file.ts(12,5): error TS2307: Cannot find module 'foo'.
  {
    name: "typescript",
    regex: /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/gm,
    map: (m) => ({
      filePath: m[1],
      lineNumber: parseInt(m[2], 10),
      columnNumber: parseInt(m[3], 10),
      severity: m[4] as "error" | "warning",
      errorCode: m[5],
      message: m[6],
    }),
  },
  // TypeScript alternative: src/file.ts:12:5 - error TS2307: Cannot find module 'foo'.
  {
    name: "typescript-alt",
    regex: /^(.+?):(\d+):(\d+)\s*-\s*(error|warning)\s+(TS\d+):\s+(.+)$/gm,
    map: (m) => ({
      filePath: m[1],
      lineNumber: parseInt(m[2], 10),
      columnNumber: parseInt(m[3], 10),
      severity: m[4] as "error" | "warning",
      errorCode: m[5],
      message: m[6],
    }),
  },
  // ESLint: /path/to/file.js:10:5  error  'x' is not defined  no-undef
  {
    name: "eslint",
    regex: /^(.+?):(\d+):(\d+)\s+(error|warning)\s+(.+?)\s{2,}(\S+)$/gm,
    map: (m) => ({
      filePath: m[1],
      lineNumber: parseInt(m[2], 10),
      columnNumber: parseInt(m[3], 10),
      severity: m[4] as "error" | "warning",
      errorCode: m[6],
      message: m[5],
    }),
  },
  // Python: File "main.py", line 42, in <module> SyntaxError: invalid syntax
  {
    name: "python",
    regex: /^File\s+"(.+?)",\s+line\s+(\d+).*?:\s+(.+)$/gm,
    map: (m) => ({
      filePath: m[1],
      lineNumber: parseInt(m[2], 10),
      severity: "error" as const,
      message: m[3],
    }),
  },
  // Rust: src/main.rs:15:5: error[E0425]: cannot find value `x` in this scope
  {
    name: "rust",
    regex: /^(.+?):(\d+):(\d+):\s+(error|warning)\[(E\d+)\]:\s+(.+)$/gm,
    map: (m) => ({
      filePath: m[1],
      lineNumber: parseInt(m[2], 10),
      columnNumber: parseInt(m[3], 10),
      severity: m[4] as "error" | "warning",
      errorCode: m[5],
      message: m[6],
    }),
  },
  // Go: ./main.go:10:2: undefined: x
  {
    name: "go",
    regex: /^(.+?):(\d+):(\d+):\s+(.+)$/gm,
    map: (m) => ({
      filePath: m[1],
      lineNumber: parseInt(m[2], 10),
      columnNumber: parseInt(m[3], 10),
      severity: "error" as const,
      message: m[4],
    }),
  },
  // Generic: file.ext:42: Some error message
  {
    name: "generic",
    regex: /^(.+?):(\d+):\s+(.+)$/gm,
    map: (m) => ({
      filePath: m[1],
      lineNumber: parseInt(m[2], 10),
      severity: "error" as const,
      message: m[3],
    }),
  },
];

// ── Parse Errors from Output ────────────────────────────────────────────────

/**
 * Parse a compilation/runtime output string and extract structured errors.
 * Tries multiple regex patterns to support various language toolchains.
 */
export function parseErrors(output: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    for (const pattern of ERROR_PATTERNS) {
      // Reset regex state for global patterns
      pattern.regex.lastIndex = 0;
      const match = pattern.regex.exec(trimmed);
      if (match) {
        const parsed = pattern.map(match);
        // Validate the parsed data
        if (parsed.filePath && parsed.lineNumber > 0 && parsed.message) {
          errors.push({
            ...parsed,
            raw: trimmed,
          });
          break; // Don't match the same line with multiple patterns
        }
      }
    }
  }

  return errors;
}

/**
 * Quick check if a string contains any recognizable compilation errors.
 */
export function hasErrors(output: string): boolean {
  return parseErrors(output).length > 0;
}

// ── Auto-Fix Prompt Builder ─────────────────────────────────────────────────

const SYSTEM_PROMPT_TEMPLATE = `You are Nyx AI, an expert code debugging assistant. Your task is to analyze compilation/runtime errors and provide precise fixes.

Rules:
- Output ONLY the corrected code, no explanations unless asked.
- Preserve the original code structure and style.
- If multiple fixes are needed, address them all.
- Use unified diff format when showing changes.`;

const USER_PROMPT_TEMPLATE = `I have the following error in my code:

File: {filePath}
Line: {lineNumber}
{errorCodeBlock}Error: {message}

Please analyze this error and provide a fix. The fix should be minimal and targeted — only change what's necessary to resolve the error.`;

/**
 * Build an auto-fix prompt from a parsed error, ready to send to an AI agent.
 */
export function buildAutoFixPrompt(error: ParsedError): AutoFixPrompt {
  const errorCodeBlock = error.errorCode
    ? `Error Code: ${error.errorCode}\n`
    : "";

  const userPrompt = USER_PROMPT_TEMPLATE.replace("{filePath}", error.filePath)
    .replace("{lineNumber}", String(error.lineNumber))
    .replace("{errorCodeBlock}", errorCodeBlock)
    .replace("{message}", error.message);

  return {
    systemPrompt: SYSTEM_PROMPT_TEMPLATE,
    userPrompt,
    filePath: error.filePath,
    lineNumber: error.lineNumber,
  };
}

/**
 * Build auto-fix prompts for all errors found in an output string.
 * Returns one prompt per unique error.
 */
export function buildAutoFixPrompts(output: string): AutoFixPrompt[] {
  const errors = parseErrors(output);
  return errors.map(buildAutoFixPrompt);
}

/**
 * Extract a context window around the error line from file content.
 * Useful for providing the AI with surrounding code for better fixes.
 */
export function extractErrorContext(
  fileContent: string,
  lineNumber: number,
  contextLines: number = 5
): string {
  const lines = fileContent.split("\n");
  const startLine = Math.max(0, lineNumber - contextLines - 1);
  const endLine = Math.min(lines.length, lineNumber + contextLines);

  return lines
    .slice(startLine, endLine)
    .map((line, idx) => {
      const currentLine = startLine + idx + 1;
      const marker = currentLine === lineNumber ? " >>>" : "    ";
      return `${marker} ${String(currentLine).padStart(4)} | ${line}`;
    })
    .join("\n");
}