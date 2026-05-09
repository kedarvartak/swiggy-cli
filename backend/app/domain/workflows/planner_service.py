from __future__ import annotations

from typing import Any

from app.core.errors import WorkflowValidationError

from .models import (
    WorkflowDefinition,
    WorkflowInputField,
    WorkflowPlan,
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


def create_workflow_plan(definition: WorkflowDefinition, payload: dict[str, Any]) -> WorkflowPlan:
    provided_inputs, missing_required_inputs = _collect_workflow_inputs(definition, payload)
    executable = len(missing_required_inputs) == 0

    steps = [
        WorkflowPlanStep(
            id=step.id,
            title=step.title,
            kind=step.kind,
            description=step.description,
            status="ready" if executable else "blocked",
            toolName=step.toolName,
            argumentHints=step.argumentHints,
        )
        for step in definition.steps
    ]

    return WorkflowPlan(
        workflowId=definition.id,
        title=definition.title,
        summary=definition.summary,
        executable=executable,
        providedInputs=provided_inputs,
        missingRequiredInputs=missing_required_inputs,
        toolSequence=[
            step.toolName
            for step in definition.steps
            if step.kind == "tool-call" and step.toolName is not None
        ],
        nextAction=(
            "Workflow definition is sufficiently populated for execution planning."
            if executable
            else f"Provide the missing required inputs: {', '.join(missing_required_inputs)}."
        ),
        steps=steps,
    )
