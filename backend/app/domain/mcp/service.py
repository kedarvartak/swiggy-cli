from __future__ import annotations

from typing import Any

from .client import McpSession
from .config import load_mcp_config
from .models import ToolDescriptor
from .tool_registry import enrich_tool_descriptor, list_registered_tool_descriptors


def get_mcp_status() -> dict[str, Any]:
    config = load_mcp_config()
    with McpSession(config) as session:
        return session.initialize_result


def list_mcp_tools() -> list[dict[str, Any]]:
    config = load_mcp_config()
    with McpSession(config) as session:
        return [enrich_tool_descriptor(tool).model_dump(mode="json") for tool in session.list_tools()]


def list_registered_mcp_tools() -> list[ToolDescriptor]:
    return list_registered_tool_descriptors()


def call_mcp_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    config = load_mcp_config()
    with McpSession(config) as session:
        return session.call_tool(name, arguments)
