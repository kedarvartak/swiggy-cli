from __future__ import annotations

import os
from pathlib import Path


def get_workflow_directory() -> Path:
    configured = os.environ.get("SWIGGY_WORKFLOW_DIR", "").strip()
    if configured:
        return Path(configured).expanduser().resolve()
    return Path(__file__).resolve().parents[3] / "workflows"


def get_run_storage_directory() -> Path:
    configured = os.environ.get("SWIGGY_RUN_DIR", "").strip()
    if configured:
        return Path(configured).expanduser().resolve()
    return Path(__file__).resolve().parents[3] / ".runtime" / "runs"
