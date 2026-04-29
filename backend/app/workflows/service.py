from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from .models import (
    WorkflowDefinition,
    WorkflowInputField,
    WorkflowPlan,
    WorkflowPlanStep,
)


def get_workflow_directory() -> Path:
    configured = os.environ.get("SWIGGY_WORKFLOW_DIR", "").strip()
    if configured:
        return Path(configured).expanduser().resolve()
    return Path(__file__).resolve().parents[3] / "workflows"


def validate_workflow_definition(payload: dict[str, Any]) -> WorkflowDefinition:
    return WorkflowDefinition.model_validate(payload)


def _workflow_file_name(workflow_id: str) -> str:
    safe_id = "".join(ch if ch.isalnum() or ch in "._-" else "-" for ch in workflow_id)
    return f"{safe_id}.json"


def list_workflow_definitions() -> list[WorkflowDefinition]:
    workflow_directory = get_workflow_directory()
    if not workflow_directory.exists():
        return []

    definitions: list[WorkflowDefinition] = []
    for file_path in sorted(workflow_directory.glob("*.json")):
        definitions.append(
            WorkflowDefinition.model_validate(json.loads(file_path.read_text(encoding="utf-8")))
        )
    return definitions


def get_workflow_definition(workflow_id: str) -> WorkflowDefinition:
    for definition in list_workflow_definitions():
        if definition.id == workflow_id:
            return definition
    raise ValueError(f"Unknown workflow: {workflow_id}")


def write_workflow_definition(definition: WorkflowDefinition, force: bool = False) -> Path:
    workflow_directory = get_workflow_directory()
    workflow_directory.mkdir(parents=True, exist_ok=True)
    file_path = workflow_directory / _workflow_file_name(definition.id)
    if file_path.exists() and not force:
        raise FileExistsError(f"Workflow already exists: {file_path}")

    file_path.write_text(
        json.dumps(definition.model_dump(mode="json"), indent=2) + "\n",
        encoding="utf-8",
    )
    return file_path


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
            raise ValueError(f"Workflow input `{field.name}` must be of type {field.type}.")

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
