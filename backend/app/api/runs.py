from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.errors import (
    WorkflowExecutionError,
    WorkflowNotFoundError,
    WorkflowRunNotFoundError,
    WorkflowRunStateError,
    WorkflowValidationError,
)
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
    try:
        return create_workflow_run(request)
    except WorkflowNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except WorkflowValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except WorkflowExecutionError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@router.get("/{run_id}", response_model=WorkflowRun)
def get_run(run_id: str) -> WorkflowRun:
    try:
        return get_workflow_run(run_id)
    except WorkflowRunNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/{run_id}/advance", response_model=WorkflowRun)
def advance_run(run_id: str) -> WorkflowRun:
    try:
        return advance_workflow_run(run_id)
    except WorkflowRunNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except WorkflowRunStateError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except WorkflowExecutionError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@router.post("/{run_id}/approve", response_model=WorkflowRun)
def approve_run(run_id: str, request: WorkflowApprovalRequest) -> WorkflowRun:
    try:
        return approve_workflow_run(run_id, request)
    except WorkflowRunNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except WorkflowRunStateError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except WorkflowExecutionError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@router.post("/{run_id}/cancel", response_model=WorkflowRun)
def cancel_run(run_id: str) -> WorkflowRun:
    try:
        return cancel_workflow_run(run_id)
    except WorkflowRunNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except WorkflowRunStateError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
