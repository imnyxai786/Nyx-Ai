"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface WorkspaceFile {
  id: string;
  path: string;          // e.g. "src/components/App.tsx"
  name: string;          // e.g. "App.tsx"
  content: string;
  language: string;      // e.g. "typescript", "css", "html"
}

export interface FolderNode {
  name: string;
  path: string;
  children: TreeNode[];
}

export type TreeNode =
  | { kind: "file"; file: WorkspaceFile }
  | { kind: "folder"; folder: FolderNode };

interface WorkspaceState {
  files: WorkspaceFile[];
  activeFileId: string | null;
  openFileIds: string[];   // tabs
}

interface WorkspaceActions {
  addFile: (file: Omit<WorkspaceFile, "id">) => string;  // returns id
  updateFile: (id: string, updates: Partial<Pick<WorkspaceFile, "content" | "path" | "name" | "language">>) => void;
  deleteFile: (id: string) => void;
  setActiveFile: (id: string | null) => void;
  openFile: (id: string) => void;
  closeFile: (id: string) => void;
  upsertFile: (path: string, content: string, language: string) => string; // returns id
  getActiveFile: () => WorkspaceFile | undefined;
  buildTree: () => TreeNode[];
}

type WorkspaceContext = WorkspaceState & WorkspaceActions;

// ── Helpers ────────────────────────────────────────────────────────────────

let _nextId = 1;
function genId() {
  return `file_${Date.now()}_${_nextId++}`;
}

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    css: "css",
    scss: "scss",
    html: "html",
    json: "json",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
    rs: "rust",
    go: "go",
    java: "java",
    rb: "ruby",
    php: "php",
    sh: "bash",
    bash: "bash",
    sql: "sql",
    xml: "xml",
    svg: "svg",
  };
  return map[ext] ?? "plaintext";
}

// ── Default project files ─────────────────────────────────────────────────

const DEFAULT_FILES: Omit<WorkspaceFile, "id">[] = [
  {
    path: "src/app/page.tsx",
    name: "page.tsx",
    content: `import MainLayout from "@/components/MainLayout";

export default function Home() {
  return <MainLayout />;
}`,
    language: "typescript",
  },
  {
    path: "src/app/layout.tsx",
    name: "layout.tsx",
    content: `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nyx AI — Intelligent Code Assistant",
  description: "A pristine dark-themed AI code assistant with live preview",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}`,
    language: "typescript",
  },
  {
    path: "src/app/globals.css",
    name: "globals.css",
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --vsc-bg: #1e1e1e;
  --vsc-sidebar: #252526;
  --vsc-accent: #0078d4;
}`,
    language: "css",
  },
  {
    path: "src/components/MainLayout.tsx",
    name: "MainLayout.tsx",
    content: `"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import ChatPane from "./ChatPane";
import RightPanel from "./RightPanel";

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-vsc-bg">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 min-w-0 border-r border-vsc-border">
        <ChatPane />
      </div>
      <div className="w-[480px] flex-shrink-0">
        <RightPanel />
      </div>
    </div>
  );
}`,
    language: "typescript",
  },
  {
    path: "package.json",
    name: "package.json",
    content: `{
  "name": "nyx-ai",
  "version": "0.1.0",
  "private": true
}`,
    language: "json",
  },
];

// ── Per-user localStorage helpers ──────────────────────────────────────────

function workspaceStorageKey(userId: string) {
  return `nyx-ai:workspace:${userId}`;
}

function loadWorkspaceFromStorage(userId: string): WorkspaceState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(workspaceStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.files && Array.isArray(parsed.files)) {
        return parsed as WorkspaceState;
      }
    }
  } catch {
    // ignore corrupt data
  }
  return null;
}

function saveWorkspaceToStorage(userId: string, state: WorkspaceState) {
  if (typeof window === "undefined" || userId === "anonymous") return;
  try {
    localStorage.setItem(workspaceStorageKey(userId), JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function createDefaultState(): WorkspaceState {
  const files: WorkspaceFile[] = DEFAULT_FILES.map((f) => ({
    ...f,
    id: genId(),
  }));
  return {
    files,
    activeFileId: files[0]?.id ?? null,
    openFileIds: files[0]?.id ? [files[0].id] : [],
  };
}

// ── Context ────────────────────────────────────────────────────────────────

const WorkspaceCtx = createContext<WorkspaceContext | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────

export function WorkspaceProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<WorkspaceState>(() => {
    if (userId && userId !== "anonymous") {
      const saved = loadWorkspaceFromStorage(userId);
      if (saved) return saved;
    }
    return createDefaultState();
  });

  // When userId changes, load the correct workspace
  useEffect(() => {
    if (userId && userId !== "anonymous") {
      const saved = loadWorkspaceFromStorage(userId);
      if (saved) {
        setState(saved);
      } else {
        setState(createDefaultState());
      }
    }
  }, [userId]);

  // Persist workspace state on every change
  useEffect(() => {
    if (userId && userId !== "anonymous") {
      saveWorkspaceToStorage(userId, state);
    }
  }, [userId, state]);

  const addFile = useCallback(
    (file: Omit<WorkspaceFile, "id">): string => {
      const id = genId();
      setState((prev) => ({
        ...prev,
        files: [...prev.files, { ...file, id }],
      }));
      return id;
    },
    []
  );

  const updateFile = useCallback(
    (id: string, updates: Partial<Pick<WorkspaceFile, "content" | "path" | "name" | "language">>) => {
      setState((prev) => ({
        ...prev,
        files: prev.files.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        ),
      }));
    },
    []
  );

  const deleteFile = useCallback((id: string) => {
    setState((prev) => {
      const files = prev.files.filter((f) => f.id !== id);
      const openFileIds = prev.openFileIds.filter((fid) => fid !== id);
      const activeFileId =
        prev.activeFileId === id
          ? openFileIds[0] ?? null
          : prev.activeFileId;
      return { files, activeFileId, openFileIds };
    });
  }, []);

  const setActiveFile = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, activeFileId: id }));
  }, []);

  const openFile = useCallback((id: string) => {
    setState((prev) => {
      if (prev.openFileIds.includes(id)) {
        return { ...prev, activeFileId: id };
      }
      return { ...prev, activeFileId: id, openFileIds: [...prev.openFileIds, id] };
    });
  }, []);

  const closeFile = useCallback((id: string) => {
    setState((prev) => {
      const openFileIds = prev.openFileIds.filter((fid) => fid !== id);
      let activeFileId = prev.activeFileId;
      if (activeFileId === id) {
        const idx = prev.openFileIds.indexOf(id);
        activeFileId =
          openFileIds[Math.min(idx, openFileIds.length - 1)] ?? null;
      }
      return { ...prev, activeFileId, openFileIds };
    });
  }, []);

  const upsertFile = useCallback(
    (path: string, content: string, language: string): string => {
      let existingId: string | null = null;
      setState((prev) => {
        const existing = prev.files.find((f) => f.path === path);
        if (existing) {
          existingId = existing.id;
          return {
            ...prev,
            files: prev.files.map((f) =>
              f.id === existing.id ? { ...f, content, language } : f
            ),
          };
        }
        return prev;
      });

      // If we didn't find it in the current state batch, add it
      if (!existingId) {
        const name = path.split("/").pop() ?? path;
        const id = addFile({ path, name, content, language });
        return id;
      }

      // Also open the file
      openFile(existingId);
      return existingId;
    },
    [addFile, openFile]
  );

  const getActiveFile = useCallback((): WorkspaceFile | undefined => {
    // We read from the latest state via a ref trick — but since this is
    // called in render, we just use the state directly in components.
    // This helper is mainly for convenience.
    return undefined; // components should use useWorkspace() directly
  }, []);

  // Build tree from flat file list
  const buildTree = useCallback((): TreeNode[] => {
    const root: TreeNode[] = [];

    const sortedFiles = [...state.files].sort((a, b) =>
      a.path.localeCompare(b.path)
    );

    for (const file of sortedFiles) {
      const parts = file.path.split("/");
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join("/");

        if (isFile) {
          current.push({ kind: "file", file });
        } else {
          let folderNode = current.find(
            (n) => n.kind === "folder" && n.folder.name === part
          );
          if (!folderNode) {
            const folder: FolderNode = {
              name: part,
              path: currentPath,
              children: [],
            };
            folderNode = { kind: "folder", folder };
            current.push(folderNode);
          }
          if (folderNode.kind === "folder") {
            current = folderNode.folder.children;
          }
        }
      }
    }

    // Sort: folders first, then files, alphabetical within each group
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.kind === "folder" && b.kind === "file") return -1;
        if (a.kind === "file" && b.kind === "folder") return 1;
        const aName = a.kind === "folder" ? a.folder.name : a.file.name;
        const bName = b.kind === "folder" ? b.folder.name : b.file.name;
        return aName.localeCompare(bName);
      }).map((n) => {
        if (n.kind === "folder") {
          return { ...n, folder: { ...n.folder, children: sortNodes(n.folder.children) } };
        }
        return n;
      });
    };

    return sortNodes(root);
  }, [state.files]);

  const ctx: WorkspaceContext = {
    ...state,
    addFile,
    updateFile,
    deleteFile,
    setActiveFile,
    openFile,
    closeFile,
    upsertFile,
    getActiveFile,
    buildTree,
  };

  return (
    <WorkspaceCtx.Provider value={ctx}>{children}</WorkspaceCtx.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useWorkspace(): WorkspaceContext {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}

export { detectLanguage };