from __future__ import annotations

from time import monotonic, sleep
from typing import Any

from app.core.errors import AuthForbiddenError, AuthRequiredError, McpProtocolError
from app.core.telemetry import log_event, metrics
from app.domain.auth.service import (
    mark_session_authenticated,
    mark_session_reauth_required,
    require_authenticated_session,
    resolve_auth_session_id,
)

from .client import McpSession
from .config import load_mcp_config
from .models import ToolCallResult, ToolCallTiming, ToolDescriptor
from .retry_policy import retry_budget_seconds, should_blind_retry
from .tool_registry import enrich_tool_descriptor, get_tool_policy, list_registered_tool_descriptors


def get_mcp_status() -> dict[str, Any]:
    config = load_mcp_config()
    with McpSession(config) as session:
        return session.initialize_result


def list_mcp_tools(session_id: str | None = None) -> list[dict[str, Any]]:
    require_authenticated_session(session_id=session_id)
    config = load_mcp_config()
    with McpSession(config) as session:
        tools = [enrich_tool_descriptor(tool).model_dump(mode="json") for tool in session.list_tools()]
    mark_session_authenticated(session_id=session_id)
    return tools


def list_registered_mcp_tools() -> list[ToolDescriptor]:
    return list_registered_tool_descriptors()


def call_mcp_tool(name: str, arguments: dict[str, Any], session_id: str | None = None) -> dict[str, Any]:
    return _execute_tool_call(name, arguments, session_id=session_id)["data"]


def call_mcp_tool_with_metadata(
    name: str,
    arguments: dict[str, Any],
    session_id: str | None = None,
) -> ToolCallResult:
    execution = _execute_tool_call(name, arguments, session_id=session_id)
    return ToolCallResult(
        name=name,
        domain=execution["domain"],
        sessionId=execution["sessionId"],
        success=True,
        data=execution["data"],
        timing=ToolCallTiming(durationMs=execution["durationMs"]),
    )


def _execute_tool_call(name: str, arguments: dict[str, Any], session_id: str | None = None) -> dict[str, Any]:
    policy = get_tool_policy(name)
    resolved_session_id = resolve_auth_session_id(session_id)
    require_authenticated_session(session_id=resolved_session_id, domain=policy.domain if policy else None)

    start = monotonic()
    attempt = 0
    retry_deadline = start + retry_budget_seconds()
    last_error: Exception | None = None

    while monotonic() <= retry_deadline:
        attempt += 1
        try:
            result = _invoke_tool(name, arguments)
            duration_ms = (monotonic() - start) * 1000
            mark_session_authenticated(session_id=resolved_session_id)
            _record_tool_success(
                name=name,
                domain=policy.domain if policy else "unknown",
                session_id=resolved_session_id,
                attempt=attempt,
                duration_ms=duration_ms,
            )
            return {
                "data": result,
                "domain": policy.domain if policy else "unknown",
                "sessionId": resolved_session_id,
                "durationMs": duration_ms,
            }
        except McpProtocolError as error:
            last_error = error
            _handle_auth_failure(error, session_id=resolved_session_id)
            if not _should_retry(policy, error, attempt=attempt, deadline=retry_deadline):
                _record_tool_failure(
                    name=name,
                    domain=policy.domain if policy else "unknown",
                    session_id=resolved_session_id,
                    attempt=attempt,
                    duration_ms=(monotonic() - start) * 1000,
                    error=error,
                )
                if _should_check_placement_status(policy):
                    recovered = _check_then_retry_placement(
                        policy.statusCheckTool,
                        resolved_session_id,
                        trigger_tool=name,
                    )
                    if recovered is not None:
                        duration_ms = (monotonic() - start) * 1000
                        _record_tool_success(
                            name=name,
                            domain=policy.domain if policy else "unknown",
                            session_id=resolved_session_id,
                            attempt=attempt,
                            duration_ms=duration_ms,
                            recovered=True,
                        )
                        return {
                            "data": recovered,
                            "domain": policy.domain if policy else "unknown",
                            "sessionId": resolved_session_id,
                            "durationMs": duration_ms,
                        }
                raise
            sleep(_retry_sleep_seconds(attempt))

    assert last_error is not None
    raise last_error


def _invoke_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    config = load_mcp_config()
    with McpSession(config) as session:
        return session.call_tool(name, arguments)


def _should_retry(policy, error: McpProtocolError, *, attempt: int, deadline: float) -> bool:  # type: ignore[no-untyped-def]
    if attempt >= 4 or monotonic() >= deadline:
        return False
    if policy is None:
        return _is_retryable_protocol_error(error)
    if should_blind_retry(policy):
        return _is_retryable_protocol_error(error)
    return False


def _is_retryable_protocol_error(error: McpProtocolError) -> bool:
    message = str(error).lower()
    retryable_markers = ("timeout", "upstream", "internal", "500", "502", "503", "504")
    return any(marker in message for marker in retryable_markers)


def _should_check_placement_status(policy) -> bool:  # type: ignore[no-untyped-def]
    return bool(policy and policy.retryClass == "placement" and policy.statusCheckTool)


def _check_then_retry_placement(
    status_tool: str | None,
    session_id: str,
    *,
    trigger_tool: str,
) -> dict[str, Any] | None:
    if not status_tool:
        return None
    sleep(2)
    try:
        probe = _invoke_tool(status_tool, {})
    except McpProtocolError:
        return None
    log_event(
        "warning",
        "mcp_placement_status_probe",
        tool=trigger_tool,
        status_tool=status_tool,
        session_id=session_id,
        status="recovered_check",
    )
    return {"statusCheckTool": status_tool, "probe": probe, "recovered": True}


def _retry_sleep_seconds(attempt: int) -> float:
    backoff = min(0.5 * (2 ** (attempt - 1)), 4.0)
    return backoff


def _record_tool_success(
    *,
    name: str,
    domain: str,
    session_id: str,
    attempt: int,
    duration_ms: float,
    recovered: bool = False,
) -> None:
    metrics().increment("tool_success_total")
    metrics().observe("tool_latency_ms", duration_ms)
    log_event(
        "info",
        "mcp_tool_call",
        tool=name,
        domain=domain,
        session_id=session_id,
        duration_ms=round(duration_ms, 2),
        attempt=attempt,
        status="ok_recovered" if recovered else "ok",
    )


def _record_tool_failure(
    *,
    name: str,
    domain: str,
    session_id: str,
    attempt: int,
    duration_ms: float,
    error: Exception,
) -> None:
    metrics().increment("tool_failure_total")
    metrics().observe("tool_latency_ms", duration_ms)
    log_event(
        "error",
        "mcp_tool_call",
        tool=name,
        domain=domain,
        session_id=session_id,
        duration_ms=round(duration_ms, 2),
        attempt=attempt,
        status="error",
        error=str(error),
    )


def _handle_auth_failure(error: McpProtocolError, *, session_id: str) -> None:
    message = str(error)
    if "(-32001)" in message or "401" in message or "419" in message:
        metrics().increment("auth_failure_total")
        mark_session_reauth_required(session_id=session_id, error_code="upstream_auth_failed")
        raise AuthRequiredError("Upstream MCP session requires re-authentication.") from error
    if "403" in message:
        metrics().increment("auth_failure_total")
        mark_session_reauth_required(session_id=session_id, error_code="upstream_scope_forbidden")
        raise AuthForbiddenError("Upstream MCP session is authenticated but lacks required access.") from error
