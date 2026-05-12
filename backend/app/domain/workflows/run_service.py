from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from app.core.config import get_run_storage_directory
from app.core.telemetry import log_event, metrics
from app.domain.auth.service import resolve_auth_session_id
from app.core.errors import (
    WorkflowExecutionError,
    WorkflowRunNotFoundError,
    WorkflowRunStateError,
    WorkflowValidationError,
)
from app.domain.mcp.retry_policy import requires_status_check_before_retry
from app.domain.mcp.service import call_mcp_tool
from app.domain.mcp.tool_registry import get_tool_policy

from .catalog_service import get_workflow_definition
from .models import (
    JsonValue,
    WorkflowApprovalPoint,
    WorkflowApprovalRequest,
    WorkflowPendingApproval,
    WorkflowPlan,
    WorkflowPlanStep,
    WorkflowRun,
    WorkflowRunEvent,
    WorkflowRunRequest,
    WorkflowRunStep,
    WorkflowRunSummary,
)
from .planner_service import create_workflow_plan


def create_workflow_run(request: WorkflowRunRequest) -> WorkflowRun:
    definition = get_workflow_definition(request.workflowId)
    plan = create_workflow_plan(definition, request.payload)
    if not plan.executable:
        missing = ", ".join(plan.missingRequiredInputs)
        raise WorkflowValidationError(f"Workflow run cannot start without required inputs: {missing}.")

    timestamp = _utc_now()
    run = WorkflowRun(
        runId=f"run_{uuid4().hex[:12]}",
        workflowId=definition.id,
        sessionId=resolve_auth_session_id(request.sessionId),
        status="created",
        domain=definition.domain,
        title=definition.title,
        goal=definition.goal,
        description=definition.summary,
        providedInputs=plan.providedInputs,
        resolvedContext={
            "approvalPoints": [point.model_dump(mode="json") for point in plan.approvalPoints],
            "constraints": [constraint.model_dump(mode="json") for constraint in plan.constraints],
            "fallbackRules": list(plan.fallbackRules),
            "successOutput": plan.successOutput.model_dump(mode="json") if plan.successOutput else None,
            "planArgumentHints": {
                step.id: list(step.argumentHints or [])
                for step in plan.steps
                if step.argumentHints
            },
        },
        currentStepId=None,
        pendingApproval=None,
        steps=[_build_run_step(step) for step in plan.steps],
        events=[],
        summary=WorkflowRunSummary(completedSteps=0, totalSteps=len(plan.steps)),
        createdAt=timestamp,
        updatedAt=timestamp,
    )
    _append_event(run, "run_created", message="Workflow run created.")
    _save_run(run)
    if request.autoStart:
        return advance_workflow_run(run.runId)
    return run


def get_workflow_run(run_id: str) -> WorkflowRun:
    return _load_run(run_id)


def advance_workflow_run(run_id: str) -> WorkflowRun:
    run = _load_run(run_id)
    if run.status in {"completed", "failed", "cancelled"}:
        raise WorkflowRunStateError(f"Workflow run `{run_id}` is already {run.status}.")
    if run.status == "waiting_for_approval":
        raise WorkflowRunStateError(f"Workflow run `{run_id}` is waiting for approval.")

    if run.status == "created":
        run.status = "running"
        _append_event(run, "run_started", message="Workflow run started.")
    else:
        run.status = "running"
        _append_event(run, "run_resumed", message="Workflow run resumed.")

    while True:
        next_step = _next_pending_step(run)
        if next_step is None:
            run.status = "completed"
            run.currentStepId = None
            run.pendingApproval = None
            _append_event(run, "run_completed", message="Workflow run completed.")
            _save_run(run)
            return run

        run.currentStepId = next_step.id

        if _should_pause_before_step(run, next_step):
            _pause_for_approval(run, next_step)
            _save_run(run)
            return run

        _execute_step(run, next_step)
        if _should_pause_after_step(run, next_step):
            run.status = "waiting_for_approval"
            run.currentStepId = next_step.id
            run.pendingApproval = _build_pending_approval(run, next_step)
            _append_event(
                run,
                "approval_required",
                stepId=next_step.id,
                message=run.pendingApproval.message,
                payload=run.pendingApproval.model_dump(mode="json"),
            )
            _refresh_summary(run)
            _save_run(run)
            return run
        _refresh_summary(run)
        _save_run(run)


def approve_workflow_run(run_id: str, request: WorkflowApprovalRequest) -> WorkflowRun:
    run = _load_run(run_id)
    if run.status != "waiting_for_approval" or run.pendingApproval is None:
        raise WorkflowRunStateError(f"Workflow run `{run_id}` is not waiting for approval.")

    step = _find_step(run, run.pendingApproval.stepId)
    if step is None:
        raise WorkflowRunStateError(
            f"Workflow run `{run_id}` is missing approval step `{run.pendingApproval.stepId}`."
        )

    if not request.approved:
        return cancel_workflow_run(run_id)

    timestamp = _utc_now()
    if step.status == "waiting_for_approval":
        step.status = "completed"
        step.completedAt = timestamp
    run.pendingApproval = None
    run.currentStepId = None
    run.status = "running"
    _append_event(
        run,
        "approval_granted",
        stepId=step.id,
        message=request.note or f"Approval granted for step `{step.id}`.",
    )
    _refresh_summary(run)
    _save_run(run)
    return advance_workflow_run(run.runId)


def cancel_workflow_run(run_id: str) -> WorkflowRun:
    run = _load_run(run_id)
    if run.status in {"completed", "failed", "cancelled"}:
        raise WorkflowRunStateError(f"Workflow run `{run_id}` cannot be cancelled from {run.status}.")

    timestamp = _utc_now()
    cancelled_from_approval = run.pendingApproval is not None
    if run.currentStepId:
        step = _find_step(run, run.currentStepId)
        if step is not None and step.status in {"pending", "running", "waiting_for_approval"}:
            step.status = "cancelled"
            step.completedAt = timestamp

    run.status = "cancelled"
    run.pendingApproval = None
    run.currentStepId = None
    if cancelled_from_approval:
        metrics().increment("approval_dropoff_total")
    _append_event(run, "run_cancelled", message="Workflow run cancelled.")
    _refresh_summary(run)
    _save_run(run)
    return run


def _build_run_step(step: WorkflowPlanStep) -> WorkflowRunStep:
    return WorkflowRunStep(
        id=step.id,
        title=step.title,
        kind=step.kind,
        status="pending",
        toolName=step.toolName,
        stage=step.stage,
        requiresApproval=step.requiresApproval,
    )


def _next_pending_step(run: WorkflowRun) -> WorkflowRunStep | None:
    for step in run.steps:
        if step.status == "pending":
            return step
    return None


def _find_step(run: WorkflowRun, step_id: str) -> WorkflowRunStep | None:
    for step in run.steps:
        if step.id == step_id:
            return step
    return None


def _pause_for_approval(run: WorkflowRun, step: WorkflowRunStep) -> None:
    timestamp = _utc_now()
    step.status = "waiting_for_approval"
    step.startedAt = step.startedAt or timestamp
    run.status = "waiting_for_approval"
    run.pendingApproval = _build_pending_approval(run, step)
    _append_event(
        run,
        "approval_required",
        stepId=step.id,
        message=run.pendingApproval.message,
        payload=run.pendingApproval.model_dump(mode="json"),
    )


def _execute_step(run: WorkflowRun, step: WorkflowRunStep) -> None:
    timestamp = _utc_now()
    step.status = "running"
    step.startedAt = step.startedAt or timestamp
    _append_event(run, "step_started", stepId=step.id, toolName=step.toolName, message=step.title)

    try:
        if step.kind == "tool-call" and step.toolName:
            step.output = _execute_tool_step(run, step)
        else:
            step.output = {"status": "completed", "kind": step.kind}
    except Exception as error:
        step.status = "failed"
        step.error = str(error)
        step.completedAt = _utc_now()
        run.status = "failed"
        _append_event(
            run,
            "run_failed",
            stepId=step.id,
            toolName=step.toolName,
            message=str(error),
        )
        _save_run(run)
        raise WorkflowExecutionError(str(error)) from error

    step.status = "completed"
    step.completedAt = _utc_now()
    _append_event(run, "step_completed", stepId=step.id, toolName=step.toolName, payload=step.output)


def _should_pause_before_step(run: WorkflowRun, step: WorkflowRunStep) -> bool:
    if step.kind == "approval":
        return True
    if step.requiresApproval:
        return True
    approval_point = _lookup_approval_point(run, step.id)
    if approval_point is None:
        return False
    policy = get_tool_policy(step.toolName) if step.toolName else None
    if policy is None:
        return False
    return policy.retryClass in {"cart-mutation", "placement"}


def _should_pause_after_step(run: WorkflowRun, step: WorkflowRunStep) -> bool:
    approval_point = _lookup_approval_point(run, step.id)
    if approval_point is None:
        return False
    if step.kind == "approval":
        return False
    policy = get_tool_policy(step.toolName) if step.toolName else None
    if policy is None:
        return True
    return policy.retryClass not in {"cart-mutation", "placement"}


def _build_pending_approval(run: WorkflowRun, step: WorkflowRunStep) -> WorkflowPendingApproval:
    approval_point = _lookup_approval_point(run, step.id)
    return WorkflowPendingApproval(
        required=True,
        kind=approval_point.kind if approval_point else "final_confirmation",
        stepId=step.id,
        message=approval_point.description if approval_point else step.title,
        reviewData=_build_review_data(run),
    )


def _execute_tool_step(run: WorkflowRun, step: WorkflowRunStep) -> dict[str, JsonValue]:
    assert step.toolName is not None
    policy = get_tool_policy(step.toolName)
    if policy is None:
        raise WorkflowExecutionError(f"Tool `{step.toolName}` is not registered in the backend policy registry.")

    refresh_result = _refresh_turn_boundary_state(run, step.toolName)
    if refresh_result is not None:
        _merge_result_context(run, f"{step.toolName}_preflight", refresh_result)

    arguments = _resolve_tool_arguments(run, step)
    _append_event(
        run,
        "tool_call_started",
        stepId=step.id,
        toolName=step.toolName,
        payload={"arguments": arguments},
    )

    try:
        result = call_mcp_tool(step.toolName, arguments, session_id=run.sessionId)
    except Exception as error:
        if requires_status_check_before_retry(policy) and policy.statusCheckTool:
            status_result = call_mcp_tool(policy.statusCheckTool, {}, session_id=run.sessionId)
            _merge_result_context(run, policy.statusCheckTool, status_result)
        raise WorkflowExecutionError(f"Tool `{step.toolName}` failed: {error}") from error

    _append_event(
        run,
        "tool_call_completed",
        stepId=step.id,
        toolName=step.toolName,
        payload={"arguments": arguments, "result": result},
    )
    _merge_result_context(run, step.toolName, result)
    return result


def _refresh_turn_boundary_state(run: WorkflowRun, tool_name: str) -> dict[str, JsonValue] | None:
    refresh_tool = _get_refresh_tool_for(tool_name)
    if refresh_tool is None:
        return None
    result = call_mcp_tool(refresh_tool, {}, session_id=run.sessionId)
    _append_event(
        run,
        "tool_call_completed",
        stepId=run.currentStepId,
        toolName=refresh_tool,
        payload={"preflight": True, "result": result},
        message=f"Refreshed server-side state with `{refresh_tool}`.",
    )
    return result


def _get_refresh_tool_for(tool_name: str) -> str | None:
    if tool_name in {"update_food_cart", "place_food_order"}:
        return "get_food_cart"
    if tool_name in {"update_cart", "checkout"}:
        return "get_cart"
    return None


def _resolve_tool_arguments(run: WorkflowRun, step: WorkflowRunStep) -> dict[str, JsonValue]:
    hints = _step_argument_hints(run, step)
    arguments: dict[str, JsonValue] = {}
    for hint in hints:
        value = _lookup_context_value(run, hint)
        if value is None:
            value = _default_argument_value(run, step, hint)
        if value is not None:
            arguments[_canonical_argument_name(hint)] = value
    return arguments


def _step_argument_hints(run: WorkflowRun, step: WorkflowRunStep) -> list[str]:
    approval_points = run.resolvedContext.get("planArgumentHints")
    if isinstance(approval_points, dict):
        hinted = approval_points.get(step.id)
        if isinstance(hinted, list):
            return [str(item) for item in hinted]
    return []


def _lookup_context_value(run: WorkflowRun, hint: str) -> JsonValue | None:
    candidates = _argument_aliases(hint)
    for candidate in candidates:
        value = _lookup_mapping_value(run.resolvedContext, candidate)
        if value is not None:
            return value
        value = _lookup_mapping_value(run.providedInputs, candidate)
        if value is not None:
            return value
    return None


def _lookup_mapping_value(mapping: dict[str, JsonValue], candidate: str) -> JsonValue | None:
    candidate_key = _normalize_key(candidate)
    for key, value in mapping.items():
        if _normalize_key(key) == candidate_key:
            return value
    return None


def _default_argument_value(run: WorkflowRun, step: WorkflowRunStep, hint: str) -> JsonValue | None:
    canonical_hint = _canonical_argument_name(hint)
    if canonical_hint == "query":
        return (
            _lookup_mapping_value(run.providedInputs, "query")
            or _lookup_mapping_value(run.providedInputs, "teamName")
            or run.title
        )
    if canonical_hint == "restaurantId":
        selected = run.resolvedContext.get("selectedRestaurant")
        if isinstance(selected, dict):
            return selected.get("id")
    if canonical_hint == "restaurantName":
        selected = run.resolvedContext.get("selectedRestaurant")
        if isinstance(selected, dict):
            return selected.get("name")
    if canonical_hint == "items":
        selected_items = run.resolvedContext.get("selectedItems")
        if isinstance(selected_items, list) and selected_items:
            return selected_items
    if canonical_hint == "paymentMethod":
        return (
            _lookup_mapping_value(run.providedInputs, "paymentMethod")
            or _lookup_mapping_value(run.providedInputs, "paymentMode")
            or "COD"
        )
    if canonical_hint == "orderId":
        order = run.resolvedContext.get("order")
        if isinstance(order, dict):
            return order.get("orderId")
        return _lookup_mapping_value(run.resolvedContext, "orderId")
    if canonical_hint == "addressId":
        return _lookup_mapping_value(run.providedInputs, "addressId") or ""
    if canonical_hint == "city":
        return _lookup_mapping_value(run.providedInputs, "city")
    if canonical_hint == "payment_mode":
        return _default_argument_value(run, step, "paymentMethod")
    return None


def _argument_aliases(hint: str) -> list[str]:
    canonical = _canonical_argument_name(hint)
    aliases = {
        "restaurantId": ["restaurantId", "restaurant_id"],
        "restaurantName": ["restaurantName", "restaurant_name"],
        "addressId": ["addressId", "address_id"],
        "paymentMethod": ["paymentMethod", "payment_mode", "paymentMode"],
        "orderId": ["orderId", "order_id"],
        "maxDistanceKm": ["maxDistanceKm", "max_distance_km"],
        "minProteinGrams": ["minProteinGrams", "min_protein_grams"],
        "maxBudget": ["maxBudget", "budgetCap", "budget_inr", "budget"],
        "deliveryWindow": ["deliveryWindow", "delivery_window"],
        "officeLocation": ["officeLocation", "office_location"],
        "headcount": ["headcount", "team_size"],
        "dietaryMatrix": ["dietaryMatrix", "dietary_matrix"],
    }
    return aliases.get(canonical, [hint, canonical])


def _canonical_argument_name(hint: str) -> str:
    compact = _normalize_key(hint)
    canonical_map = {
        "restaurantid": "restaurantId",
        "restaurantname": "restaurantName",
        "addressid": "addressId",
        "paymentmethod": "paymentMethod",
        "paymentmode": "paymentMethod",
        "ordertid": "orderId",
        "orderid": "orderId",
        "maxdistancekm": "maxDistanceKm",
        "minproteingrams": "minProteinGrams",
        "maxbudget": "maxBudget",
        "budgetcap": "budgetCap",
        "deliverywindow": "deliveryWindow",
        "officelocation": "officeLocation",
        "dietarymatrix": "dietaryMatrix",
    }
    return canonical_map.get(compact, hint)


def _merge_result_context(run: WorkflowRun, tool_name: str, result: dict[str, JsonValue]) -> None:
    run.resolvedContext[f"{tool_name}Result"] = result
    structured = result.get("structuredContent")
    if isinstance(structured, dict):
        for key, value in structured.items():
            run.resolvedContext[key] = value

    if tool_name == "search_restaurants":
        restaurants = structured.get("restaurants") if isinstance(structured, dict) else None
        if isinstance(restaurants, list) and restaurants:
            selected = restaurants[0]
            run.resolvedContext["candidateRestaurants"] = restaurants
            run.resolvedContext["selectedRestaurant"] = selected
            if isinstance(selected, dict):
                run.resolvedContext["restaurantId"] = selected.get("id")
                run.resolvedContext["restaurantName"] = selected.get("name")
                if selected.get("addressId") is not None:
                    run.resolvedContext["addressId"] = selected.get("addressId")

    if tool_name == "get_restaurant_menu" and isinstance(structured, dict):
        items = structured.get("items")
        if isinstance(items, list) and items:
            run.resolvedContext["menuItems"] = items
            run.resolvedContext["selectedItems"] = [items[0]]
        if structured.get("restaurantId") is not None:
            run.resolvedContext["restaurantId"] = structured.get("restaurantId")

    if tool_name in {"update_food_cart", "get_food_cart", "get_cart", "update_cart"} and isinstance(structured, dict):
        run.resolvedContext["cart"] = structured
        if structured.get("items") is not None:
            run.resolvedContext["cartItems"] = structured.get("items")
        if structured.get("restaurantId") is not None:
            run.resolvedContext["restaurantId"] = structured.get("restaurantId")
        if structured.get("restaurantName") is not None:
            run.resolvedContext["restaurantName"] = structured.get("restaurantName")

    if tool_name in {"place_food_order", "checkout", "book_table"} and isinstance(structured, dict):
        run.resolvedContext["order"] = structured
        if structured.get("orderId") is not None:
            run.resolvedContext["orderId"] = structured.get("orderId")

    if tool_name in {"track_food_order", "track_order", "get_booking_status"} and isinstance(structured, dict):
        run.resolvedContext["tracking"] = structured


def _build_review_data(run: WorkflowRun) -> dict[str, JsonValue]:
    review_data: dict[str, JsonValue] = {}
    if "cart" in run.resolvedContext:
        review_data["cartSummary"] = run.resolvedContext["cart"]
    if "order" in run.resolvedContext:
        review_data["orderSummary"] = run.resolvedContext["order"]
    if "selectedRestaurant" in run.resolvedContext:
        review_data["selectedRestaurant"] = run.resolvedContext["selectedRestaurant"]
    return review_data


def _lookup_approval_point(run: WorkflowRun, step_id: str) -> WorkflowApprovalPoint | None:
    points = run.resolvedContext.get("approvalPoints")
    if not isinstance(points, list):
        return None
    for point in points:
        if isinstance(point, dict) and point.get("stepId") == step_id:
            return WorkflowApprovalPoint.model_validate(point)
    return None


def _append_event(
    run: WorkflowRun,
    event_type: str,
    *,
    stepId: str | None = None,
    toolName: str | None = None,
    payload: dict[str, JsonValue] | None = None,
    message: str | None = None,
) -> None:
    run.events.append(
        WorkflowRunEvent(
            id=f"evt_{uuid4().hex[:12]}",
            type=event_type,
            stepId=stepId,
            toolName=toolName,
            timestamp=_utc_now(),
            payload=payload or {},
            message=message,
        )
    )
    run.updatedAt = _utc_now()
    _record_run_event(run, event_type, stepId=stepId, toolName=toolName, message=message)


def _refresh_summary(run: WorkflowRun) -> None:
    run.summary = WorkflowRunSummary(
        completedSteps=sum(1 for step in run.steps if step.status == "completed"),
        totalSteps=len(run.steps),
    )


def _storage_path(run_id: str) -> Path:
    base_dir = get_run_storage_directory()
    base_dir.mkdir(parents=True, exist_ok=True)
    safe_id = "".join(ch if ch.isalnum() or ch in "_-" else "-" for ch in run_id)
    return base_dir / f"{safe_id}.json"


def _save_run(run: WorkflowRun) -> None:
    path = _storage_path(run.runId)
    path.write_text(json.dumps(run.model_dump(mode="json"), indent=2))


def _load_run(run_id: str) -> WorkflowRun:
    path = _storage_path(run_id)
    if not path.exists():
        raise WorkflowRunNotFoundError(f"Workflow run `{run_id}` was not found.")
    return WorkflowRun.model_validate(json.loads(path.read_text()))


def _normalize_key(value: str) -> str:
    return "".join(ch for ch in value.lower() if ch.isalnum())


def _utc_now() -> str:
    return datetime.now(UTC).isoformat()


def _record_run_event(
    run: WorkflowRun,
    event_type: str,
    *,
    stepId: str | None,
    toolName: str | None,
    message: str | None,
) -> None:
    if event_type == "run_started":
        metrics().increment("workflow_started_total")
    if event_type == "run_failed":
        metrics().increment("workflow_failure_total")
    if event_type == "run_completed":
        metrics().increment("workflow_completion_total")
    if event_type == "approval_required":
        metrics().increment("approval_required_total")
    log_event(
        "info" if event_type not in {"run_failed"} else "error",
        "workflow_run_event",
        run_id=run.runId,
        workflow_id=run.workflowId,
        session_id=run.sessionId,
        status=run.status,
        event_type=event_type,
        step_id=stepId,
        tool=toolName,
        message=message,
        completed_steps=run.summary.completedSteps,
        total_steps=run.summary.totalSteps,
    )
