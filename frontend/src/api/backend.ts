export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type WorkflowDomain = "food" | "instamart" | "dineout" | "multi-domain";
export type WorkflowStepKind = "input" | "decision" | "tool-call" | "approval" | "output";
export type WorkflowRunStatus =
  | "created"
  | "running"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "cancelled";
export type WorkflowRunStepStatus =
  | "pending"
  | "running"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type WorkflowInputField = {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  example?: JsonValue;
};

export type WorkflowConstraint = {
  id: string;
  title: string;
  description: string;
  type: string;
};

export type WorkflowApprovalPoint = {
  stepId: string;
  title: string;
  description: string;
  kind: string;
};

export type WorkflowDefinition = {
  id: string;
  title: string;
  version: string;
  app: string;
  domain: WorkflowDomain;
  goal: string;
  summary: string;
  difficulty: "simple" | "advanced" | "complex";
  tags: string[];
  inputs: WorkflowInputField[];
  constraints: WorkflowConstraint[];
  approvalPoints: WorkflowApprovalPoint[];
  tools: string[];
  steps: {
    id: string;
    title: string;
    kind: WorkflowStepKind;
    description: string;
    toolName?: string | null;
    argumentHints?: string[] | null;
    produces?: string[] | null;
  }[];
  guarantees: string[];
  limitations: string[];
  fallbackRules: string[];
  toolStrategy: string[];
  successOutput?: { type: string; description: string } | null;
};

export type WorkflowPlanStep = {
  id: string;
  title: string;
  kind: WorkflowStepKind;
  description: string;
  status: "ready" | "blocked";
  toolName?: string | null;
  domain?: string | null;
  stage?: string | null;
  retryClass?: string | null;
  requiresApproval: boolean;
  supportsBlindRetry: boolean;
  statusCheckTool?: string | null;
  notes: string[];
};

export type WorkflowPlan = {
  workflowId: string;
  title: string;
  domain: WorkflowDomain;
  goal: string;
  summary: string;
  executable: boolean;
  providedInputs: Record<string, JsonValue>;
  missingRequiredInputs: string[];
  toolSequence: string[];
  nextAction: string;
  approvalRequired: boolean;
  constraints: WorkflowConstraint[];
  approvalPoints: WorkflowApprovalPoint[];
  fallbackRules: string[];
  successOutput?: { type: string; description: string } | null;
  steps: WorkflowPlanStep[];
  graph: {
    nodes: {
      id: string;
      title: string;
      kind: WorkflowStepKind;
      status: "ready" | "blocked";
      stage?: string | null;
      toolName?: string | null;
      requiresApproval: boolean;
    }[];
    edges: { id: string; source: string; target: string; label?: string | null }[];
  };
};

export type WorkflowRunStep = {
  id: string;
  title: string;
  kind: WorkflowStepKind;
  status: WorkflowRunStepStatus;
  toolName?: string | null;
  stage?: string | null;
  requiresApproval: boolean;
  startedAt?: string | null;
  completedAt?: string | null;
  output: Record<string, JsonValue>;
  error?: string | null;
};

export type WorkflowRun = {
  runId: string;
  workflowId: string;
  sessionId?: string | null;
  status: WorkflowRunStatus;
  domain: WorkflowDomain;
  title: string;
  goal: string;
  description: string;
  providedInputs: Record<string, JsonValue>;
  resolvedContext: Record<string, JsonValue>;
  currentStepId?: string | null;
  pendingApproval?: {
    required: boolean;
    kind: string;
    stepId: string;
    message: string;
    reviewData: Record<string, JsonValue>;
  } | null;
  steps: WorkflowRunStep[];
  events: {
    id: string;
    type: string;
    stepId?: string | null;
    toolName?: string | null;
    timestamp: string;
    payload: Record<string, JsonValue>;
    message?: string | null;
  }[];
  summary: { completedSteps: number; totalSteps: number };
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

function backendBaseUrl() {
  return (import.meta.env.VITE_SWIGGY_BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/$/, "");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${backendBaseUrl()}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as {
        error?: { message?: string };
        detail?: string;
      };
      message = body.error?.message || body.detail || message;
    } catch {
      // Keep the HTTP status text.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const backendApi = {
  listWorkflows() {
    return request<WorkflowDefinition[]>("/api/workflows");
  },
  getWorkflow(workflowId: string) {
    return request<WorkflowDefinition>(`/api/workflows/${encodeURIComponent(workflowId)}`);
  },
  draftWorkflow(description: string, domain?: WorkflowDomain) {
    return request<WorkflowDefinition>("/api/workflows/draft", {
      method: "POST",
      body: JSON.stringify({ description, domain }),
    });
  },
  saveWorkflow(definition: WorkflowDefinition, force = false) {
    return request<{ workflowId: string; path: string }>(`/api/workflows?force=${force}`, {
      method: "POST",
      body: JSON.stringify(definition),
    });
  },
  createPlan(workflowId: string, payload: Record<string, JsonValue>) {
    return request<WorkflowPlan>(`/api/workflows/${encodeURIComponent(workflowId)}/plan`, {
      method: "POST",
      body: JSON.stringify({ payload }),
    });
  },
  createRun(workflowId: string, payload: Record<string, JsonValue>, autoStart = true) {
    return request<WorkflowRun>("/api/runs", {
      method: "POST",
      body: JSON.stringify({ workflowId, payload, autoStart }),
    });
  },
  approveRun(runId: string, approved: boolean) {
    return request<WorkflowRun>(`/api/runs/${encodeURIComponent(runId)}/approve`, {
      method: "POST",
      body: JSON.stringify({ approved }),
    });
  },
  advanceRun(runId: string) {
    return request<WorkflowRun>(`/api/runs/${encodeURIComponent(runId)}/advance`, {
      method: "POST",
    });
  },
  cancelRun(runId: string) {
    return request<WorkflowRun>(`/api/runs/${encodeURIComponent(runId)}/cancel`, {
      method: "POST",
    });
  },
};
