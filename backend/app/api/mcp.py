from __future__ import annotations

from fastapi import APIRouter

from app.domain.mcp.models import ToolCallRequest, ToolCallResult, ToolDescriptor
from app.domain.mcp.service import (
    call_mcp_tool_with_metadata,
    get_mcp_status,
    list_mcp_tools,
    list_registered_mcp_tools,
)


router = APIRouter(prefix="/mcp", tags=["mcp"])


@router.get("/status", response_model=dict)
def mcp_status() -> dict:
    return get_mcp_status()


@router.get("/tools", response_model=list[ToolDescriptor])
def mcp_tools() -> list[ToolDescriptor]:
    return [ToolDescriptor.model_validate(tool) for tool in list_mcp_tools()]


@router.get("/tools/catalog", response_model=list[ToolDescriptor])
def mcp_tool_catalog() -> list[ToolDescriptor]:
    return list_registered_mcp_tools()


@router.post("/tools/call", response_model=ToolCallResult)
def mcp_tool_call(request: ToolCallRequest) -> ToolCallResult:
    return call_mcp_tool_with_metadata(request.name, request.arguments, session_id=request.sessionId)
