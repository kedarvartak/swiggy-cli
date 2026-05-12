from __future__ import annotations

from fastapi import APIRouter
from app.domain.workflows.models import WorkflowApprovalRequest, WorkflowRun, WorkflowRunRequest
from app.domain.workflows.run_service import (
    advance_workflow_run,
    approve_workflow_run,
    cancel_workflow_run,
    create_workflow_run,
    get_workflow_run,
)


router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("", response_model=WorkflowRun)
def create_run(request: WorkflowRunRequest) -> WorkflowRun:
    return create_workflow_run(request)


@router.get("/{run_id}", response_model=WorkflowRun)
def get_run(run_id: str) -> WorkflowRun:
    return get_workflow_run(run_id)


@router.post("/{run_id}/advance", response_model=WorkflowRun)
def advance_run(run_id: str) -> WorkflowRun:
    return advance_workflow_run(run_id)


@router.post("/{run_id}/approve", response_model=WorkflowRun)
def approve_run(run_id: str, request: WorkflowApprovalRequest) -> WorkflowRun:
    return approve_workflow_run(run_id, request)


@router.post("/{run_id}/cancel", response_model=WorkflowRun)
def cancel_run(run_id: str) -> WorkflowRun:
    return cancel_workflow_run(run_id)
