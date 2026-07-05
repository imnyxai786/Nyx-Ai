"use client";

import { useRef, useEffect } from "react";
import {
  Terminal,
  Trash2,
  Circle,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Zap,
  AlertOctagon,
  FileWarning,
} from "lucide-react";
import { useTerminal, type LogLevel, type TerminalTab } from "@/store/terminal";

// ── Level config ───────────────────────────────────────────────────────────

const levelConfig: Record<
  LogLevel,
  { color: string; icon: typeof Info; label: string }
> = {
  info: {
    color: "text-vsc-text",
    icon: Info,
    label: "INFO",
  },
  warn: {
    color: "text-vsc-warning",
    icon: AlertTriangle,
    label: "WARN",
  },
  error: {
    color: "text-vsc-error",
    icon: XCircle,
    label: "ERR",
  },
  success: {
    color: "text-vsc-success",
    icon: CheckCircle2,
    label: "OK",
  },
  system: {
    color: "text-vsc-accent",
    icon: Zap,
    label: "SYS",
  },
};

// ── Component ──────────────────────────────────────────────────────────────

export default function TerminalLogs() {
  const {
    entries,
    problems,
    isRunning,
    activeTab,
    clearLogs,
    clearProblems,
    setActiveTab,
  } = useTerminal();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const errorCount = problems.filter((p) => p.severity === "error").length;
  const warningCount = problems.filter((p) => p.severity === "warning").length;

  return (
    <div className="flex flex-col h-full" style={{ background: "#181818" }}>
      {/* Header with Tabs — Cursor-style #181818 */}
      <div
        className="flex items-center h-[30px] border-b"
        style={{ background: "#181818", borderColor: "#2b2b2b" }}
      >
        {/* Tab: Terminal */}
        <button
          onClick={() => setActiveTab("terminal")}
          className={`flex items-center gap-1.5 px-3 h-full text-[11px] font-medium border-b-2 transition-colors ${
            activeTab === "terminal"
              ? "text-vsc-text-bright border-vsc-accent"
              : "text-vsc-text-dim border-transparent hover:text-vsc-text"
          }`}
          style={{ background: activeTab === "terminal" ? "#1e1e1e" : "#181818" }}
        >
          <Terminal className="w-3 h-3" />
          Terminal
          {isRunning && (
            <Circle className="w-2 h-2 text-vsc-accent fill-vsc-accent animate-pulse ml-0.5" />
          )}
        </button>

        {/* Tab: Problems */}
        <button
          onClick={() => setActiveTab("problems")}
          className={`flex items-center gap-1.5 px-3 h-full text-[11px] font-medium border-b-2 transition-colors ${
            activeTab === "problems"
              ? "text-vsc-text-bright border-vsc-accent"
              : "text-vsc-text-dim border-transparent hover:text-vsc-text"
          }`}
          style={{ background: activeTab === "problems" ? "#1e1e1e" : "#181818" }}
        >
          <AlertOctagon className="w-3 h-3" />
          Problems
          {errorCount > 0 && (
            <span className="px-1 py-0 rounded-sm text-[9px] font-bold bg-vsc-error/20 text-vsc-error">
              {errorCount}
            </span>
          )}
          {warningCount > 0 && !errorCount && (
            <span className="px-1 py-0 rounded-sm text-[9px] font-bold bg-vsc-warning/20 text-vsc-warning">
              {warningCount}
            </span>
          )}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status indicator */}
        {!isRunning && entries.length > 0 && activeTab === "terminal" && (
          <span className="flex items-center gap-1 mr-2">
            <Circle className="w-2 h-2 text-vsc-success fill-vsc-success" />
            <span className="text-[10px] text-vsc-success">idle</span>
          </span>
        )}

        {/* Clear button */}
        <button
          onClick={activeTab === "terminal" ? clearLogs : clearProblems}
          className="p-1.5 mr-1 rounded-sm text-vsc-text-dim hover:text-vsc-text hover:bg-vsc-list-hover transition-colors"
          title={activeTab === "terminal" ? "Clear terminal" : "Clear problems"}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* ── Terminal Tab Content ──────────────────────────────────────── */}
      {activeTab === "terminal" && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-[11px] leading-[18px] p-2"
          style={{
            background: "#181818",
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 17px, #2b2b2b08 17px, #2b2b2b08 18px)",
          }}
        >
          {entries.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 opacity-40">
              <Terminal className="w-6 h-6" />
              <p className="text-[11px] text-vsc-text-subtle">
                Terminal output will appear here
              </p>
              <p className="text-[10px] text-vsc-text-subtle">
                Accept file changes to trigger compilation
              </p>
            </div>
          )}

          {entries.map((entry) => {
            const config = levelConfig[entry.level];
            const Icon = config.icon;

            return (
              <div
                key={entry.id}
                className={`flex items-start gap-1.5 py-[1px] px-1 rounded-sm hover:bg-vsc-list-hover/30 transition-colors ${
                  entry.level === "error" ? "bg-vsc-error/5" : ""
                }`}
              >
                {/* Timestamp */}
                <span className="text-vsc-text-subtle shrink-0 select-none">
                  {formatTime(entry.timestamp)}
                </span>

                {/* Level badge */}
                <span
                  className={`shrink-0 select-none ${config.color} opacity-70`}
                >
                  [{config.label}]
                </span>

                {/* Source badge */}
                {entry.source && (
                  <span className="shrink-0 select-none text-vsc-accent/60">
                    [{entry.source}]
                  </span>
                )}

                {/* Message */}
                <span className={`${config.color} break-all`}>
                  {entry.message}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Problems Tab Content ──────────────────────────────────────── */}
      {activeTab === "problems" && (
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-[11px] leading-[18px] p-2"
          style={{ background: "#181818" }}
        >
          {problems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 opacity-40">
              <CheckCircle2 className="w-6 h-6 text-vsc-success" />
              <p className="text-[11px] text-vsc-text-subtle">
                No problems detected
              </p>
              <p className="text-[10px] text-vsc-text-subtle">
                Compilation errors and warnings will appear here
              </p>
            </div>
          )}

          {problems.map((problem) => (
            <div
              key={problem.id}
              className={`flex items-start gap-2 py-1 px-2 rounded-sm hover:bg-vsc-list-hover/30 transition-colors ${
                problem.severity === "error"
                  ? "border-l-2 border-l-vsc-error"
                  : "border-l-2 border-l-vsc-warning"
              }`}
            >
              {problem.severity === "error" ? (
                <XCircle className="w-3 h-3 text-vsc-error shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-vsc-warning shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={
                    problem.severity === "error"
                      ? "text-vsc-error"
                      : "text-vsc-warning"
                  }
                >
                  {problem.message}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-vsc-accent/70 text-[10px]">
                    {problem.filePath}
                    {problem.line ? `:${problem.line}` : ""}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}