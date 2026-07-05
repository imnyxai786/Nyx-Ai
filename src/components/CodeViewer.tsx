"use client";

import { useState, useCallback } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import {
  Copy,
  Check,
  FileCode2,
  ChevronDown,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
} from "lucide-react";
import { useWorkspace } from "@/store/workspace";
import { useInlineCompletion } from "@/hooks/useInlineCompletion";

// Map our workspace language IDs to Monaco language IDs
function toMonacoLanguage(lang?: string): string {
  const map: Record<string, string> = {
    typescript: "typescript",
    javascript: "javascript",
    css: "css",
    scss: "scss",
    html: "html",
    json: "json",
    markdown: "markdown",
    yaml: "yaml",
    python: "python",
    rust: "rust",
    go: "go",
    java: "java",
    ruby: "ruby",
    php: "php",
    bash: "shell",
    sql: "sql",
    xml: "xml",
    svg: "xml",
    plaintext: "plaintext",
  };
  return map[lang ?? ""] ?? "plaintext";
}

export default function CodeViewer() {
  const [copied, setCopied] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [completionEnabled, setCompletionEnabled] = useState(true);
  const [editorInstance, setEditorInstance] = useState<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [monacoInstance, setMonacoInstance] = useState<typeof Monaco | null>(null);

  const {
    files,
    activeFileId,
    openFileIds,
    openFile,
    closeFile,
    updateFile,
  } = useWorkspace();

  const activeFile = files.find((f) => f.id === activeFileId);
  const openFiles = openFileIds
    .map((id) => files.find((f) => f.id === id))
    .filter(Boolean) as typeof files;

  // Wire up the inline completion provider
  useInlineCompletion({
    editor: editorInstance,
    monaco: monacoInstance,
    fileName: activeFile?.name,
    language: activeFile?.language,
    enabled: completionEnabled,
  });

  const handleCopy = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTabClick = (id: string) => {
    openFile(id);
  };

  const handleTabClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    closeFile(id);
  };

  // Monaco editor mount handler
  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    setEditorInstance(editor);
    setMonacoInstance(monaco);

    // Define our custom Nyx Dark theme matching Cursor AI Dark Mode
    monaco.editor.defineTheme("nyx-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6a9955", fontStyle: "italic" },
        { token: "keyword", foreground: "569cd6" },
        { token: "string", foreground: "ce9178" },
        { token: "number", foreground: "b5cea8" },
        { token: "type", foreground: "4ec9b0" },
        { token: "function", foreground: "dcdcaa" },
        { token: "variable", foreground: "9cdcfe" },
        { token: "operator", foreground: "d4d4d4" },
        { token: "tag", foreground: "569cd6" },
        { token: "attribute.name", foreground: "9cdcfe" },
        { token: "attribute.value", foreground: "ce9178" },
        { token: "delimiter", foreground: "d4d4d4" },
        { token: "delimiter.bracket", foreground: "ffd700" },
        { token: "regexp", foreground: "d16969" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editor.lineHighlightBackground": "#2a2a2a",
        "editor.selectionBackground": "#264f78",
        "editor.inactiveSelectionBackground": "#3a3d41",
        "editorCursor.foreground": "#aeafad",
        "editorWhitespace.foreground": "#3b3b3b",
        "editorIndentGuide.background": "#404040",
        "editorIndentGuide.activeBackground": "#707070",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#d4d4d4",
        "editor.selectionHighlightBackground": "#add6ff26",
        "editor.wordHighlightBackground": "#5a5a5a",
        "editorBracketMatch.background": "#0064001a",
        "editorBracketMatch.border": "#888888",
        "minimap.background": "#1e1e1e",
        "scrollbarSlider.background": "#42424280",
        "scrollbarSlider.hoverBackground": "#4f4f4f",
        "scrollbarSlider.activeBackground": "#646464",
        "editorWidget.background": "#181818",
        "editorWidget.border": "#2b2b2b",
        "editorSuggestWidget.background": "#181818",
        "editorSuggestWidget.border": "#2b2b2b",
        "editorSuggestWidget.selectedBackground": "#2a2a2a",
        "editorSuggestWidget.highlightForeground": "#007acc",
        "editorGhostText.foreground": "#6a6a6a",
        "editorInlineSuggestion.foreground": "#6a6a6a",
        "editorGutter.background": "#1e1e1e",
        "editorOverviewRuler.border": "#2b2b2b",
        "editorPane.background": "#1e1e1e",
        "tab.activeBackground": "#2a2a2a",
        "tab.inactiveBackground": "#181818",
        "tab.border": "#2b2b2b",
        "tab.activeBorderTop": "#007acc",
        "editorGroupHeader.tabsBackground": "#181818",
        "editorGroup.border": "#2b2b2b",
      },
    });

    // Apply the theme
    monaco.editor.setTheme("nyx-dark");

    // Configure editor settings
    editor.updateOptions({
      fontLigatures: true,
      smoothScrolling: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      renderLineHighlight: "all",
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      suggest: {
        showInlineDetails: true,
      },
    });

    // Add Ctrl+I keybinding to manually trigger inline suggestion
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI,
      () => {
        editor.trigger("nyx", "editor.action.inlineSuggest.trigger", null);
      }
    );
  }, []);

  // Handle content changes from the editor → update workspace store
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeFileId && value !== undefined) {
        updateFile(activeFileId, { content: value });
      }
    },
    [activeFileId, updateFile]
  );

  const code = activeFile?.content ?? "";
  const lineCount = code.split("\n").length;

  const langLabel = activeFile?.language
    ? activeFile.language === "typescript"
      ? "TypeScript React"
      : activeFile.language.charAt(0).toUpperCase() +
        activeFile.language.slice(1)
    : "Plain Text";

  return (
    <div
      className={`flex flex-col h-full bg-vsc-bg ${
        maximized ? "absolute inset-0 z-50" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 h-[30px] border-b border-vsc-border bg-vsc-titlebar">
        <div className="flex items-center gap-1.5">
          <FileCode2 className="w-3 h-3 text-vsc-accent" />
          <span className="text-[11px] font-medium text-vsc-text-bright">
            Code
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setCompletionEnabled(!completionEnabled)}
            className={`p-1 rounded-sm transition-colors ${
              completionEnabled
                ? "text-vsc-accent hover:text-vsc-accent-hover"
                : "text-vsc-text-dim hover:text-vsc-text"
            } hover:bg-vsc-list-hover`}
            title={
              completionEnabled
                ? "AI completions enabled (click to disable)"
                : "AI completions disabled (click to enable)"
            }
          >
            <Sparkles className="w-3 h-3" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1 rounded-sm text-vsc-text-dim hover:text-vsc-text hover:bg-vsc-list-hover transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-3 h-3 text-vsc-success" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={() => setMaximized(!maximized)}
            className="p-1 rounded-sm text-vsc-text-dim hover:text-vsc-text hover:bg-vsc-list-hover transition-colors"
            title={maximized ? "Minimize" : "Maximize"}
          >
            {maximized ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* File Tabs */}
      <div className="flex items-center gap-0 border-b border-vsc-border bg-vsc-sidebar overflow-x-auto">
        {openFiles.map((file) => (
          <button
            key={file.id}
            onClick={() => handleTabClick(file.id)}
            className={`flex items-center gap-1 px-3 py-1 text-[11px] font-medium border-b-2 transition-colors group shrink-0 ${
              activeFileId === file.id
                ? "text-vsc-text-bright border-vsc-accent bg-vsc-input"
                : "text-vsc-text-dim border-transparent hover:text-vsc-text hover:bg-vsc-list-hover"
            }`}
          >
            <span className="truncate max-w-[100px]">{file.name}</span>
            <span
              onClick={(e) => handleTabClose(e, file.id)}
              className="ml-1 p-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-vsc-list-hover transition-opacity"
            >
              <X className="w-2.5 h-2.5" />
            </span>
          </button>
        ))}
        <button className="px-1.5 py-1 text-vsc-text-dim hover:text-vsc-text transition-colors shrink-0">
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        {activeFile ? (
          <Editor
            height="100%"
            language={toMonacoLanguage(activeFile.language)}
            value={activeFile.content}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            theme="nyx-dark"
            path={activeFile.path}
            options={{
              fontSize: 13,
              lineHeight: 20,
              fontFamily:
                "'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace",
              fontLigatures: true,
              minimap: {
                enabled: true,
                scale: 1,
                showSlider: "mouseover",
              },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              renderLineHighlight: "all",
              bracketPairColorization: {
                enabled: true,
              },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              padding: { top: 8, bottom: 8 },
              lineNumbers: "on",
              glyphMargin: false,
              folding: true,
              renderWhitespace: "selection",
              tabSize: 2,
              wordWrap: "off",
              automaticLayout: true,
              suggest: {
                showInlineDetails: true,
              },
              inlineSuggest: {
                enabled: completionEnabled,
                mode: "prefix",
                showToolbar: "onHover",
              },
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
              },
            }}
            loading={
              <div className="flex items-center justify-center h-full text-vsc-text-subtle text-xs">
                <div className="text-center">
                  <div className="animate-spin w-5 h-5 border-2 border-vsc-accent border-t-transparent rounded-full mx-auto mb-2" />
                  <p>Loading editor...</p>
                </div>
              </div>
            }
          />
        ) : (
          <div className="flex items-center justify-center h-full text-vsc-text-subtle text-xs">
            <div className="text-center">
              <FileCode2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No file open</p>
              <p className="text-[10px] mt-1">
                Select a file from the explorer
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-2 h-[22px] border-t border-vsc-border bg-vsc-accent text-white text-[11px]">
        <div className="flex items-center gap-3">
          <span className="font-medium">main</span>
          <span>0 errors</span>
          {completionEnabled && (
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              AI
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeFile && (
            <>
              <span>Ln {lineCount}</span>
              <span>UTF-8</span>
              <span>{langLabel}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}