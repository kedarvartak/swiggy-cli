from __future__ import annotations

from typing import Any

from app.core.errors import AuthForbiddenError, AuthRequiredError, McpProtocolError
from app.domain.auth.service import mark_session_authenticated, mark_session_reauth_required, require_authenticated_session

from .client import McpSession
from .config import load_mcp_config
from .models import ToolDescriptor
from .tool_registry import enrich_tool_descriptor, get_tool_policy, list_registered_tool_descriptors


def get_mcp_status() -> dict[str, Any]:
    config = load_mcp_config()
    with McpSession(config) as session:
        return session.initialize_result


def list_mcp_tools() -> list[dict[str, Any]]:
    require_authenticated_session()
    config = load_mcp_config()
    with McpSession(config) as session:
        tools = [enrich_tool_descriptor(tool).model_dump(mode="json") for tool in session.list_tools()]
    mark_session_authenticated()
    return tools


def list_registered_mcp_tools() -> list[ToolDescriptor]:
    return list_registered_tool_descriptors()


def call_mcp_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    policy = get_tool_policy(name)
    require_authenticated_session(domain=policy.domain if policy else None)
    config = load_mcp_config()
    try:
        with McpSession(config) as session:
            result = session.call_tool(name, arguments)
    except McpProtocolError as error:
        _handle_auth_failure(error)
        raise
    mark_session_authenticated()
    return result


def _handle_auth_failure(error: McpProtocolError) -> None:
    message = str(error)
    if "(-32001)" in message or "401" in message or "419" in message:
        mark_session_reauth_required(error_code="upstream_auth_failed")
        raise AuthRequiredError("Upstream MCP session requires re-authentication.") from error
    if "403" in message:
        mark_session_reauth_required(error_code="upstream_scope_forbidden")
        raise AuthForbiddenError("Upstream MCP session is authenticated but lacks required access.") from error
