#!/usr/bin/env python3

from __future__ import annotations

import os
import shutil
import sys
from textwrap import dedent


def main() -> int:
    command = os.getenv("SWIGGY_MCP_COMMAND")
    args = os.getenv("SWIGGY_MCP_ARGS", "")

    print("Swiggy CLI Environment Doctor")
    print("============================")

    if not command:
        print("Status: FAILED")
        print("Reason: SWIGGY_MCP_COMMAND is not set.")
        print("Action: Export the command that starts the Swiggy MCP server.")
        return 1

    executable = shutil.which(command)
    print(f"Configured command: {command}")
    print(f"Configured args: {args or '(none)'}")

    if executable:
        print(f"Resolved executable: {executable}")
        print("Status: OK")
        return 0

    print("Status: FAILED")
    print(
        dedent(
            """
            Reason: The configured command was not found on PATH.
            Action:
              1. Install the Swiggy MCP server runtime.
              2. Verify the command starts correctly from your shell.
              3. Re-run `python3 python/doctor.py`.
            """
        ).strip()
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
