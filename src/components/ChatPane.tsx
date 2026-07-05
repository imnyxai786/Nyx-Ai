"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Paperclip,
  RotateCcw,
  Copy,
  Check,
  Bot,
  User,
  Terminal,
  AlertCircle,
  StopCircle,
  FilePlus2,
  FileEdit,
  CheckCircle2,
  XCircle,
  X,
  FileCode2,
} from "lucide-react";
import { useWorkspace, detectLanguage } from "@/store/workspace";
import { useTerminal } from "@/store/terminal";
import { useRequestGuard } from "@/hooks/useRequestGuard";
import { useUserProfile } from "@/store/userProfile";

// ── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  filesWritten?: string[];
  pendingFiles?: ParsedFile[];
  composerDismissed?: boolean;
}

// ── File Parsing Utilities ─────────────────────────────────────────────────

interface ParsedFile {
  path: string;
  content: string;
  language: string;
  isNew: boolean;
}

function parseFilesFromContent(content: string, existingPaths: Set<string>): ParsedFile[] {
  const files: ParsedFile[] = [];

  const xmlRegex = /<file\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file>/gi;
  let match: RegExpExecArray | null;

  while ((match = xmlRegex.exec(content)) !== null) {
    const path = match[1].trim();
    const raw = match[2];
    const fileContent = raw.replace(/^\n/, "").replace(/\n$/, "");
    files.push({
      path,
      content: fileContent,
      language: detectLanguage(path),
      isNew: !existingPaths.has(path),
    });
  }

  const mdRegex = /```(\w+)?\s*(?:path=|:)([^\s`]+)\s*\n([\s\S]*?)```/gi;

  while ((match = mdRegex.exec(content)) !== null) {
    const lang = match[1] || "";
    const path = match[2].trim();
    const fileContent = match[3].replace(/\n$/, "");

    if (files.some((f) => f.path === path)) continue;

    files.push({
      path,
      content: fileContent,
      language: lang || detectLanguage(path),
      isNew: !existingPaths.has(path),
    });
  }

  return files;
}

// ── Context File (for @ mentions) ─────────────────────────────────────────

interface ContextFile {
  path: string;
  content: string;
  language: string;
}

// ── Composer Panel Component ──────────────────────────────────────────────

function ComposerPanel({
  files,
  onAccept,
  onDiscard,
}: {
  files: ParsedFile[];
  onAccept: () => void;
  onDiscard: () => void;
}) {
  const createCount = files.filter((f) => f.isNew).length;
  const modifyCount = files.filter((f) => !f.isNew).length;

  return (
    <div className="mt-2 pt-2 border-t border-vsc-border/50">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-sm bg-vsc-accent/15 flex items-center justify-center">
          <FileCode2 className="w-3 h-3 text-vsc-accent" />
        </div>
        <span className="text-[11px] font-semibold text-vsc-text-bright">
          {files.length > 1
            ? `Modifying ${files.length} files...`
            : `Modifying 1 file...`}
        </span>
      </div>

      <div className="space-y-1 mb-2.5">
        {files.map((f) => (
          <div
            key={f.path}
            className="flex items-center gap-2 px-2 py-1.5 rounded-sm bg-vsc-bg border border-vsc-border/60"
          >
            {f.isNew ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-emerald-500/15 text-emerald-400 text-[10px] font-medium">
                <FilePlus2 className="w-2.5 h-2.5" />
                Create
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-amber-500/15 text-amber-400 text-[10px] font-medium">
                <FileEdit className="w-2.5 h-2.5" />
                Modify
              </span>
            )}
            <span className="text-[11px] font-mono text-vsc-text truncate">
              {f.path}
            </span>
          </div>
        ))}
      </div>

      {(createCount > 0 || modifyCount > 0) && (
        <div className="flex items-center gap-3 mb-2.5 text-[10px] text-vsc-text-dim">
          {createCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {createCount} new
            </span>
          )}
          {modifyCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {modifyCount} modified
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onAccept}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-vsc-accent text-white text-[11px] font-medium hover:bg-vsc-accent-hover transition-colors"
        >
          <CheckCircle2 className="w-3 h-3" />
          Accept Changes
        </button>
        <button
          onClick={onDiscard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-vsc-input border border-vsc-border text-vsc-text-dim text-[11px] font-medium hover:text-vsc-text hover:border-vsc-border-focus transition-colors"
        >
          <XCircle className="w-3 h-3" />
          Discard Changes
        </button>
      </div>
    </div>
  );
}

// ── @ Mention Dropdown Component ──────────────────────────────────────────

function MentionDropdown({
  files,
  filter,
  onSelect,
  selectedIndex,
  onSelectedIndexChange,
}: {
  files: { path: string; name: string }[];
  filter: string;
  onSelect: (file: { path: string; name: string }) => void;
  selectedIndex: number;
  onSelectedIndexChange: (idx: number) => void;
}) {
  const filtered = files.filter(
    (f) =>
      f.path.toLowerCase().includes(filter.toLowerCase()) ||
      f.name.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      onSelectedIndexChange(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, selectedIndex, onSelectedIndexChange]);

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 max-h-[200px] overflow-y-auto bg-vsc-sidebar border border-vsc-border rounded-sm shadow-xl z-50">
      <div className="px-2 py-1.5 text-[10px] text-vsc-text-dim font-medium border-b border-vsc-border/50">
        Files in workspace
      </div>
      {filtered.map((f, i) => (
        <button
          key={f.path}
          onClick={() => onSelect(f)}
          onMouseEnter={() => onSelectedIndexChange(i)}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${
            i === selectedIndex
              ? "bg-vsc-accent/15 text-vsc-accent"
              : "text-vsc-text hover:bg-vsc-input"
          }`}
        >
          <FileCode2 className="w-3 h-3 flex-shrink-0 opacity-60" />
          <span className="text-[11px] font-mono truncate">{f.path}</span>
        </button>
      ))}
    </div>
  );
}

// ── ChatPane Component ─────────────────────────────────────────────────────

export default function ChatPane() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { upsertFile, openFile, files } = useWorkspace();
  const { simulateCompilation } = useTerminal();
  const { guardRequest, hasUnlimitedAccess, remainingRequests } = useRequestGuard();
  const { byokKey } = useUserProfile();

  // ── @ Mention State ──
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);

  const workspaceFileList = files.map((f) => ({
    path: f.path,
    name: f.name,
  }));

  const existingPaths = new Set(files.map((f) => f.path));

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "28px";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 128) + "px";
    }
  }, [input]);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.isStreaming ? { ...m, isStreaming: false } : m
        )
      );
    }
  };

  // ── Accept pending files ──
  const handleAcceptFiles = useCallback(
    (messageId: string) => {
      // Extract file paths for terminal simulation before state update
      const currentMsg = messages.find((m) => m.id === messageId);
      const filePaths = currentMsg?.pendingFiles?.map((pf) => pf.path) ?? [];

      setMessages((prev) => {
        const msg = prev.find((m) => m.id === messageId);
        if (!msg?.pendingFiles) return prev;

        const writtenPaths: string[] = [];
        for (const pf of msg.pendingFiles) {
          const id = upsertFile(pf.path, pf.content, pf.language);
          openFile(id);
          writtenPaths.push(pf.path);
        }

        return prev.map((m) =>
          m.id === messageId
            ? { ...m, pendingFiles: undefined, filesWritten: writtenPaths, composerDismissed: true }
            : m
        );
      });

      // Trigger terminal compilation simulation
      if (filePaths.length > 0) {
        simulateCompilation(filePaths);
      }
    },
    [upsertFile, openFile, messages, simulateCompilation]
  );

  // ── Discard pending files ──
  const handleDiscardFiles = useCallback(
    (messageId: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, pendingFiles: undefined, composerDismissed: true }
            : m
        )
      );
    },
    []
  );

  // ── @ Mention handlers ──
  const insertMention = useCallback(
    (file: { path: string; name: string }) => {
      const wsFile = files.find((f) => f.path === file.path);
      if (!wsFile) return;

      const beforeMention = input.slice(0, mentionStartIndex);
      const afterMentionCursor = input.slice(
        mentionStartIndex + 1 + mentionFilter.length
      );
      const newInput = beforeMention + afterMentionCursor;
      setInput(newInput);

      setContextFiles((prev) => {
        if (prev.some((cf) => cf.path === file.path)) return prev;
        return [
          ...prev,
          {
            path: wsFile.path,
            content: wsFile.content,
            language: wsFile.language,
          },
        ];
      });

      setShowMentions(false);
      setMentionFilter("");
      setMentionStartIndex(-1);

      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    [input, mentionStartIndex, mentionFilter, files]
  );

  const removeContextFile = useCallback((path: string) => {
    setContextFiles((prev) => prev.filter((cf) => cf.path !== path));
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // ── Request Guard: enforce limits for free users ──
    if (!guardRequest()) {
      setError(`Request limit reached. Upgrade to Pro or add your own API key in Settings for unlimited access.`);
      return;
    }

    const userContent = input.trim();
    setInput("");
    setError(null);
    const sentContextFiles = [...contextFiles];
    setContextFiles([]);
    setShowMentions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    const apiMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Inject context files into the last user message
    if (sentContextFiles.length > 0) {
      const contextBlock = sentContextFiles
        .map(
          (cf) =>
            `<context-file path="${cf.path}">\n${cf.content}\n</context-file>`
        )
        .join("\n\n");

      const lastMsg = apiMessages[apiMessages.length - 1];
      if (lastMsg && lastMsg.role === "user") {
        lastMsg.content = `${contextBlock}\n\n${lastMsg.content}`;
      }
    }

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        const lines = accumulated.split("\n");
        let remaining = "";
        let tokenText = "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) tokenText += token;
            } catch {
              remaining = line + "\n";
            }
          } else {
            remaining += line + "\n";
          }
        }
        accumulated = remaining;

        if (tokenText) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + tokenText }
                : m
            )
          );
        }
      }

      // Mark streaming complete and parse pending files
      setMessages((prev) => {
        const msg = prev.find((m) => m.id === assistantId);
        if (!msg) return prev;

        const parsedFiles = parseFilesFromContent(msg.content, existingPaths);

        return prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                isStreaming: false,
                pendingFiles:
                  parsedFiles.length > 0 ? parsedFiles : undefined,
              }
            : m
        );
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // ── Input change handler with @ detection ──
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart ?? value.length;
    setInput(value);

    if (value[cursorPos - 1] === "@") {
      if (cursorPos === 1 || /\s/.test(value[cursorPos - 2])) {
        setShowMentions(true);
        setMentionStartIndex(cursorPos - 1);
        setMentionFilter("");
        setSelectedMentionIndex(0);
        return;
      }
    }

    if (showMentions && mentionStartIndex >= 0) {
      const textAfterAt = value.slice(mentionStartIndex + 1, cursorPos);
      if (textAfterAt.includes(" ") || textAfterAt.includes("\n")) {
        setShowMentions(false);
        setMentionStartIndex(-1);
        setMentionFilter("");
      } else {
        setMentionFilter(textAfterAt);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      const filteredFiles = workspaceFileList.filter(
        (f) =>
          f.path.toLowerCase().includes(mentionFilter.toLowerCase()) ||
          f.name.toLowerCase().includes(mentionFilter.toLowerCase())
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < filteredFiles.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredFiles.length - 1
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filteredFiles[selectedMentionIndex]) {
          insertMention(filteredFiles[selectedMentionIndex]);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        setMentionStartIndex(-1);
        setMentionFilter("");
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
    setContextFiles([]);
  };

  return (
    <div className="flex flex-col h-full bg-vsc-sidebar">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-3 h-[35px] border-b border-vsc-border bg-vsc-titlebar">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-vsc-accent" />
          <span className="text-xs font-medium text-vsc-text-bright">
            Nyx Chat
          </span>
          <span className="text-[10px] text-vsc-text-dim bg-vsc-input px-1.5 py-0.5 rounded-sm">
            GPT-4
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {isLoading && (
            <button
              onClick={handleStop}
              className="vsc-btn-ghost p-1 text-vsc-error"
              title="Stop generating"
            >
              <StopCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleClear}
            className="vsc-btn-ghost p-1"
            title="Clear chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-vsc-accent/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-vsc-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-vsc-text-bright mb-1">
                Welcome to Nyx AI
              </h3>
              <p className="text-xs text-vsc-text-dim max-w-[280px]">
                Ask me to write code, debug issues, explain concepts, or build
                entire applications. I can create and modify files directly in
                your workspace.
              </p>
              <p className="text-[10px] text-vsc-text-subtle mt-2">
                Use <span className="text-vsc-accent font-mono">@</span> to
                attach files for context awareness.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${
              msg.role === "user" ? "justify-end" : ""
            }`}
          >
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-sm bg-vsc-accent/15 flex items-center justify-center mt-0.5">
                <Bot className="w-3.5 h-3.5 text-vsc-accent" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-sm px-3 py-2.5 text-[13px] leading-relaxed group ${
                msg.role === "user"
                  ? "bg-vsc-chat-user border border-vsc-border/60 text-vsc-text"
                  : "bg-vsc-chat-user border border-vsc-border/60 text-vsc-text"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="space-y-1.5">
                  {renderAssistantContent(msg)}
                  {msg.isStreaming && !msg.content && (
                    <div className="flex gap-1 py-1">
                      <span className="w-1.5 h-1.5 bg-vsc-accent rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-vsc-accent rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-vsc-accent rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  )}
                  {msg.isStreaming && msg.content && (
                    <span className="inline-block w-1.5 h-4 bg-vsc-accent animate-pulse ml-0.5 align-middle" />
                  )}

                  {/* Composer Panel — shown when files are pending approval */}
                  {!msg.isStreaming && msg.pendingFiles && msg.pendingFiles.length > 0 && (
                    <ComposerPanel
                      files={msg.pendingFiles}
                      onAccept={() => handleAcceptFiles(msg.id)}
                      onDiscard={() => handleDiscardFiles(msg.id)}
                    />
                  )}

                  {/* Files Written Indicator — shown after user accepts */}
                  {!msg.isStreaming && msg.filesWritten && msg.filesWritten.length > 0 && msg.composerDismissed && (
                    <div className="mt-2 pt-2 border-t border-vsc-border/50">
                      <div className="flex items-center gap-1.5 text-[10px] text-vsc-success mb-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="font-medium">
                          {msg.filesWritten.length} file{msg.filesWritten.length > 1 ? "s" : ""} written to workspace
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {msg.filesWritten.map((p) => (
                          <span
                            key={p}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-vsc-accent/10 text-vsc-accent text-[10px] font-mono"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Discarded indicator */}
                  {!msg.isStreaming && msg.composerDismissed && !msg.filesWritten?.length && (
                    <div className="mt-2 pt-2 border-t border-vsc-border/50">
                      <div className="flex items-center gap-1.5 text-[10px] text-vsc-text-dim">
                        <XCircle className="w-3 h-3" />
                        <span className="font-medium">Changes discarded</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p>{msg.content}</p>
              )}

              {!msg.isStreaming && !msg.pendingFiles?.length && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] opacity-40">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.role === "assistant" && msg.content && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 hover:text-vsc-accent transition-opacity text-vsc-text-dim"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-vsc-success" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-sm bg-vsc-accent/15 flex items-center justify-center mt-0.5">
                <User className="w-3.5 h-3.5 text-vsc-accent" />
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-sm bg-vsc-error/10 border border-vsc-error/30 text-vsc-error text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-vsc-text-dim mt-0.5">{error}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-3 pb-3">
        {/* Context file tags */}
        {contextFiles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5 px-1">
            {contextFiles.map((cf) => (
              <span
                key={cf.path}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-vsc-accent/10 text-vsc-accent text-[10px] font-mono group/tag"
              >
                <FileCode2 className="w-2.5 h-2.5" />
                {cf.path}
                <button
                  onClick={() => removeContextFile(cf.path)}
                  className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input box with mention dropdown */}
        <div className="relative">
          {/* @ Mention Dropdown */}
          {showMentions && (
            <MentionDropdown
              files={workspaceFileList}
              filter={mentionFilter}
              onSelect={insertMention}
              selectedIndex={selectedMentionIndex}
              onSelectedIndexChange={setSelectedMentionIndex}
            />
          )}

          <div className="bg-vsc-chat-user border border-vsc-border/60 rounded-sm flex items-end gap-1.5 p-1.5 focus-within:border-vsc-border-focus transition-colors">
            <button className="p-1.5 text-vsc-text-dim hover:text-vsc-text transition-colors">
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                setTimeout(() => {
                  setShowMentions(false);
                  setMentionStartIndex(-1);
                  setMentionFilter("");
                }, 200);
              }}
              placeholder="Ask Nyx anything... (type @ to attach files)"
              rows={1}
              className="flex-1 bg-transparent text-vsc-text placeholder-vsc-text-subtle text-[13px] resize-none outline-none py-1.5 max-h-32 tracking-tight"
              style={{ minHeight: "28px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-1.5 rounded-sm transition-colors duration-150 ${
                input.trim() && !isLoading
                  ? "bg-vsc-accent text-white hover:bg-vsc-accent-hover"
                  : "text-vsc-text-subtle"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-vsc-text-subtle mt-1.5">
          Nyx AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

// ── Render assistant content with code blocks ──────────────────────────────

function renderAssistantContent(msg: Message) {
  const parts = msg.content.split("```");
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const firstNewline = part.indexOf("\n");
          const header = firstNewline >= 0 ? part.slice(0, firstNewline).trim() : "";
          const codeBody = firstNewline >= 0 ? part.slice(firstNewline + 1) : part;

          const pathMatch = header.match(/(?:path=|:)([^\s]+)/);
          const filePath = pathMatch ? pathMatch[1] : null;
          const lang = header.replace(/\s*path=\S+/, "").replace(/:\S+/, "").trim() || "code";

          return (
            <pre
              key={i}
              className="bg-vsc-bg rounded-sm p-3 my-2 overflow-x-auto border border-vsc-border relative"
            >
              {filePath && (
                <span className="absolute top-1.5 right-8 px-1.5 py-0.5 rounded-sm bg-vsc-accent/10 text-vsc-accent text-[10px] font-mono">
                  {filePath}
                </span>
              )}
              <code className="text-xs font-mono text-vsc-token-variable tracking-tight">
                {codeBody}
              </code>
            </pre>
          );
        }

        const cleaned = part.replace(/<file\s+path=["'][^"']+["']\s*>/gi, "").replace(/<\/file>/gi, "");
        return (
          <span key={i} className="whitespace-pre-wrap">
            {cleaned}
          </span>
        );
      })}
    </>
  );
}