from __future__ import annotations

from typing import Any

from app.core.errors import WorkflowValidationError
from app.domain.mcp.tool_registry import get_tool_policy

from .models import (
    WorkflowApprovalPoint,
    WorkflowConstraint,
    WorkflowDefinition,
    WorkflowInputField,
    WorkflowPlan,
    WorkflowPlanEdge,
    WorkflowPlanGraph,
    WorkflowPlanNode,
    WorkflowPlanStep,
)


def _is_compatible_value(field: WorkflowInputField, value: Any) -> bool:
    if field.type == "array":
        return isinstance(value, list)
    if field.type == "object":
        return isinstance(value, dict)
    if field.type == "string":
        return isinstance(value, str)
    if field.type == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if field.type == "boolean":
        return isinstance(value, bool)
    return False


def _collect_workflow_inputs(
    definition: WorkflowDefinition, payload: dict[str, Any]
) -> tuple[dict[str, Any], list[str]]:
    provided_inputs: dict[str, Any] = {}
    missing_required_inputs: list[str] = []

    for field in definition.inputs:
        value = payload.get(field.name)
        if value is None and field.name not in payload:
            if field.required:
                missing_required_inputs.append(field.name)
            continue

        if not _is_compatible_value(field, value):
            raise WorkflowValidationError(
                f"Workflow input `{field.name}` must be of type {field.type}."
            )

        provided_inputs[field.name] = value

    return provided_inputs, missing_required_inputs


def _is_step_ready(executable: bool, step_kind: str) -> bool:
    if executable:
        return True
    return step_kind == "input"


def _build_plan_step(step, executable: bool) -> WorkflowPlanStep:
    policy = get_tool_policy(step.toolName) if step.toolName else None
    requires_approval = step.kind == "approval" or bool(policy and policy.requiresApproval)

    return WorkflowPlanStep(
        id=step.id,
        title=step.title,
        kind=step.kind,
        description=step.description,
        status="ready" if _is_step_ready(executable, step.kind) else "blocked",
        toolName=step.toolName,
        argumentHints=step.argumentHints,
        produces=step.produces,
        domain=policy.domain if policy else None,
        stage=policy.stage if policy else None,
        retryClass=policy.retryClass if policy else None,
        requiresApproval=requires_approval,
        supportsBlindRetry=policy.supportsBlindRetry if policy else False,
        statusCheckTool=policy.statusCheckTool if policy else None,
        notes=list(policy.notes) if policy else [],
    )


def _build_plan_graph(steps: list[WorkflowPlanStep]) -> WorkflowPlanGraph:
    nodes = [
        WorkflowPlanNode(
            id=step.id,
            title=step.title,
            kind=step.kind,
            status=step.status,
            stage=step.stage,
            toolName=step.toolName,
            requiresApproval=step.requiresApproval,
        )
        for step in steps
    ]

    edges = [
        WorkflowPlanEdge(
            id=f"{current.id}->{next_step.id}",
            source=current.id,
            target=next_step.id,
            label="next",
        )
        for current, next_step in zip(steps, steps[1:], strict=False)
    ]

    return WorkflowPlanGraph(nodes=nodes, edges=edges)


def _resolve_approval_points(
    definition: WorkflowDefinition, steps: list[WorkflowPlanStep]
) -> list[WorkflowApprovalPoint]:
    if definition.approvalPoints:
        return definition.approvalPoints

    return [
        WorkflowApprovalPoint(
            stepId=step.id,
            title=step.title,
            description=step.description,
            kind="final_confirmation" if step.kind == "approval" else "before_placement",
        )
        for step in steps
        if step.requiresApproval
    ]


def _resolve_constraints(definition: WorkflowDefinition) -> list[WorkflowConstraint]:
    return definition.constraints


def _resolve_tool_sequence(definition: WorkflowDefinition) -> list[str]:
    if definition.toolStrategy:
        return list(definition.toolStrategy)

    return [
        step.toolName
        for step in definition.steps
        if step.kind == "tool-call" and step.toolName is not None
    ]


def create_workflow_plan(definition: WorkflowDefinition, payload: dict[str, Any]) -> WorkflowPlan:
    provided_inputs, missing_required_inputs = _collect_workflow_inputs(definition, payload)
    executable = len(missing_required_inputs) == 0

    steps = [_build_plan_step(step, executable) for step in definition.steps]
    tool_sequence = _resolve_tool_sequence(definition)
    approval_points = _resolve_approval_points(definition, steps)
    approval_required = len(approval_points) > 0
    graph = _build_plan_graph(steps)

    return WorkflowPlan(
        workflowId=definition.id,
        title=definition.title,
        domain=definition.domain,
        goal=definition.goal,
        summary=definition.summary,
        executable=executable,
        providedInputs=provided_inputs,
        missingRequiredInputs=missing_required_inputs,
        toolSequence=tool_sequence,
        nextAction=(
            "Workflow definition is sufficiently populated for execution planning and run creation."
            if executable
            else f"Provide the missing required inputs: {', '.join(missing_required_inputs)}."
        ),
        approvalRequired=approval_required,
        constraints=_resolve_constraints(definition),
        approvalPoints=approval_points,
        fallbackRules=definition.fallbackRules,
        successOutput=definition.successOutput,
        steps=steps,
        graph=graph,
    )
