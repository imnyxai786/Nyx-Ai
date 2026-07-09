"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Sidebar from "./Sidebar";
import ChatPane from "./ChatPane";
import PreviewSimulator from "./PreviewSimulator";
import TerminalLogs from "./TerminalLogs";
import SettingsPanel from "./SettingsPanel";
import { WorkspaceProvider } from "@/store/workspace";
import { TerminalProvider, useTerminal } from "@/store/terminal";
import { useUserProfile } from "@/store/userProfile";
import { useRequestGuard } from "@/hooks/useRequestGuard";
import { useMCP } from "@/hooks/useMCP";
import { useBugHunter } from "@/hooks/useBugHunter";
import {
  PanelRightOpen,
  PanelRightClose,
  GripHorizontal,
  Eye,
  Terminal,
  LayoutDashboard,
  Zap,
  Settings,
} from "lucide-react";

// ── Inner layout that uses terminal + auth context ─────────────────────────

function MainLayoutInner() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerSplit, setDrawerSplit] = useState(55); // % for preview
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isDragging = useRef(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { initializeTerminal } = useTerminal();
  const { isPremium, byokKey, requestLimit } = useUserProfile();
  const { remainingRequests } = useRequestGuard();

  // Initialize MCP filesystem server on session start
  useMCP();

  // Activate BugHunter — watches terminal for errors and generates fix proposals
  useBugHunter();

  // Initialize terminal boot sequence on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeTerminal();
    }, 300);
    return () => clearTimeout(timer);
  }, [initializeTerminal]);

  const handleDragStart = () => {
    isDragging.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !drawerRef.current) return;
    const rect = drawerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const ratio = Math.max(20, Math.min(80, (y / rect.height) * 100));
    setDrawerSplit(ratio);
  };

  const handleMouseUp = () => {
    if (isDragging.current) {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-vsc-bg"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Chat Pane */}
      <div className="flex-1 min-w-0 border-r border-vsc-border flex flex-col">
        {/* Top bar with user info + request counter */}
        <div className="flex items-center justify-between px-3 h-[30px] border-b border-vsc-border bg-vsc-sidebar flex-shrink-0">
          <div className="flex items-center gap-2">
            {isPremium ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-amber-400/10 border border-amber-400/20">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-medium text-amber-400">Pro</span>
              </div>
            ) : byokKey ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-emerald-400/10 border border-emerald-400/20">
                <span className="text-[10px] font-medium text-emerald-400">BYOK</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-vsc-input border border-vsc-border">
                <span className="text-[10px] text-vsc-text-dim">
                  {remainingRequests}/{requestLimit} left
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1 rounded-sm text-vsc-text-dim hover:text-vsc-text hover:bg-vsc-list-hover transition-colors"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-6 h-6",
                },
              }}
            />
          </div>
        </div>

        {/* Chat content */}
        <div className="flex-1 min-h-0">
          <ChatPane />
        </div>
      </div>

      {/* Right Drawer — Collapsible Preview/Terminal Panel */}
      {drawerOpen && (
        <div
          ref={drawerRef}
          className="w-[480px] flex-shrink-0 flex flex-col border-l"
          style={{ background: "#181818", borderColor: "#2b2b2b" }}
        >
          {/* Drawer Header — Cursor-style */}
          <div
            className="flex items-center justify-between px-2 h-[30px] border-b"
            style={{ background: "#181818", borderColor: "#2b2b2b" }}
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-3 h-3 text-vsc-accent" />
              <span className="text-[11px] font-medium text-vsc-text-bright">
                Live Preview & Terminal
              </span>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1 rounded-sm text-vsc-text-dim hover:text-vsc-text hover:bg-vsc-list-hover transition-colors"
              title="Close panel"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* App Preview — top section */}
          <div
            style={{ height: `${drawerSplit}%` }}
            className="overflow-hidden"
          >
            <PreviewSimulator />
          </div>

          {/* Drag Handle between Preview and Terminal */}
          <div
            onMouseDown={handleDragStart}
            className="flex items-center justify-center h-[5px] cursor-row-resize group relative transition-colors"
            style={{ background: "#2b2b2b" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#007acc")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#2b2b2b")
            }
          >
            <div className="absolute inset-x-0 -top-1 -bottom-1" />
            <GripHorizontal className="w-3.5 h-3.5 text-vsc-text-subtle group-hover:text-white transition-colors" />
          </div>

          {/* Terminal Logs — bottom section */}
          <div
            style={{ height: `${100 - drawerSplit}%` }}
            className="overflow-hidden"
          >
            <TerminalLogs />
          </div>
        </div>
      )}

      {/* Drawer Toggle — shown when drawer is closed */}
      {!drawerOpen && (
        <div
          className="flex flex-col items-center border-l"
          style={{ background: "#181818", borderColor: "#2b2b2b" }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 text-vsc-text-dim hover:text-vsc-accent hover:bg-vsc-list-hover transition-colors"
            title="Open Live Preview panel"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
          <div className="flex flex-col items-center gap-1 mt-2">
            <Eye className="w-3 h-3 text-vsc-text-subtle" />
            <Terminal className="w-3 h-3 text-vsc-text-subtle" />
          </div>
        </div>
      )}

      {/* Modals */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

// ── Main Layout with providers ─────────────────────────────────────────────

export default function MainLayout() {
  const { user } = useUser();
  const userId = user?.id ?? null;

  return (
    <WorkspaceProvider userId={userId}>
      <TerminalProvider userId={userId}>
        <MainLayoutInner />
      </TerminalProvider>
    </WorkspaceProvider>
  );
}