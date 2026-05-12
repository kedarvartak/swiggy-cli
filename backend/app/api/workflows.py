from __future__ import annotations

from fastapi import APIRouter, Query
from app.domain.workflows.catalog_service import (
    get_workflow_definition,
    list_workflow_definitions,
    validate_workflow_definition,
    write_workflow_definition,
)
from app.domain.workflows.models import WorkflowDefinition, WorkflowPlan, WorkflowPlanRequest
from app.domain.workflows.planner_service import create_workflow_plan


router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("", response_model=list[WorkflowDefinition])
def list_workflows() -> list[WorkflowDefinition]:
    return list_workflow_definitions()


@router.get("/{workflow_id}", response_model=WorkflowDefinition)
def get_workflow(workflow_id: str) -> WorkflowDefinition:
    return get_workflow_definition(workflow_id)


@router.post("/{workflow_id}/plan", response_model=WorkflowPlan)
def plan_workflow(workflow_id: str, request: WorkflowPlanRequest) -> WorkflowPlan:
    definition = get_workflow_definition(workflow_id)
    return create_workflow_plan(definition, request.payload)


@router.post("", response_model=dict[str, str])
def create_workflow(definition: WorkflowDefinition, force: bool = Query(default=False)) -> dict[str, str]:
    validated = validate_workflow_definition(definition.model_dump(mode="json"))
    file_path = write_workflow_definition(validated, force=force)
    return {"workflowId": validated.id, "path": str(file_path)}
