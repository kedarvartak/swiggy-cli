import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import type { McpConfig } from "./config.js";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonValue,
  ToolCallResult,
  ToolDescriptor,
} from "./types.js";

interface InitializeResult {
  serverInfo?: JsonValue;
  capabilities?: JsonValue;
  instructions?: JsonValue;
}

/**
 * Minimal JSON-RPC client for talking to a Swiggy MCP server over stdio.
 */
export class McpClient {
  private readonly child: ChildProcessWithoutNullStreams;

  private readonly pending = new Map<
    number,
    {
      resolve: (value: JsonValue) => void;
      reject: (error: Error) => void;
    }
  >();

  private nextId = 1;

  private initializePromise: Promise<InitializeResult> | null = null;

  /**
   * Starts the MCP server process and wires stdout and stderr listeners.
   */
  constructor(private readonly config: McpConfig) {
    this.child = spawn(config.command, config.args, {
      env: config.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const reader = createInterface({ input: this.child.stdout });
    reader.on("line", (line) => this.handleLine(line));

    this.child.stderr.on("data", (chunk) => {
      const message = chunk.toString().trim();
      if (message) {
        process.stderr.write(`[mcp] ${message}\n`);
      }
    });

    this.child.on("exit", (code, signal) => {
      const error = new Error(
        `MCP server stopped unexpectedly (code=${code ?? "null"}, signal=${signal ?? "null"}).`,
      );
      this.rejectAll(error);
    });
  }

  /**
   * Performs the MCP initialize handshake once per client instance.
   */
  async initialize(): Promise<InitializeResult> {
    if (!this.initializePromise) {
      this.initializePromise = (async () => {
        const result = await this.request("initialize", {
          protocolVersion: "2024-11-05",
          clientInfo: {
            name: "swiggy-cli",
            version: "0.1.0",
          },
          capabilities: {},
        });

        await this.notify("notifications/initialized", {});
        return (result as InitializeResult) ?? {};
      })();
    }

    return this.initializePromise;
  }

  /**
   * Fetches the tools exposed by the connected MCP server.
   */
  async listTools(): Promise<ToolDescriptor[]> {
    const result = await this.request("tools/list", {});
    const tools = (result as { tools?: ToolDescriptor[] }).tools ?? [];
    return tools;
  }

  /**
   * Calls a named MCP tool with a JSON object payload.
   */
  async callTool(name: string, args: Record<string, JsonValue>): Promise<ToolCallResult> {
    const result = await this.request("tools/call", {
      name,
      arguments: args,
    });

    return (result as ToolCallResult) ?? {};
  }

  /**
   * Stops the underlying MCP server process.
   */
  async close(): Promise<void> {
    if (!this.child.killed) {
      this.child.kill();
    }
  }

  /**
   * Sends a JSON-RPC request and tracks the pending promise until the response arrives.
   */
  private async request(method: string, params: Record<string, JsonValue>): Promise<JsonValue> {
    const id = this.nextId;
    this.nextId += 1;

    const payload: JsonRpcRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    const response = new Promise<JsonValue>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });

    this.child.stdin.write(`${JSON.stringify(payload)}\n`);
    return response;
  }

  /**
   * Sends a fire-and-forget JSON-RPC notification.
   */
  private async notify(method: string, params: Record<string, JsonValue>): Promise<void> {
    const payload = {
      jsonrpc: "2.0",
      method,
      params,
    };
    this.child.stdin.write(`${JSON.stringify(payload)}\n`);
  }

  /**
   * Processes a single line emitted by the MCP server.
   */
  private handleLine(line: string): void {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    let message: JsonRpcResponse;
    try {
      message = JSON.parse(trimmed) as JsonRpcResponse;
    } catch (error) {
      this.rejectAll(new Error(`Failed to parse MCP response: ${trimmed}`));
      return;
    }

    if (!("id" in message) || message.id === null) {
      return;
    }

    const pending = this.pending.get(message.id);
    if (!pending) {
      return;
    }

    this.pending.delete(message.id);

    if ("error" in message) {
      pending.reject(new Error(`${message.error.message} (${message.error.code})`));
      return;
    }

    pending.resolve(message.result);
  }

  /**
   * Rejects all in-flight requests when the MCP process exits or becomes unusable.
   */
  private rejectAll(error: Error): void {
    for (const [, pending] of this.pending) {
      pending.reject(error);
    }
    this.pending.clear();
  }
}
