"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { mcpRegistry, type MCPServerConfig, type MCPConnectionState } from "@/lib/mcp";

// ── Default Local Filesystem MCP Server Config ──────────────────────────────

const LOCAL_FS_MCP_CONFIG: MCPServerConfig = {
  id: "local-filesystem",
  name: "Local Filesystem",
  url: "http://localhost:3001/mcp",
};

// ── useMCP Hook ──────────────────────────────────────────────────────────────

export function useMCP() {
  const [connectionState, setConnectionState] = useState<MCPConnectionState>("disconnected");
  const [tools, setTools] = useState<string[]>([]);
  const initializedRef = useRef(false);

  const initialize = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      setConnectionState("connecting");

      // Attempt to connect to the local filesystem MCP server
      // If the server isn't running, we gracefully degrade to disconnected
      const client = await mcpRegistry.register(LOCAL_FS_MCP_CONFIG);

      // Subscribe to state changes
      client.onStateChange((state) => {
        setConnectionState(state);
        if (state === "connected") {
          const toolNames = client.listTools().map((t) => t.name);
          setTools(toolNames);
        }
      });

      setConnectionState(client.getState());
      const toolNames = client.listTools().map((t) => t.name);
      setTools(toolNames);
    } catch {
      // MCP server not available — gracefully degrade
      setConnectionState("disconnected");
      initializedRef.current = false; // Allow retry on next session
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    connectionState,
    tools,
    isReady: connectionState === "connected",
  };
}