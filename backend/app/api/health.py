from __future__ import annotations

from fastapi import APIRouter

from app.core.telemetry import metrics


router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/metrics")
def health_metrics() -> dict:
    return metrics().snapshot()
