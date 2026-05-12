from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.errors import (
    AuthForbiddenError,
    AuthRequiredError,
    BackendError,
    McpConfigurationError,
    McpProtocolError,
    WorkflowDefinitionExistsError,
    WorkflowExecutionError,
    WorkflowNotFoundError,
    WorkflowRunNotFoundError,
    WorkflowRunStateError,
    WorkflowValidationError,
)
from app.core.telemetry import log_event


def install_http_runtime(app: FastAPI) -> None:
    @app.middleware("http")
    async def request_metadata_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
        request.state.request_id = f"req_{uuid4().hex[:12]}"
        request.state.request_started_at = _timestamp()
        request.state.session_id = request.headers.get("x-session-id") or request.query_params.get("session_id")
        response = await call_next(request)
        response.headers["x-request-id"] = request.state.request_id
        return response

    @app.exception_handler(BackendError)
    async def backend_error_handler(request: Request, exc: BackendError) -> JSONResponse:  # type: ignore[no-untyped-def]
        status_code, code, retryable = _map_backend_error(exc)
        session_id = getattr(request.state, "session_id", None)
        tool = request.path_params.get("tool_name") if hasattr(request, "path_params") else None
        body = _error_envelope(
            request=request,
            status_code=status_code,
            code=code,
            message=str(exc),
            retryable=retryable,
            session_id=session_id,
            tool=tool,
        )
        log_event(
            "error",
            "backend_error",
            request_id=request.state.request_id,
            status_code=status_code,
            error_code=code,
            retryable=retryable,
            path=str(request.url.path),
            session_id=session_id,
            message=str(exc),
        )
        return JSONResponse(status_code=status_code, content=body)

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:  # type: ignore[no-untyped-def]
        code = f"HTTP_{exc.status_code}"
        body = _error_envelope(
            request=request,
            status_code=exc.status_code,
            code=code,
            message=str(exc.detail),
            retryable=exc.status_code >= 500,
            session_id=getattr(request.state, "session_id", None),
        )
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:  # type: ignore[no-untyped-def]
        body = _error_envelope(
            request=request,
            status_code=422,
            code="REQUEST_VALIDATION_ERROR",
            message=str(exc),
            retryable=False,
            session_id=getattr(request.state, "session_id", None),
        )
        return JSONResponse(status_code=422, content=body)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:  # type: ignore[no-untyped-def]
        body = _error_envelope(
            request=request,
            status_code=500,
            code="INTERNAL_ERROR",
            message="Unhandled backend error.",
            retryable=True,
            session_id=getattr(request.state, "session_id", None),
        )
        log_event(
            "error",
            "unhandled_exception",
            request_id=request.state.request_id,
            path=str(request.url.path),
            session_id=getattr(request.state, "session_id", None),
            message=str(exc),
        )
        return JSONResponse(status_code=500, content=body)


def _error_envelope(
    *,
    request: Request,
    status_code: int,
    code: str,
    message: str,
    retryable: bool,
    session_id: str | None,
    domain: str | None = None,
    tool: str | None = None,
) -> dict[str, Any]:
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "retryable": retryable,
            "domain": domain,
            "tool": tool,
            "sessionId": session_id,
        },
        "meta": {
            "requestId": request.state.request_id,
            "timestamp": _timestamp(),
            "backendVersion": "0.1.0",
            "sessionId": session_id,
            "statusCode": status_code,
        },
    }


def _map_backend_error(error: BackendError) -> tuple[int, str, bool]:
    if isinstance(error, AuthRequiredError):
        return 401, "AUTH_REAUTH_REQUIRED", False
    if isinstance(error, AuthForbiddenError):
        return 403, "AUTH_FORBIDDEN", False
    if isinstance(error, McpConfigurationError):
        return 500, "MCP_CONFIGURATION_ERROR", False
    if isinstance(error, McpProtocolError):
        message = str(error)
        if "timeout" in message.lower():
            return 502, "UPSTREAM_TIMEOUT", True
        return 502, "UPSTREAM_ERROR", True
    if isinstance(error, WorkflowValidationError):
        return 400, "WORKFLOW_VALIDATION_ERROR", False
    if isinstance(error, WorkflowDefinitionExistsError):
        return 409, "WORKFLOW_ALREADY_EXISTS", False
    if isinstance(error, (WorkflowNotFoundError, WorkflowRunNotFoundError)):
        return 404, "WORKFLOW_NOT_FOUND", False
    if isinstance(error, WorkflowRunStateError):
        return 409, "WORKFLOW_RUN_STATE_ERROR", False
    if isinstance(error, WorkflowExecutionError):
        return 502, "WORKFLOW_EXECUTION_ERROR", True
    return 500, "BACKEND_ERROR", True


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()
