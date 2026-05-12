from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


JsonValue = Any
McpDomain = Literal["food", "instamart", "dineout", "shared", "unknown"]
ToolStage = Literal["discover", "cart", "order", "track", "support", "find", "reserve", "manage", "unknown"]
ToolRetryClass = Literal["read", "cart-mutation", "placement", "support", "unknown"]


class ToolDescriptor(BaseModel):
    name: str
    description: str | None = None
    inputSchema: JsonValue | None = None
    domain: McpDomain = "unknown"
    stage: ToolStage = "unknown"
    retryClass: ToolRetryClass = "unknown"
    requiresApproval: bool = False
    supportsBlindRetry: bool = False
    safeAtTurnBoundary: bool = False
    statusCheckTool: str | None = None
    notes: list[str] = Field(default_factory=list)


class ToolCallRequest(BaseModel):
    name: str
    arguments: dict[str, JsonValue] = Field(default_factory=dict)
    sessionId: str | None = None


class ToolCallTiming(BaseModel):
    durationMs: float


class ToolCallResult(BaseModel):
    name: str
    domain: McpDomain
    sessionId: str
    success: bool
    data: dict[str, JsonValue] = Field(default_factory=dict)
    timing: ToolCallTiming


class ToolPolicy(BaseModel):
    name: str
    domain: McpDomain
    stage: ToolStage
    retryClass: ToolRetryClass
    requiresApproval: bool
    supportsBlindRetry: bool
    safeAtTurnBoundary: bool = False
    statusCheckTool: str | None = None
    notes: list[str] = Field(default_factory=list)
