"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export type LogLevel = "info" | "warn" | "error" | "success" | "system";

export interface TerminalEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source?: string; // e.g. "compiler", "server", "bundler"
}

export interface ProblemEntry {
  id: string;
  filePath: string;
  message: string;
  line?: number;
  severity: "error" | "warning";
}

export type TerminalTab = "terminal" | "problems";

interface TerminalState {
  entries: TerminalEntry[];
  problems: ProblemEntry[];
  isRunning: boolean;
  activeTab: TerminalTab;
  isInitialized: boolean;
}

interface TerminalActions {
  addLog: (message: string, level?: LogLevel, source?: string) => void;
  addLogs: (messages: Array<{ message: string; level?: LogLevel; source?: string }>) => void;
  clearLogs: () => void;
  clearProblems: () => void;
  setIsRunning: (running: boolean) => void;
  setActiveTab: (tab: TerminalTab) => void;
  addProblem: (problem: Omit<ProblemEntry, "id">) => void;
  addProblems: (problems: Array<Omit<ProblemEntry, "id">>) => void;
  /** Simulates a compilation sequence with realistic delays */
  simulateCompilation: (filePaths: string[]) => void;
  /** Shows terminal initialization boot sequence */
  initializeTerminal: () => void;
  /** Adds an iframe console capture entry */
  addIframeLog: (message: string, level: "log" | "warn" | "error" | "info") => void;
}

type TerminalContext = TerminalState & TerminalActions;

// ── Helpers ───────────────────────────────────────────────────────────────

let _entryId = 0;
function genEntryId() {
  return `log_${Date.now()}_${++_entryId}`;
}

let _problemId = 0;
function genProblemId() {
  return `prob_${Date.now()}_${++_problemId}`;
}

// ── Local Storage Helpers (per-user) ───────────────────────────────────────

function terminalStorageKey(userId: string) {
  return `nyx-ai:terminal:${userId}`;
}

function loadTerminalFromStorage(userId: string): TerminalState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(terminalStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.entries && Array.isArray(parsed.entries) &&
          parsed.problems && Array.isArray(parsed.problems) &&
          typeof parsed.isRunning === 'boolean' &&
          typeof parsed.activeTab === 'string' &&
          typeof parsed.isInitialized === 'boolean') {
        return parsed as TerminalState;
      }
    }
  } catch {
    // ignore corrupt data
  }
  return null;
}

function saveTerminalToStorage(userId: string, state: TerminalState) {
  if (typeof window === "undefined" || userId === "anonymous") return;
  try {
    localStorage.setItem(terminalStorageKey(userId), JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

// ── Context ───────────────────────────────────────────────────────────────

const TerminalCtx = createContext<TerminalContext | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────

export function TerminalProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<TerminalState>(() => {
    if (userId && userId !== "anonymous") {
      const saved = loadTerminalFromStorage(userId);
      if (saved) return saved;
    }
    return {
      entries: [],
      problems: [],
      isRunning: false,
      activeTab: "terminal",
      isInitialized: false,
    };
  });

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // When userId changes, load the correct terminal state
  useEffect(() => {
    if (userId && userId !== "anonymous") {
      const saved = loadTerminalFromStorage(userId);
      if (saved) {
        setState(saved);
      }
    }
  }, [userId]);

  // Persist terminal state on every change
  useEffect(() => {
    if (userId && userId !== "anonymous") {
      saveTerminalToStorage(userId, state);
    }
  }, [userId, state]);

  const addLog = useCallback(
    (message: string, level: LogLevel = "info", source?: string) => {
      setState((prev) => ({
        ...prev,
        entries: [
          ...prev.entries,
          {
            id: genEntryId(),
            timestamp: new Date(),
            level,
            message,
            source,
          },
        ],
      }));
    },
    []
  );

  const addLogs = useCallback(
    (
      messages: Array<{ message: string; level?: LogLevel; source?: string }>
    ) => {
      const newEntries: TerminalEntry[] = messages.map((m) => ({
        id: genEntryId(),
        timestamp: new Date(),
        level: m.level ?? "info",
        message: m.message,
        source: m.source,
      }));

      setState((prev) => ({
        ...prev,
        entries: [...prev.entries, ...newEntries],
      }));
    },
    []
  );

  const clearLogs = useCallback(() => {
    // Clear any pending simulation timeouts
    for (const t of timeoutsRef.current) {
      clearTimeout(t);
    }
    timeoutsRef.current = [];
    setState((prev) => ({ ...prev, entries: [], isRunning: false }));
  }, []);

  const clearProblems = useCallback(() => {
    setState((prev) => ({ ...prev, problems: [] }));
  }, []);

  const setIsRunning = useCallback((running: boolean) => {
    setState((prev) => ({ ...prev, isRunning: running }));
  }, []);

  const setActiveTab = useCallback((tab: TerminalTab) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const addProblem = useCallback(
    (problem: Omit<ProblemEntry, "id">) => {
      setState((prev) => ({
        ...prev,
        problems: [...prev.problems, { ...problem, id: genProblemId() }],
      }));
    },
    []
  );

  const addProblems = useCallback(
    (problems: Array<Omit<ProblemEntry, "id">>) => {
      const newProblems = problems.map((p) => ({
        ...p,
        id: genProblemId(),
      }));
      setState((prev) => ({
        ...prev,
        problems: [...prev.problems, ...newProblems],
      }));
    },
    []
  );

  const addIframeLog = useCallback(
    (message: string, level: "log" | "warn" | "error" | "info") => {
      const levelMap: Record<string, LogLevel> = {
        log: "info",
        info: "info",
        warn: "warn",
        error: "error",
      };
      addLog(message, levelMap[level] ?? "info", "runtime");
    },
    [addLog]
  );

  // ── Terminal Initialization Boot Sequence ──────────────────────────────

  const initializeTerminal = useCallback(() => {
    if (state.isInitialized) return;

    const bootSequence: Array<{
      delay: number;
      message: string;
      level: LogLevel;
      source: string;
    }> = [
      {
        delay: 0,
        message: `⚡ Nyx AI — Intelligent Code Assistant v1.0.0`,
        level: "system",
        source: "nyx",
      },
      {
        delay: 200,
        message: `📋 Initializing workspace environment...`,
        level: "info",
        source: "nyx",
      },
      {
        delay: 500,
        message: `🔧 Loading TypeScript compiler (v5.3.3)...`,
        level: "info",
        source: "compiler",
      },
      {
        delay: 800,
        message: `🎨 Loading CSS processor...`,
        level: "info",
        source: "compiler",
      },
      {
        delay: 1100,
        message: `📦 Resolving workspace modules...`,
        level: "info",
        source: "bundler",
      },
      {
        delay: 1500,
        message: `✅ Workspace ready — 5 files indexed`,
        level: "success",
        source: "nyx",
      },
      {
        delay: 1800,
        message: `🚀 Dev server listening on http://localhost:3000`,
        level: "success",
        source: "server",
      },
      {
        delay: 2100,
        message: `📡 Hot Module Replacement enabled — live preview active`,
        level: "info",
        source: "server",
      },
      {
        delay: 2400,
        message: `💡 Type a message in the chat to generate code and see live preview`,
        level: "system",
        source: "nyx",
      },
    ];

    for (const step of bootSequence) {
      const timeout = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          entries: [
            ...prev.entries,
            {
              id: genEntryId(),
              timestamp: new Date(),
              level: step.level,
              message: step.message,
              source: step.source,
            },
          ],
          isInitialized: step.delay >= 2400 ? true : prev.isInitialized,
        }));
      }, step.delay);
      timeoutsRef.current.push(timeout);
    }
  }, [state.isInitialized]);

  // ── Compilation Simulation ────────────────────────────────────────────

  const simulateCompilation = useCallback(
    (filePaths: string[]) => {
      // Clear any previous pending timeouts
      for (const t of timeoutsRef.current) {
        clearTimeout(t);
      }
      timeoutsRef.current = [];

      const fileList =
        filePaths.length > 2
          ? `${filePaths.slice(0, 2).join(", ")} and ${filePaths.length - 2} other${filePaths.length - 2 > 1 ? "s" : ""}`
          : filePaths.join(", ");

      const compileTime = (Math.random() * 200 + 50).toFixed(0);
      const moduleCount = Math.floor(Math.random() * 12 + 3);

      const sequence: Array<{
        delay: number;
        message: string;
        level: LogLevel;
        source: string;
      }> = [
        {
          delay: 0,
          message: `🔄 Compiling changes...`,
          level: "system",
          source: "compiler",
        },
        {
          delay: 300,
          message: `📝 Detected changes in: ${fileList}`,
          level: "info",
          source: "compiler",
        },
        {
          delay: 700,
          message: `📦 Installing local modules...`,
          level: "info",
          source: "bundler",
        },
        {
          delay: 1100,
          message: `🔍 Resolving ${moduleCount} imports and dependencies...`,
          level: "info",
          source: "bundler",
        },
        {
          delay: 1500,
          message: `⚙️ Transpiling TypeScript/JSX...`,
          level: "info",
          source: "compiler",
        },
        {
          delay: 1900,
          message: `🎨 Processing CSS and styles...`,
          level: "info",
          source: "compiler",
        },
        {
          delay: 2300,
          message: `🔗 Bundling output chunks...`,
          level: "info",
          source: "bundler",
        },
        {
          delay: 2700,
          message: `✅ Compilation successful (${compileTime}ms)`,
          level: "success",
          source: "compiler",
        },
        {
          delay: 3000,
          message: `🚀 Server listening on port 3000`,
          level: "success",
          source: "server",
        },
        {
          delay: 3200,
          message: `📡 Live preview updated — HMR reload complete`,
          level: "info",
          source: "server",
        },
      ];

      setState((prev) => ({ ...prev, isRunning: true, problems: [] }));

      for (const step of sequence) {
        const timeout = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            entries: [
              ...prev.entries,
              {
                id: genEntryId(),
                timestamp: new Date(),
                level: step.level,
                message: step.message,
                source: step.source,
              },
            ],
            isRunning: step.delay < 2700,
          }));
        }, step.delay);
        timeoutsRef.current.push(timeout);
      }
    },
    []
  );

  const ctx: TerminalContext = {
    ...state,
    addLog,
    addLogs,
    clearLogs,
    clearProblems,
    setIsRunning,
    setActiveTab,
    addProblem,
    addProblems,
    simulateCompilation,
    initializeTerminal,
    addIframeLog,
  };

  return (
    <TerminalCtx.Provider value={ctx}>{children}</TerminalCtx.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useTerminal(): TerminalContext {
  const ctx = useContext(TerminalCtx);
  if (!ctx) {
    throw new Error("useTerminal must be used within a TerminalProvider");
  }
  return ctx;
}