// ── MCP Client ──────────────────────────────────────────────────────────────
// High-level client for interacting with MCP servers via SSE transport

import type {
  MCPServerConfig,
  MCPToolDefinition,
  MCPToolCallResult,
  MCPResource,
  MCPPromptDefinition,
  MCPConnectionState,
  JsonRpcResponse,
} from "./types";
import { SSETransport, createRequest } from "./transport";

// ── MCP Client ──────────────────────────────────────────────────────────────

export class MCPClient {
  private transport: SSETransport;
  private config: MCPServerConfig;
  private tools: MCPToolDefinition[] = [];
  private resources: MCPResource[] = [];
  private prompts: MCPPromptDefinition[] = [];

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.transport = new SSETransport({
      url: config.url,
      headers: config.apiKey
        ? { Authorization: `Bearer ${config.apiKey}` }
        : undefined,
    });
  }

  // ── Connection ─────────────────────────────────────────────────────────

  /** Connect to the MCP server and discover capabilities */
  async connect(): Promise<void> {
    this.transport.connect();

    // Wait for connection (with timeout)
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10000);

      const unsubscribe = this.transport.onStateChange((state) => {
        if (state === "connected") {
          clearTimeout(timeout);
          unsubscribe();
          resolve();
        } else if (state === "error") {
          clearTimeout(timeout);
          unsubscribe();
          reject(new Error("Connection failed"));
        }
      });

      // Check if already connected
      if (this.transport.getState() === "connected") {
        clearTimeout(timeout);
        unsubscribe();
        resolve();
      }
    });

    // Discover server capabilities
    await this.discover();
  }

  /** Disconnect from the MCP server */
  disconnect(): void {
    this.transport.close();
    this.tools = [];
    this.resources = [];
    this.prompts = [];
  }

  /** Get current connection state */
  getState(): MCPConnectionState {
    return this.transport.getState();
  }

  // ── Capability Discovery ──────────────────────────────────────────────

  /** Discover available tools, resources, and prompts from the server */
  private async discover(): Promise<void> {
    try {
      const [toolsRes, resourcesRes, promptsRes] = await Promise.all([
        this.sendRequest("tools/list"),
        this.sendRequest("resources/list"),
        this.sendRequest("prompts/list"),
      ]);

      if (toolsRes.result && typeof toolsRes.result === "object" && "tools" in toolsRes.result) {
        this.tools = (toolsRes.result as { tools: MCPToolDefinition[] }).tools;
      }

      if (resourcesRes.result && typeof resourcesRes.result === "object" && "resources" in resourcesRes.result) {
        this.resources = (resourcesRes.result as { resources: MCPResource[] }).resources;
      }

      if (promptsRes.result && typeof promptsRes.result === "object" && "prompts" in promptsRes.result) {
        this.prompts = (promptsRes.result as { prompts: MCPPromptDefinition[] }).prompts;
      }
    } catch {
      // Discovery failed — server may not support all methods
    }
  }

  // ── Tool Operations ───────────────────────────────────────────────────

  /** List available tools */
  listTools(): MCPToolDefinition[] {
    return this.tools;
  }

  /** Call a tool by name with arguments */
  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<MCPToolCallResult> {
    const response = await this.sendRequest("tools/call", {
      name,
      arguments: args,
    });

    if (response.error) {
      return {
        content: [
          {
            type: "text",
            text: `Tool call error: ${response.error.message}`,
          },
        ],
        isError: true,
      };
    }

    return (response.result as MCPToolCallResult) ?? {
      content: [{ type: "text", text: "No result" }],
    };
  }

  // ── Resource Operations ───────────────────────────────────────────────

  /** List available resources */
  listResources(): MCPResource[] {
    return this.resources;
  }

  /** Read a resource by URI */
  async readResource(uri: string): Promise<unknown> {
    const response = await this.sendRequest("resources/read", { uri });
    return response.result;
  }

  // ── Prompt Operations ─────────────────────────────────────────────────

  /** List available prompts */
  listPrompts(): MCPPromptDefinition[] {
    return this.prompts;
  }

  /** Get a prompt by name with arguments */
  async getPrompt(
    name: string,
    args?: Record<string, string>
  ): Promise<unknown> {
    const response = await this.sendRequest("prompts/get", {
      name,
      arguments: args,
    });
    return response.result;
  }

  // ── Subscribe to State ────────────────────────────────────────────────

  /** Subscribe to connection state changes */
  onStateChange(listener: (state: MCPConnectionState) => void): () => void {
    return this.transport.onStateChange(listener);
  }

  // ── Internals ─────────────────────────────────────────────────────────

  private async sendRequest(
    method: string,
    params?: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    const request = createRequest(method, params);
    return this.transport.send(request);
  }
}

// ── MCP Registry ────────────────────────────────────────────────────────────
// Manages multiple MCP server connections

class MCPRegistry {
  private clients: Map<string, MCPClient> = new Map();

  /** Register and connect to a new MCP server */
  async register(config: MCPServerConfig): Promise<MCPClient> {
    const existing = this.clients.get(config.id);
    if (existing) {
      existing.disconnect();
    }

    const client = new MCPClient(config);
    await client.connect();
    this.clients.set(config.id, client);
    return client;
  }

  /** Unregister and disconnect an MCP server */
  unregister(id: string): void {
    const client = this.clients.get(id);
    if (client) {
      client.disconnect();
      this.clients.delete(id);
    }
  }

  /** Get a connected MCP client by id */
  getClient(id: string): MCPClient | undefined {
    return this.clients.get(id);
  }

  /** Get all connected clients */
  getAllClients(): MCPClient[] {
    return Array.from(this.clients.values());
  }

  /** Get all available tools across all connected servers */
  getAllTools(): Array<{ serverId: string; tool: MCPToolDefinition }> {
    const result: Array<{ serverId: string; tool: MCPToolDefinition }> = [];
    for (const [serverId, client] of this.clients) {
      for (const tool of client.listTools()) {
        result.push({ serverId, tool });
      }
    }
    return result;
  }

  /** Disconnect all servers */
  disconnectAll(): void {
    for (const client of this.clients.values()) {
      client.disconnect();
    }
    this.clients.clear();
  }
}

/** Singleton MCP registry instance */
export const mcpRegistry = new MCPRegistry();