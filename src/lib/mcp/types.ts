// ── MCP Core Types ──────────────────────────────────────────────────────────
// Standard JSON-RPC 2.0 types for Model Context Protocol over SSE

// ── JSON-RPC 2.0 ────────────────────────────────────────────────────────────

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

// ── MCP Protocol Types ──────────────────────────────────────────────────────

export type MCPConnectionState = "disconnected" | "connecting" | "connected" | "error";

export interface MCPServerConfig {
  /** Unique identifier for this MCP server connection */
  id: string;
  /** Display name */
  name: string;
  /** SSE endpoint URL */
  url: string;
  /** Optional API key for authentication */
  apiKey?: string;
  /** Available tools/capabilities this server provides */
  capabilities?: string[];
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPToolCallResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPromptDefinition {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

// ── SSE Transport Types ─────────────────────────────────────────────────────

export interface SSETransportConfig {
  /** The MCP server endpoint */
  url: string;
  /** Custom headers (e.g., Authorization) */
  headers?: Record<string, string>;
  /** Reconnection interval in ms (default: 3000) */
  reconnectInterval?: number;
  /** Max reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
}

export interface SSEMessageEvent {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}