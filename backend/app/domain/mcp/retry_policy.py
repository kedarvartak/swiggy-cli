from __future__ import annotations

from .models import ToolPolicy


def should_blind_retry(policy: ToolPolicy | None) -> bool:
    if policy is None:
        return False
    return policy.supportsBlindRetry


def requires_status_check_before_retry(policy: ToolPolicy | None) -> bool:
    if policy is None:
        return False
    return policy.retryClass == "placement" and policy.statusCheckTool is not None


def retry_budget_seconds() -> int:
    return 30
