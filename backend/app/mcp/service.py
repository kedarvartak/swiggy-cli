from __future__ import annotations

import json
import os
import shlex
import subprocess
from dataclasses import dataclass
from typing import Any


class McpConfigurationError(RuntimeError):
    pass


class McpProtocolError(RuntimeError):
    pass


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


class McpSession:
    def __init__(self, config: McpConfig):
        self._config = config
        self._process: subprocess.Popen[str] | None = None
        self._next_id = 1

    def __enter__(self) -> "McpSession":
        self._process = subprocess.Popen(
            [self._config.command, *self._config.args],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=self._config.env,
        )
        self._initialize_result = self.initialize()
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if self._process is None:
            return
        if self._process.stdin and not self._process.stdin.closed:
            self._process.stdin.close()
        if self._process.stdout and not self._process.stdout.closed:
            self._process.stdout.close()
        if self._process.stderr and not self._process.stderr.closed:
            self._process.stderr.close()
        self._process.kill()
        self._process.wait(timeout=1)

    def initialize(self) -> dict[str, Any]:
        result = self._request(
            "initialize",
            {
                "protocolVersion": "2024-11-05",
                "clientInfo": {"name": "swiggy-backend", "version": "0.1.0"},
                "capabilities": {},
            },
        )
        self._notify("notifications/initialized", {})
        return result

    def list_tools(self) -> list[dict[str, Any]]:
        result = self._request("tools/list", {})
        return result.get("tools", [])

    def call_tool(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        return self._request("tools/call", {"name": name, "arguments": arguments})

    def _request(self, method: str, params: dict[str, Any]) -> dict[str, Any]:
        if self._process is None or self._process.stdin is None or self._process.stdout is None:
            raise McpProtocolError("MCP session is not started.")

        payload = {
            "jsonrpc": "2.0",
            "id": self._next_id,
            "method": method,
            "params": params,
        }
        self._next_id += 1

        self._process.stdin.write(json.dumps(payload) + "\n")
        self._process.stdin.flush()

        while True:
            line = self._process.stdout.readline()
            if not line:
                stderr = ""
                if self._process.stderr is not None:
                    stderr = self._process.stderr.read().strip()
                raise McpProtocolError(
                    f"MCP server stopped unexpectedly while handling {method}.{f' stderr={stderr}' if stderr else ''}"
                )

            message = json.loads(line)
            if message.get("id") != payload["id"]:
                continue
            if "error" in message:
                error = message["error"]
                raise McpProtocolError(f"{error.get('message')} ({error.get('code')})")
            return message.get("result", {})

    def _notify(self, method: str, params: dict[str, Any]) -> None:
        if self._process is None or self._process.stdin is None:
            raise McpProtocolError("MCP session is not started.")

        payload = {"jsonrpc": "2.0", "method": method, "params": params}
        self._process.stdin.write(json.dumps(payload) + "\n")
        self._process.stdin.flush()


def get_mcp_status() -> dict[str, Any]:
    config = load_mcp_config()
    with McpSession(config) as session:
        return session._initialize_result


def list_mcp_tools() -> list[dict[str, Any]]:
    config = load_mcp_config()
    with McpSession(config) as session:
        return session.list_tools()


def call_mcp_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    config = load_mcp_config()
    with McpSession(config) as session:
        return session.call_tool(name, arguments)
