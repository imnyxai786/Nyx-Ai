// ── MCP Module ───────────────────────────────────────────────────────────────
// Model Context Protocol — JSON-RPC over SSE for tool/resource/prompt integration

export type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  JsonRpcNotification,
  MCPConnectionState,
  MCPServerConfig,
  MCPToolDefinition,
  MCPToolCallResult,
  MCPResource,
  MCPPromptDefinition,
  SSETransportConfig,
  SSEMessageEvent,
} from "./types";

export {
  createRequest,
  createNotification,
  isJsonRpcResponse,
  isJsonRpcNotification,
  SSETransport,
} from "./transport";

export { MCPClient, mcpRegistry } from "./client";