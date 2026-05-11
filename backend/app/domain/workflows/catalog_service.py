from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.core.config import get_workflow_directory
from app.core.errors import (
    WorkflowDefinitionExistsError,
    WorkflowNotFoundError,
    WorkflowValidationError,
)
from app.domain.mcp.tool_registry import get_tool_policy

from .models import WorkflowDefinition


def validate_workflow_definition(payload: dict[str, Any]) -> WorkflowDefinition:
    try:
        definition = WorkflowDefinition.model_validate(payload)
    except Exception as error:
        raise WorkflowValidationError(str(error)) from error

    unknown_tools = [tool_name for tool_name in definition.tools if get_tool_policy(tool_name) is None]
    if unknown_tools:
        raise WorkflowValidationError(
            f"Workflow `{definition.id}` references unknown tools: {', '.join(unknown_tools)}."
        )

    unknown_step_tools = [
        step.toolName
        for step in definition.steps
        if step.toolName is not None and get_tool_policy(step.toolName) is None
    ]
    if unknown_step_tools:
        raise WorkflowValidationError(
            f"Workflow `{definition.id}` contains steps with unknown tools: {', '.join(unknown_step_tools)}."
        )

    return definition


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
    raise WorkflowNotFoundError(f"Unknown workflow: {workflow_id}")


def write_workflow_definition(definition: WorkflowDefinition, force: bool = False) -> Path:
    workflow_directory = get_workflow_directory()
    workflow_directory.mkdir(parents=True, exist_ok=True)
    file_path = workflow_directory / _workflow_file_name(definition.id)
    if file_path.exists() and not force:
        raise WorkflowDefinitionExistsError(f"Workflow already exists: {file_path}")

    file_path.write_text(
        json.dumps(definition.model_dump(mode="json"), indent=2) + "\n",
        encoding="utf-8",
    )
    return file_path
