from __future__ import annotations

import json
import logging
from collections import defaultdict
from datetime import UTC, datetime
from statistics import mean
from typing import Any


_LOGGER = logging.getLogger("swiggy-backend")
if not _LOGGER.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(message)s"))
    _LOGGER.addHandler(handler)
_LOGGER.setLevel(logging.INFO)


class MetricsRegistry:
    def __init__(self) -> None:
        self._counters: dict[str, int] = defaultdict(int)
        self._timings: dict[str, list[float]] = defaultdict(list)

    def increment(self, name: str, value: int = 1) -> None:
        self._counters[name] += value

    def observe(self, name: str, value: float) -> None:
        self._timings[name].append(value)

    def snapshot(self) -> dict[str, Any]:
        return {
            "counters": dict(self._counters),
            "timings": {
                key: {
                    "count": len(values),
                    "avg": mean(values) if values else 0.0,
                    "max": max(values) if values else 0.0,
                }
                for key, values in self._timings.items()
            },
        }


_METRICS = MetricsRegistry()


def log_event(level: str, event: str, **fields: Any) -> None:
    payload = {
        "ts": datetime.now(UTC).isoformat(),
        "level": level,
        "event": event,
        **fields,
    }
    _LOGGER.log(_level_value(level), json.dumps(payload, default=str))


def metrics() -> MetricsRegistry:
    return _METRICS


def _level_value(level: str) -> int:
    normalized = level.lower()
    if normalized == "debug":
        return logging.DEBUG
    if normalized == "warning":
        return logging.WARNING
    if normalized == "error":
        return logging.ERROR
    return logging.INFO
