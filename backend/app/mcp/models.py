from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


JsonValue = Any


class ToolDescriptor(BaseModel):
    name: str
    description: str | None = None
    inputSchema: JsonValue | None = None


class ToolCallRequest(BaseModel):
    name: str
    arguments: dict[str, JsonValue] = Field(default_factory=dict)
