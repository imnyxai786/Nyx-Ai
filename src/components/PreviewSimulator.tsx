"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Globe,
  Code2,
  Loader2,
  AlertTriangle,
  Maximize2,
} from "lucide-react";
import { useWorkspace } from "@/store/workspace";
import { useTerminal } from "@/store/terminal";
import { compileIfChanged, invalidateCompilation } from "@/lib/compiler";

type DeviceMode = "desktop" | "tablet" | "mobile";

export default function PreviewSimulator() {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { files } = useWorkspace();
  const { addIframeLog } = useTerminal();

  // Compile workspace files into HTML for the sandbox iframe
  const compilationResult = useMemo(() => {
    const result = compileIfChanged(files);
    return result;
  }, [files]);

  const compiledHtml = compilationResult.html;

  // Track compilation state
  useEffect(() => {
    if (compilationResult.errors.length > 0) {
      setHasError(true);
      setErrorMessage(compilationResult.errors[0]);
    } else {
      setHasError(false);
      setErrorMessage("");
    }
  }, [compilationResult.errors]);

  // Show brief compiling indicator when files change
  useEffect(() => {
    setIsCompiling(true);
    const timer = setTimeout(() => setIsCompiling(false), 600);
    return () => clearTimeout(timer);
  }, [compiledHtml]);

  // Invalidate compilation cache when files change structurally
  useEffect(() => {
    invalidateCompilation();
  }, [files.length]);

  // ── Iframe console message listener ──────────────────────────────────
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "__nyx_console") {
        addIframeLog(event.data.message, event.data.level);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [addIframeLog]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    invalidateCompilation();
  }, []);

  const handleOpenInNewTab = useCallback(() => {
    const blob = new Blob([compiledHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [compiledHtml]);

  const deviceWidths: Record<DeviceMode, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const fileCount = compilationResult.fileCount;
  const totalSizeKB = (compilationResult.totalSize / 1024).toFixed(1);

  return (
    <div className="flex flex-col h-full" style={{ background: "#181818" }}>
      {/* Header — Cursor-style #181818 with #2b2b2b border */}
      <div
        className="flex items-center justify-between px-2 h-[30px] border-b"
        style={{ background: "#181818", borderColor: "#2b2b2b" }}
      >
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-vsc-accent" />
          <span className="text-[11px] font-medium text-vsc-text-bright">
            App Preview
          </span>
          {isCompiling && (
            <Loader2 className="w-3 h-3 text-vsc-accent animate-spin" />
          )}
          {hasError && (
            <AlertTriangle className="w-3 h-3 text-vsc-error" />
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setDevice("desktop")}
            className={`p-1 rounded-sm transition-colors ${
              device === "desktop"
                ? "text-vsc-accent bg-vsc-accent/10"
                : "text-vsc-text-dim hover:text-vsc-text"
            }`}
            title="Desktop"
          >
            <Monitor className="w-3 h-3" />
          </button>
          <button
            onClick={() => setDevice("tablet")}
            className={`p-1 rounded-sm transition-colors ${
              device === "tablet"
                ? "text-vsc-accent bg-vsc-accent/10"
                : "text-vsc-text-dim hover:text-vsc-text"
            }`}
            title="Tablet"
          >
            <Tablet className="w-3 h-3" />
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`p-1 rounded-sm transition-colors ${
              device === "mobile"
                ? "text-vsc-accent bg-vsc-accent/10"
                : "text-vsc-text-dim hover:text-vsc-text"
            }`}
            title="Mobile"
          >
            <Smartphone className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* URL Bar — #2b2b2b Cursor style */}
      <div
        className="flex items-center gap-1.5 px-2 h-[28px] border-b"
        style={{ background: "#2b2b2b", borderColor: "#2b2b2b" }}
      >
        <button
          onClick={handleRefresh}
          className="p-0.5 text-vsc-text-dim hover:text-vsc-text transition-colors"
          title="Refresh preview"
        >
          <RefreshCw className={`w-3 h-3 ${isCompiling ? "animate-spin" : ""}`} />
        </button>
        <div
          className="flex-1 flex items-center gap-1.5 rounded-sm px-2 py-0.5"
          style={{ background: "#1e1e1e" }}
        >
          <Code2 className="w-3 h-3 text-vsc-text-subtle" />
          <span className="flex-1 text-vsc-text-dim text-[11px] font-mono tracking-tight truncate">
            localhost:3000 — live sandbox
          </span>
          <span className="text-vsc-text-subtle text-[10px] font-mono">
            {fileCount} files · {totalSizeKB}KB
          </span>
        </div>
        <button
          onClick={handleOpenInNewTab}
          className="p-0.5 text-vsc-text-dim hover:text-vsc-text transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Preview Area — sandboxed iframe with srcdoc */}
      <div
        className="flex-1 flex items-center justify-center p-2 overflow-auto"
        style={{ background: "#181818" }}
      >
        <div
          className="bg-white rounded-sm overflow-hidden border transition-all duration-200"
          style={{
            width: deviceWidths[device],
            maxWidth: "100%",
            height: "100%",
            borderColor: "#2b2b2b",
          }}
        >
          <iframe
            key={refreshKey}
            srcDoc={compiledHtml}
            className="w-full h-full border-0"
            title="App Preview"
            sandbox="allow-scripts allow-modals allow-same-origin"
          />
        </div>
      </div>

      {/* Status Bar — bottom of preview */}
      <div
        className="flex items-center justify-between px-2 h-[22px] border-t text-[10px]"
        style={{ background: "#181818", borderColor: "#2b2b2b" }}
      >
        <div className="flex items-center gap-2">
          {hasError ? (
            <span className="flex items-center gap-1 text-vsc-error">
              <AlertTriangle className="w-2.5 h-2.5" />
              {errorMessage.slice(0, 60)}...
            </span>
          ) : (
            <span className="flex items-center gap-1 text-vsc-success">
              <span className="w-1.5 h-1.5 rounded-full bg-vsc-success" />
              Ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-vsc-text-subtle">
          <span>{compilationResult.cssFiles.length} CSS</span>
          <span>{compilationResult.jsFiles.length} JS</span>
          <span>{compilationResult.htmlFiles.length} HTML</span>
        </div>
      </div>
    </div>
  );
}