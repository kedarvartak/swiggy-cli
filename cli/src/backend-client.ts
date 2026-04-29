import type { BackendConfig } from "./config.js";
import type { JsonValue, ToolCallResult, ToolDescriptor } from "./types.js";
import type { WorkflowDefinition, WorkflowPlan } from "./workflows/types.js";

interface InitializeResult {
  serverInfo?: JsonValue;
  capabilities?: JsonValue;
  instructions?: JsonValue;
}

async function request<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) {
        detail = body.detail;
      }
    } catch {
      // Ignore non-JSON error bodies.
    }
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export class BackendClient {
  constructor(private readonly config: BackendConfig) {}

  async initialize(): Promise<{ status: string }> {
    return request<{ status: string }>(this.config.baseUrl, "/health");
  }

  async status(): Promise<InitializeResult> {
    return request<InitializeResult>(this.config.baseUrl, "/api/mcp/status");
  }

  async listTools(): Promise<ToolDescriptor[]> {
    return request<ToolDescriptor[]>(this.config.baseUrl, "/api/mcp/tools");
  }

  async callTool(name: string, args: Record<string, JsonValue>): Promise<ToolCallResult> {
    return request<ToolCallResult>(this.config.baseUrl, "/api/mcp/tools/call", {
      method: "POST",
      body: JSON.stringify({ name, arguments: args }),
    });
  }

  async listWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
    return request<WorkflowDefinition[]>(this.config.baseUrl, "/api/workflows");
  }

  async getWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition> {
    return request<WorkflowDefinition>(this.config.baseUrl, `/api/workflows/${workflowId}`);
  }

  async createWorkflowPlan(
    workflowId: string,
    payload: Record<string, JsonValue>,
  ): Promise<WorkflowPlan> {
    return request<WorkflowPlan>(this.config.baseUrl, `/api/workflows/${workflowId}/plan`, {
      method: "POST",
      body: JSON.stringify({ payload }),
    });
  }

  async writeWorkflowDefinition(
    definition: WorkflowDefinition,
    options?: { force?: boolean },
  ): Promise<{ workflowId: string; path: string }> {
    const force = options?.force ? "true" : "false";
    return request<{ workflowId: string; path: string }>(
      this.config.baseUrl,
      `/api/workflows?force=${force}`,
      {
        method: "POST",
        body: JSON.stringify(definition),
      },
    );
  }
}
