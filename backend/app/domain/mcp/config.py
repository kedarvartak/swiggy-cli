from __future__ import annotations

import os
import shlex
from dataclasses import dataclass

from app.core.errors import McpConfigurationError


@dataclass(slots=True)
class McpConfig:
    command: str
    args: list[str]
    env: dict[str, str]


def load_mcp_config() -> McpConfig:
    command = os.environ.get("SWIGGY_MCP_COMMAND")
    if not command:
        raise McpConfigurationError(
            "Missing SWIGGY_MCP_COMMAND. Set it to the executable that starts your Swiggy MCP server."
        )

    args = shlex.split(os.environ.get("SWIGGY_MCP_ARGS", ""))
    env = dict(os.environ)
    return McpConfig(command=command, args=args, env=env)
