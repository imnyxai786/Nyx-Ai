"use client";

import { useState } from "react";
import {
  MessageSquare,
  Code2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FolderOpen,
  Search,
  Plus,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  FileText,
  FileCode2,
  FileJson,
  FileType,
  Folder,
  FolderClosed,
} from "lucide-react";
import { useWorkspace, TreeNode, WorkspaceFile } from "@/store/workspace";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: MessageSquare, label: "Chats" },
  { icon: Code2, label: "Projects" },
  { icon: FolderOpen, label: "Files" },
  { icon: Search, label: "Search" },
  { icon: Settings, label: "Settings" },
];

const recentChats = [
  "React Dashboard Layout",
  "API Integration Help",
  "CSS Grid vs Flexbox",
  "TypeScript Generics",
];

// ── File icon helper ────────────────────────────────────────────────────────

function getFileIcon(file: WorkspaceFile) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
      return <FileCode2 className="w-3.5 h-3.5 text-blue-400" />;
    case "css":
    case "scss":
      return <FileCode2 className="w-3.5 h-3.5 text-purple-400" />;
    case "json":
      return <FileJson className="w-3.5 h-3.5 text-yellow-400" />;
    case "html":
      return <FileCode2 className="w-3.5 h-3.5 text-orange-400" />;
    case "md":
      return <FileText className="w-3.5 h-3.5 text-gray-400" />;
    default:
      return <FileType className="w-3.5 h-3.5 text-vsc-text-dim" />;
  }
}

// ── Tree Node Component ────────────────────────────────────────────────────

function TreeNodeItem({
  node,
  depth,
  activeFileId,
  onFileClick,
  defaultExpanded,
}: {
  node: TreeNode;
  depth: number;
  activeFileId: string | null;
  onFileClick: (id: string) => void;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hovered, setHovered] = useState(false);

  if (node.kind === "file") {
    const isActive = node.file.id === activeFileId;
    return (
      <button
        onClick={() => onFileClick(node.file.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`w-full flex items-center gap-1.5 pl-2 pr-2 py-[3px] text-[11px] transition-colors duration-75 ${
          isActive
            ? "bg-vsc-list-active text-vsc-text-bright"
            : hovered
            ? "bg-vsc-list-hover text-vsc-text-bright"
            : "text-vsc-text-dim"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        title={node.file.path}
      >
        {getFileIcon(node.file)}
        <span className="truncate">{node.file.name}</span>
      </button>
    );
  }

  // Folder
  const { folder } = node;
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`w-full flex items-center gap-1 py-[3px] text-[11px] transition-colors duration-75 ${
          hovered
            ? "bg-vsc-list-hover text-vsc-text-bright"
            : "text-vsc-text-dim"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3 flex-shrink-0 text-vsc-text-subtle" />
        ) : (
          <ChevronRightIcon className="w-3 h-3 flex-shrink-0 text-vsc-text-subtle" />
        )}
        {expanded ? (
          <Folder className="w-3.5 h-3.5 text-vsc-accent/80 flex-shrink-0" />
        ) : (
          <FolderClosed className="w-3.5 h-3.5 text-vsc-accent/60 flex-shrink-0" />
        )}
        <span className="truncate font-medium">{folder.name}</span>
      </button>
      {expanded && (
        <div>
          {folder.children.map((child) => (
            <TreeNodeItem
              key={
                child.kind === "file"
                  ? child.file.id
                  : `folder-${child.folder.path}`
              }
              node={child}
              depth={depth + 1}
              activeFileId={activeFileId}
              onFileClick={onFileClick}
              defaultExpanded={depth < 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sidebar Component ──────────────────────────────────────────────────────

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("Files");
  const { activeFileId, openFile, buildTree } = useWorkspace();

  const tree = buildTree();

  const handleFileClick = (id: string) => {
    openFile(id);
  };

  return (
    <aside
      className={`relative flex flex-col h-full bg-vsc-sidebar border-r border-vsc-border transition-all duration-200 ${
        collapsed ? "w-12" : "w-60"
      }`}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 px-3 h-[35px] border-b border-vsc-border bg-vsc-titlebar">
        <div className="flex-shrink-0 w-5 h-5 rounded-sm bg-vsc-accent/20 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-vsc-accent" />
        </div>
        {!collapsed && (
          <span className="font-medium text-vsc-text-bright text-xs tracking-wide">
            NYX AI
          </span>
        )}
      </div>

      {/* New Chat Button */}
      {!collapsed && (
        <div className="px-2 pt-2">
          <button className="w-full vsc-btn-primary flex items-center justify-center gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="px-1 py-2 space-y-0.5">
        {navItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => setActiveNav(label)}
            onMouseEnter={() => setHoveredItem(label)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`w-full flex items-center gap-2.5 px-2 py-1 rounded-sm text-xs transition-colors duration-100 ${
              activeNav === label
                ? "bg-vsc-list-active text-vsc-text-bright"
                : hoveredItem === label
                ? "bg-vsc-list-hover text-vsc-text-bright"
                : "text-vsc-text-dim"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* File Tree Explorer */}
      {!collapsed && (
        <div className="flex-1 flex flex-col min-h-0 border-t border-vsc-border">
          {/* Explorer Header */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-vsc-titlebar">
            <span className="text-[10px] font-semibold text-vsc-text-subtle uppercase tracking-wider">
              Explorer
            </span>
          </div>

          {/* Tree Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {tree.map((node) => (
              <TreeNodeItem
                key={
                  node.kind === "file"
                    ? node.file.id
                    : `folder-${node.folder.path}`
                }
                node={node}
                depth={0}
                activeFileId={activeFileId}
                onFileClick={handleFileClick}
                defaultExpanded={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Chats (when Files nav not active) */}
      {!collapsed && activeNav !== "Files" && (
        <div className="px-1 py-2 border-t border-vsc-border">
          <p className="px-2 mb-1 text-[11px] font-medium text-vsc-text-subtle uppercase tracking-wider">
            Recent
          </p>
          {recentChats.map((chat) => (
            <button
              key={chat}
              onMouseEnter={() => setHoveredItem(chat)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-full text-left px-2 py-1 rounded-sm text-xs transition-colors duration-100 truncate ${
                hoveredItem === chat
                  ? "bg-vsc-list-hover text-vsc-text-bright"
                  : "text-vsc-text-dim"
              }`}
            >
              {chat}
            </button>
          ))}
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-sm bg-vsc-sidebar border border-vsc-border flex items-center justify-center text-vsc-text-dim hover:text-vsc-accent hover:border-vsc-border-focus transition-colors duration-150 z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
}