from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.errors import AuthForbiddenError, AuthRequiredError, McpConfigurationError, McpProtocolError
from app.domain.mcp.models import ToolCallRequest, ToolDescriptor
from app.domain.mcp.service import (
    call_mcp_tool,
    get_mcp_status,
    list_mcp_tools,
    list_registered_mcp_tools,
)


router = APIRouter(prefix="/mcp", tags=["mcp"])


@router.get("/status", response_model=dict)
def mcp_status() -> dict:
    try:
        return get_mcp_status()
    except McpConfigurationError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except McpProtocolError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@router.get("/tools", response_model=list[ToolDescriptor])
def mcp_tools() -> list[ToolDescriptor]:
    try:
        return [ToolDescriptor.model_validate(tool) for tool in list_mcp_tools()]
    except AuthRequiredError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error
    except AuthForbiddenError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    except McpConfigurationError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except McpProtocolError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@router.get("/tools/catalog", response_model=list[ToolDescriptor])
def mcp_tool_catalog() -> list[ToolDescriptor]:
    return list_registered_mcp_tools()


@router.post("/tools/call", response_model=dict)
def mcp_tool_call(request: ToolCallRequest) -> dict:
    try:
        return call_mcp_tool(request.name, request.arguments)
    except AuthRequiredError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error
    except AuthForbiddenError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    except McpConfigurationError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except McpProtocolError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
