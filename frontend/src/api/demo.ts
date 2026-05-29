/**
 * Demo mode helpers.
 *
 * When VITE_DEMO_MODE=true, createPlan / createRun / approveRun return
 * realistic fake responses so the full UI flow is demonstrable without
 * a live Swiggy MCP connection.
 *
 * listWorkflows / getWorkflow still hit the real backend (which just reads
 * the JSON files in /workflows/) so the catalog is always live.
 */

import type {
  JsonValue,
  WorkflowDefinition,
  WorkflowPlan,
  WorkflowRun,
  WorkflowRunStep,
  WorkflowRunStepStatus,
} from "./backend";

// ─── Utilities ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function now(): string {
  return new Date().toISOString();
}

let _runSeq = 0;

// ─── Run store (so approveRun can find the run by ID) ───────────────────────

const _runStore = new Map<string, WorkflowRun>();

// ─── Step output fixtures ──────────────────────────────────────────────────

function _stepOutput(kind: string, idx: number, workflowId: string): Record<string, JsonValue> {
  if (kind === "input") return { status: "constraints_normalized" };
  if (kind === "decision") {
    if (workflowId === "swiggy.team-offsite-meal-orchestration")
      return { primary_restaurants: 3, fallback_restaurants: 1, dietary_coverage: "100%" };
    return { top_candidate: "Freshmenu – Grilled Chicken Bowl", confidence_score: 0.94 };
  }
  if (idx === 1) return { restaurants_found: 14, shortlisted: 4, search_query: "grilled chicken bowl" };
  if (idx === 2) return { menus_inspected: 4, matching_meals: 7, best_protein_match: "Grilled Chicken Bowl" };
  if (idx === 4) {
    if (workflowId === "swiggy.team-offsite-meal-orchestration")
      return { cart_id: "cart_demo_002", restaurants: 3, items: 26, total_inr: 8240 };
    return { cart_id: "cart_demo_001", items: 1, total_inr: 349, restaurant: "Freshmenu" };
  }
  return { status: "ok" };
}

// ─── Approval message per workflow ─────────────────────────────────────────

function _approvalMessage(workflow: WorkflowDefinition, payload: Record<string, JsonValue>): string {
  if (workflow.id === "swiggy.healthy-meal") {
    const budget = payload.maxBudget ?? 500;
    const protein = payload.minProteinGrams ?? 40;
    return `Cart ready — Grilled Chicken Bowl from Freshmenu. ₹349 (within ₹${budget} budget). Estimated protein: 44 g (target ${protein} g ✓). Restaurant rating: 4.4 ⭐. Confirm to place the order.`;
  }
  if (workflow.id === "swiggy.team-offsite-meal-orchestration") {
    const headcount = payload.headcount ?? 26;
    const cap = payload.budgetCap ?? 8500;
    return `Team meal plan ready for ${headcount} people across 3 restaurants. Total ₹8,240 (within ₹${cap} cap). Dietary coverage: 8 veg ✓  2 vegan ✓  3 Jain ✓  6 high-protein ✓. Fallback restaurant on standby. Approve to place all orders.`;
  }
  return "Review the planned execution and approve to proceed.";
}

function _reviewData(workflow: WorkflowDefinition, payload: Record<string, JsonValue>): Record<string, JsonValue> {
  if (workflow.id === "swiggy.healthy-meal") {
    return {
      restaurant: "Freshmenu",
      item: "Grilled Chicken Bowl",
      price_inr: 349,
      protein_g: 44,
      rating: 4.4,
      distance_km: 3.2,
    };
  }
  if (workflow.id === "swiggy.team-offsite-meal-orchestration") {
    return {
      restaurants: ["The Bowl Company", "Faasos", "Behrouz Biryani"],
      total_inr: 8240,
      headcount: payload.headcount ?? 26,
      dietary: { vegetarian: "8 ✓", vegan: "2 ✓", jain: "3 ✓", high_protein: "6 ✓" },
      fallback: "The Good Bowl",
    };
  }
  return {};
}

// ─── Plan builder ──────────────────────────────────────────────────────────

export function buildDemoPlan(
  workflow: WorkflowDefinition,
  payload: Record<string, JsonValue>,
): WorkflowPlan {
  const steps = workflow.steps.map((s) => ({
    id: s.id,
    title: s.title,
    kind: s.kind,
    description: s.description,
    status: "ready" as const,
    toolName: s.toolName ?? null,
    domain: workflow.domain,
    stage: s.kind,
    retryClass: s.kind === "tool-call" ? "idempotent-safe" : null,
    requiresApproval: workflow.approvalPoints.some((ap) => ap.stepId === s.id),
    supportsBlindRetry: false,
    statusCheckTool: null,
    notes: [] as string[],
  }));

  const edges = steps.slice(0, -1).map((s, i) => ({
    id: `${s.id}->${steps[i + 1].id}`,
    source: s.id,
    target: steps[i + 1].id,
    label: "next" as const,
  }));

  return {
    workflowId: workflow.id,
    title: workflow.title,
    domain: workflow.domain,
    goal: workflow.goal,
    summary: workflow.summary,
    executable: true,
    providedInputs: payload,
    missingRequiredInputs: [],
    toolSequence: workflow.toolStrategy,
    nextAction: "Plan is ready. Review the execution graph and start the run.",
    approvalRequired: workflow.approvalPoints.length > 0,
    constraints: workflow.constraints,
    approvalPoints: workflow.approvalPoints,
    fallbackRules: workflow.fallbackRules,
    successOutput: workflow.successOutput ?? null,
    steps,
    graph: {
      nodes: steps.map((s) => ({
        id: s.id,
        title: s.title,
        kind: s.kind,
        status: "ready" as const,
        stage: s.stage ?? null,
        toolName: s.toolName ?? null,
        requiresApproval: s.requiresApproval,
      })),
      edges,
    },
  };
}

// ─── Run builder (starts at approval gate) ─────────────────────────────────

export function buildDemoRun(
  workflow: WorkflowDefinition,
  payload: Record<string, JsonValue>,
): WorkflowRun {
  _runSeq++;
  const runId = `demo-run-${String(_runSeq).padStart(4, "0")}`;
  const ts = now();

  // Find where the first approval gate is
  const approvalStepId = workflow.approvalPoints[0]?.stepId ?? workflow.steps.at(-1)!.id;
  const approvalIdx = workflow.steps.findIndex((s) => s.id === approvalStepId);
  const effectiveIdx = approvalIdx === -1 ? workflow.steps.length - 1 : approvalIdx;

  const steps: WorkflowRunStep[] = workflow.steps.map((s, i) => {
    if (i < effectiveIdx) {
      return {
        id: s.id, title: s.title, kind: s.kind,
        status: "completed" as WorkflowRunStepStatus,
        toolName: s.toolName ?? null, stage: s.kind, requiresApproval: false,
        startedAt: ts, completedAt: ts,
        output: _stepOutput(s.kind, i, workflow.id), error: null,
      };
    }
    if (i === effectiveIdx) {
      return {
        id: s.id, title: s.title, kind: s.kind,
        status: "waiting_for_approval" as WorkflowRunStepStatus,
        toolName: s.toolName ?? null, stage: s.kind, requiresApproval: true,
        startedAt: ts, completedAt: null, output: {}, error: null,
      };
    }
    return {
      id: s.id, title: s.title, kind: s.kind,
      status: "pending" as WorkflowRunStepStatus,
      toolName: s.toolName ?? null, stage: s.kind, requiresApproval: false,
      startedAt: null, completedAt: null, output: {}, error: null,
    };
  });

  const run: WorkflowRun = {
    runId,
    workflowId: workflow.id,
    sessionId: "demo-session-001",
    status: "waiting_for_approval",
    domain: workflow.domain,
    title: workflow.title,
    goal: workflow.goal,
    description: `Demo execution of "${workflow.title}"`,
    providedInputs: payload,
    resolvedContext: {},
    currentStepId: approvalStepId,
    pendingApproval: {
      required: true,
      kind: workflow.approvalPoints[0]?.kind ?? "final_confirmation",
      stepId: approvalStepId,
      message: _approvalMessage(workflow, payload),
      reviewData: _reviewData(workflow, payload),
    },
    steps,
    events: [],
    summary: { completedSteps: effectiveIdx, totalSteps: workflow.steps.length },
    createdAt: ts,
    updatedAt: ts,
  };

  _runStore.set(runId, run);
  return run;
}

// ─── Approve / reject ──────────────────────────────────────────────────────

export function resolveDemoApproval(runId: string, approved: boolean): WorkflowRun {
  const run = _runStore.get(runId);
  if (!run) throw new Error(`Demo run "${runId}" not found.`);

  const ts = now();

  if (!approved) {
    const updated: WorkflowRun = {
      ...run,
      status: "cancelled",
      currentStepId: null,
      pendingApproval: null,
      steps: run.steps.map((s) => ({
        ...s,
        status: (s.status === "waiting_for_approval" ? "cancelled" : s.status) as WorkflowRunStepStatus,
        completedAt: s.completedAt ?? ts,
      })),
      updatedAt: ts,
    };
    _runStore.set(runId, updated);
    return updated;
  }

  const updated: WorkflowRun = {
    ...run,
    status: "completed",
    currentStepId: null,
    pendingApproval: null,
    steps: run.steps.map((s, i) => ({
      ...s,
      status: "completed" as WorkflowRunStepStatus,
      startedAt: s.startedAt ?? ts,
      completedAt: ts,
      output: Object.keys(s.output).length > 0
        ? s.output
        : _stepOutput(s.kind, i, run.workflowId),
    })),
    summary: { completedSteps: run.steps.length, totalSteps: run.steps.length },
    updatedAt: ts,
  };
  _runStore.set(runId, updated);
  return updated;
}

// ─── Async wrappers with realistic delays ──────────────────────────────────

export const demoDelay = {
  plan: 900,
  run: 1300,
  approve: 550,
  draft: 1800,
} as const;

export async function demoPlan(
  getWorkflow: (id: string) => Promise<WorkflowDefinition>,
  workflowId: string,
  payload: Record<string, JsonValue>,
): Promise<WorkflowPlan> {
  const [workflow] = await Promise.all([
    getWorkflow(workflowId),
    sleep(demoDelay.plan),
  ]);
  return buildDemoPlan(workflow, payload);
}

export async function demoRun(
  getWorkflow: (id: string) => Promise<WorkflowDefinition>,
  workflowId: string,
  payload: Record<string, JsonValue>,
): Promise<WorkflowRun> {
  const [workflow] = await Promise.all([
    getWorkflow(workflowId),
    sleep(demoDelay.run),
  ]);
  return buildDemoRun(workflow, payload);
}

export async function demoApprove(runId: string, approved: boolean): Promise<WorkflowRun> {
  await sleep(demoDelay.approve);
  return resolveDemoApproval(runId, approved);
}
