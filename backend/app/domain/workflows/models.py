from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


JsonValue = Any
WorkflowInputType = Literal["string", "number", "boolean", "array", "object"]
WorkflowStepKind = Literal["input", "decision", "tool-call", "approval", "output"]
WorkflowDifficulty = Literal["simple", "advanced", "complex"]
WorkflowPlanStatus = Literal["ready", "blocked"]
WorkflowDomain = Literal["food", "instamart", "dineout", "multi-domain"]
WorkflowRunStatus = Literal[
    "created",
    "running",
    "waiting_for_approval",
    "completed",
    "failed",
    "cancelled",
]
WorkflowRunStepStatus = Literal[
    "pending",
    "running",
    "waiting_for_approval",
    "completed",
    "failed",
    "cancelled",
]
WorkflowRunEventType = Literal[
    "run_created",
    "run_started",
    "run_resumed",
    "step_started",
    "step_completed",
    "tool_call_started",
    "tool_call_completed",
    "approval_required",
    "approval_granted",
    "run_completed",
    "run_failed",
    "run_cancelled",
]
WorkflowConstraintType = Literal[
    "budget",
    "location",
    "dietary",
    "timing",
    "approval",
    "preference",
    "custom",
]
WorkflowApprovalKind = Literal["before_mutation", "before_placement", "final_confirmation", "custom"]


class WorkflowInputField(BaseModel):
    name: str
    type: WorkflowInputType
    description: str
    required: bool
    example: JsonValue | None = None


class WorkflowStepDefinition(BaseModel):
    id: str
    title: str
    kind: WorkflowStepKind
    description: str
    toolName: str | None = None
    argumentHints: list[str] | None = None
    produces: list[str] | None = None


class WorkflowConstraint(BaseModel):
    id: str
    title: str
    description: str
    type: WorkflowConstraintType = "custom"


class WorkflowApprovalPoint(BaseModel):
    stepId: str
    title: str
    description: str
    kind: WorkflowApprovalKind = "custom"


class WorkflowSuccessOutput(BaseModel):
    type: str
    description: str


class WorkflowDefinition(BaseModel):
    id: str
    title: str
    version: str
    app: str
    domain: WorkflowDomain = "food"
    goal: str = ""
    summary: str
    difficulty: WorkflowDifficulty
    tags: list[str]
    inputs: list[WorkflowInputField]
    constraints: list[WorkflowConstraint] = Field(default_factory=list)
    approvalPoints: list[WorkflowApprovalPoint] = Field(default_factory=list)
    tools: list[str]
    steps: list[WorkflowStepDefinition]
    guarantees: list[str]
    limitations: list[str]
    fallbackRules: list[str] = Field(default_factory=list)
    toolStrategy: list[str] = Field(default_factory=list)
    successOutput: WorkflowSuccessOutput | None = None


class WorkflowPlanStep(BaseModel):
    id: str
    title: str
    kind: WorkflowStepKind
    description: str
    status: WorkflowPlanStatus
    toolName: str | None = None
    argumentHints: list[str] | None = None
    produces: list[str] | None = None
    domain: str | None = None
    stage: str | None = None
    retryClass: str | None = None
    requiresApproval: bool = False
    supportsBlindRetry: bool = False
    statusCheckTool: str | None = None
    notes: list[str] = Field(default_factory=list)


class WorkflowPlanNode(BaseModel):
    id: str
    title: str
    kind: WorkflowStepKind
    status: WorkflowPlanStatus
    stage: str | None = None
    toolName: str | None = None
    requiresApproval: bool = False


class WorkflowPlanEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str | None = None


class WorkflowPlanGraph(BaseModel):
    nodes: list[WorkflowPlanNode]
    edges: list[WorkflowPlanEdge]


class WorkflowPlan(BaseModel):
    workflowId: str
    title: str
    domain: WorkflowDomain
    goal: str
    summary: str
    executable: bool
    providedInputs: dict[str, JsonValue]
    missingRequiredInputs: list[str]
    toolSequence: list[str]
    nextAction: str
    approvalRequired: bool = False
    constraints: list[WorkflowConstraint] = Field(default_factory=list)
    approvalPoints: list[WorkflowApprovalPoint] = Field(default_factory=list)
    fallbackRules: list[str] = Field(default_factory=list)
    successOutput: WorkflowSuccessOutput | None = None
    steps: list[WorkflowPlanStep]
    graph: WorkflowPlanGraph


class WorkflowPlanRequest(BaseModel):
    payload: dict[str, JsonValue] = Field(default_factory=dict)


class WorkflowDraftRequest(BaseModel):
    description: str
    domain: WorkflowDomain | None = None


class WorkflowRunSummary(BaseModel):
    completedSteps: int = 0
    totalSteps: int = 0


class WorkflowRunEvent(BaseModel):
    id: str
    type: WorkflowRunEventType
    stepId: str | None = None
    toolName: str | None = None
    timestamp: str
    payload: dict[str, JsonValue] = Field(default_factory=dict)
    message: str | None = None


class WorkflowRunStep(BaseModel):
    id: str
    title: str
    kind: WorkflowStepKind
    status: WorkflowRunStepStatus
    toolName: str | None = None
    stage: str | None = None
    requiresApproval: bool = False
    startedAt: str | None = None
    completedAt: str | None = None
    output: dict[str, JsonValue] = Field(default_factory=dict)
    error: str | None = None


class WorkflowPendingApproval(BaseModel):
    required: bool = False
    kind: WorkflowApprovalKind = "custom"
    stepId: str
    message: str
    reviewData: dict[str, JsonValue] = Field(default_factory=dict)


class WorkflowRun(BaseModel):
    runId: str
    workflowId: str
    sessionId: str | None = None
    status: WorkflowRunStatus
    domain: WorkflowDomain
    title: str
    goal: str
    description: str
    providedInputs: dict[str, JsonValue] = Field(default_factory=dict)
    resolvedContext: dict[str, JsonValue] = Field(default_factory=dict)
    currentStepId: str | None = None
    pendingApproval: WorkflowPendingApproval | None = None
    steps: list[WorkflowRunStep] = Field(default_factory=list)
    events: list[WorkflowRunEvent] = Field(default_factory=list)
    summary: WorkflowRunSummary
    createdAt: str
    updatedAt: str


class WorkflowRunRequest(BaseModel):
    workflowId: str
    sessionId: str | None = None
    payload: dict[str, JsonValue] = Field(default_factory=dict)
    autoStart: bool = True


class WorkflowApprovalRequest(BaseModel):
    approved: bool = True
    note: str | None = None
