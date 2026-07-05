// ── Debug Module ─────────────────────────────────────────────────────────────
// Terminal Regex Linker — error parsing and auto-fix prompt generation

export type { ParsedError, AutoFixPrompt } from "./errorParser";

export {
  parseErrors,
  hasErrors,
  buildAutoFixPrompt,
  buildAutoFixPrompts,
  extractErrorContext,
} from "./errorParser";