// ── MCP SSE Transport ───────────────────────────────────────────────────────
// Handles JSON-RPC 2.0 message framing over Server-Sent Events for MCP

import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  SSETransportConfig,
  SSEMessageEvent,
  MCPConnectionState,
} from "./types";

// ── JSON-RPC Helpers ────────────────────────────────────────────────────────

let _requestId = 0;

/** Create a JSON-RPC 2.0 request object */
export function createRequest(
  method: string,
  params?: Record<string, unknown>
): JsonRpcRequest {
  return {
    jsonrpc: "2.0",
    id: ++_requestId,
    method,
    params,
  };
}

/** Create a JSON-RPC 2.0 notification object (no id, no response expected) */
export function createNotification(
  method: string,
  params?: Record<string, unknown>
): JsonRpcNotification {
  return {
    jsonrpc: "2.0",
    method,
    params,
  };
}

/** Validate that a string is a valid JSON-RPC 2.0 response */
export function isJsonRpcResponse(data: unknown): data is JsonRpcResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "jsonrpc" in data &&
    (data as JsonRpcResponse).jsonrpc === "2.0" &&
    ("result" in data || "error" in data)
  );
}

/** Validate that a string is a valid JSON-RPC 2.0 notification */
export function isJsonRpcNotification(
  data: unknown
): data is JsonRpcNotification {
  return (
    typeof data === "object" &&
    data !== null &&
    "jsonrpc" in data &&
    (data as JsonRpcNotification).jsonrpc === "2.0" &&
    !("id" in data)
  );
}

// ── SSE Transport Class ────────────────────────────────────────────────────

export class SSETransport {
  private config: Required<SSETransportConfig>;
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private state: MCPConnectionState = "disconnected";
  private stateListeners: Set<(state: MCPConnectionState) => void> = new Set();
  private messageHandlers: Set<(msg: JsonRpcResponse | JsonRpcNotification) => void> = new Set();

  constructor(config: SSETransportConfig) {
    this.config = {
      url: config.url,
      headers: config.headers ?? {},
      reconnectInterval: config.reconnectInterval ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
    };
  }

  // ── Connection Lifecycle ──────────────────────────────────────────────

  /** Open the SSE connection to the MCP server */
  connect(): void {
    if (this.eventSource) {
      this.close();
    }

    this.setState("connecting");

    try {
      // Note: EventSource doesn't support custom headers natively.
      // For production, use a proxy endpoint or a library like `eventsource`
      // that supports headers. The URL can include auth as a query param
      // for development purposes.
      const url = new URL(this.config.url);
      if (this.config.headers["Authorization"]) {
        url.searchParams.set("token", this.config.headers["Authorization"]);
      }

      this.eventSource = new EventSource(url.toString());

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.setState("connected");
      };

      this.eventSource.onmessage = (event: MessageEvent) => {
        this.handleSSEMessage({
          data: event.data,
          event: event.type,
          id: (event as MessageEvent & { lastEventId?: string }).lastEventId,
        });
      };

      this.eventSource.onerror = () => {
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.setState("connecting");
          // EventSource will auto-reconnect; we just track attempts
        } else {
          this.setState("error");
          this.close();
        }
      };
    } catch {
      this.setState("error");
    }
  }

  /** Close the SSE connection */
  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.setState("disconnected");
  }

  /** Get current connection state */
  getState(): MCPConnectionState {
    return this.state;
  }

  // ── Sending ────────────────────────────────────────────────────────────

  /**
   * Send a JSON-RPC request to the MCP server via HTTP POST.
   * SSE is used for server→client; client→server uses POST.
   */
  async send(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.headers,
    };

    const response = await fetch(this.config.url, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        jsonrpc: "2.0",
        id: request.id ?? 0,
        error: {
          code: -32000,
          message: `HTTP ${response.status}: ${response.statusText}`,
        },
      };
    }

    const data: unknown = await response.json();
    if (isJsonRpcResponse(data)) {
      return data;
    }

    return {
      jsonrpc: "2.0",
      id: request.id ?? 0,
      error: {
        code: -32700,
        message: "Invalid JSON-RPC response from server",
      },
    };
  }

  // ── Event Subscriptions ───────────────────────────────────────────────

  /** Subscribe to connection state changes */
  onStateChange(listener: (state: MCPConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /** Subscribe to incoming JSON-RPC messages */
  onMessage(
    handler: (msg: JsonRpcResponse | JsonRpcNotification) => void
  ): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  // ── Internals ─────────────────────────────────────────────────────────

  private setState(newState: MCPConnectionState): void {
    this.state = newState;
    for (const listener of this.stateListeners) {
      listener(newState);
    }
  }

  private handleSSEMessage(event: SSEMessageEvent): void {
    try {
      const data: unknown = JSON.parse(event.data);

      if (isJsonRpcResponse(data) || isJsonRpcNotification(data)) {
        for (const handler of this.messageHandlers) {
          handler(data);
        }
      }
    } catch {
      // Ignore malformed SSE messages
    }
  }
}