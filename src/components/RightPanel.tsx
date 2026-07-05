"use client";

import { useState, useRef } from "react";
import CodeViewer from "./CodeViewer";
import PreviewSimulator from "./PreviewSimulator";
import { Code2, Eye, Columns2, GripHorizontal } from "lucide-react";

type ViewMode = "code" | "preview" | "split";

export default function RightPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [splitRatio, setSplitRatio] = useState(50);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    isDragging.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const ratio = Math.max(20, Math.min(80, (y / rect.height) * 100));
    setSplitRatio(ratio);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-vsc-bg"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}
    >
      {/* Tab Bar */}
      <div className="flex items-center justify-between px-1 h-[30px] border-b border-vsc-border bg-vsc-titlebar">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setViewMode("code")}
            className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] font-medium transition-colors ${
              viewMode === "code"
                ? "text-vsc-text-bright bg-vsc-list-active"
                : "text-vsc-text-dim hover:text-vsc-text"
            }`}
          >
            <Code2 className="w-3 h-3" />
            Code
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] font-medium transition-colors ${
              viewMode === "preview"
                ? "text-vsc-text-bright bg-vsc-list-active"
                : "text-vsc-text-dim hover:text-vsc-text"
            }`}
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] font-medium transition-colors ${
              viewMode === "split"
                ? "text-vsc-text-bright bg-vsc-list-active"
                : "text-vsc-text-dim hover:text-vsc-text"
            }`}
          >
            <Columns2 className="w-3 h-3" />
            Split
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "code" && (
        <div className="flex-1 overflow-hidden">
          <CodeViewer />
        </div>
      )}

      {viewMode === "preview" && (
        <div className="flex-1 overflow-hidden">
          <PreviewSimulator />
        </div>
      )}

      {viewMode === "split" && (
        <>
          <div style={{ height: `${splitRatio}%` }} className="overflow-hidden">
            <CodeViewer />
          </div>

          {/* Drag Handle */}
          <div
            onMouseDown={handleMouseDown}
            className="flex items-center justify-center h-[3px] bg-vsc-border hover:bg-vsc-accent cursor-row-resize transition-colors group"
          >
            <GripHorizontal className="w-3 h-3 text-vsc-text-subtle group-hover:text-vsc-accent transition-colors" />
          </div>

          <div style={{ height: `${100 - splitRatio}%` }} className="overflow-hidden">
            <PreviewSimulator />
          </div>
        </>
      )}
    </div>
  );
}