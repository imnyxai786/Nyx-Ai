"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTerminal, type TerminalEntry } from "@/store/terminal";
import { useWorkspace, type WorkspaceFile } from "@/store/workspace";
import { parseErrors, buildAutoFixPrompt, extractErrorContext, type ParsedError } from "@/lib/debug";

// ── useBugHunter Hook ────────────────────────────────────────────────────────
// Watches terminal for error-level logs, parses them, and generates
// auto-fix proposals that appear in the ChatPane.

export interface BugHunterProposal {
  id: string;
  error: ParsedError;
  prompt: string;
  timestamp: Date;
}

// Global event emitter for BugHunter proposals (decoupled from React state)
type BugHunterListener = (proposal: BugHunterProposal) => void;
const listeners = new Set<BugHunterListener>();
let lastProcessedSignature = "";

export function emitBugHunterProposal(proposal: BugHunterProposal) {
  for (const listener of listeners) {
    listener(proposal);
  }
}

export function onBugHunterProposal(listener: BugHunterListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBugHunter() {
  const { entries } = useTerminal();
  const { files } = useWorkspace();
  const processedRef = useRef<Set<string>>(new Set());

  const processTerminalErrors = useCallback(() => {
    // Collect all error-level terminal entries
    const errorEntries: TerminalEntry[] = entries.filter(
      (e: TerminalEntry) => e.level === "error"
    );

    for (const entry of errorEntries) {
      // Skip already processed entries
      if (processedRef.current.has(entry.id)) continue;
      processedRef.current.add(entry.id);

      // Parse errors from the message
      const parsed = parseErrors(entry.message);

      if (parsed.length === 0) continue;

      // Generate fix proposals for each parsed error
      for (const error of parsed) {
        const signature = `${error.filePath}:${error.lineNumber}:${error.message}`;
        if (signature === lastProcessedSignature) continue;
        lastProcessedSignature = signature;

        const fixPrompt = buildAutoFixPrompt(error);

        // Try to find the file in workspace for context
        const wsFile: WorkspaceFile | undefined = files.find(
          (f: WorkspaceFile) =>
            f.path === error.filePath || f.path.endsWith(error.filePath)
        );

        let contextBlock = "";
        if (wsFile) {
          const context = extractErrorContext(wsFile.content, error.lineNumber);
          contextBlock = `\n\n**File context:**\n\`\`\`\n${context}\n\`\`\``;
        }

        const proposal: BugHunterProposal = {
          id: `bughunter_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          error,
          prompt: `🔧 **BugHunter detected an error**\n\n**File:** \`${error.filePath}\`\n**Line:** ${error.lineNumber}\n**Error:** ${error.message}${error.errorCode ? ` (\`${error.errorCode}\`)` : ""}${contextBlock}\n\nWould you like me to fix this error? I can analyze the issue and provide a targeted fix.`,
          timestamp: new Date(),
        };

        // Emit to listeners (ChatPane subscribes)
        emitBugHunterProposal(proposal);
      }
    }
  }, [entries, files]);

  useEffect(() => {
    processTerminalErrors();
  }, [processTerminalErrors]);

  return { processTerminalErrors };
}