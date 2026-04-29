from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


JsonValue = Any
WorkflowInputType = Literal["string", "number", "boolean", "array", "object"]
WorkflowStepKind = Literal["input", "decision", "tool-call", "approval", "output"]
WorkflowDifficulty = Literal["simple", "advanced", "complex"]
WorkflowPlanStatus = Literal["ready", "blocked"]


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


class WorkflowDefinition(BaseModel):
    id: str
    title: str
    version: str
    app: str
    summary: str
    difficulty: WorkflowDifficulty
    tags: list[str]
    inputs: list[WorkflowInputField]
    tools: list[str]
    steps: list[WorkflowStepDefinition]
    guarantees: list[str]
    limitations: list[str]


class WorkflowPlanStep(BaseModel):
    id: str
    title: str
    kind: WorkflowStepKind
    description: str
    status: WorkflowPlanStatus
    toolName: str | None = None
    argumentHints: list[str] | None = None


class WorkflowPlan(BaseModel):
    workflowId: str
    title: str
    summary: str
    executable: bool
    providedInputs: dict[str, JsonValue]
    missingRequiredInputs: list[str]
    toolSequence: list[str]
    nextAction: str
    steps: list[WorkflowPlanStep]


class WorkflowPlanRequest(BaseModel):
    payload: dict[str, JsonValue] = Field(default_factory=dict)
