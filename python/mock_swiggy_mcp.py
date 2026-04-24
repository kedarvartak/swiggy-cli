#!/usr/bin/env python3

from __future__ import annotations

import json
import sys
from typing import Any


TOOLS: list[dict[str, Any]] = [
    {
        "name": "search_restaurants",
        "description": "Search restaurants by free-text query and optional city.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "city": {"type": "string"},
            },
        },
    },
    {
        "name": "get_restaurant_menu",
        "description": "Return a sample menu for a restaurant.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "restaurant_id": {"type": "string"},
            },
            "required": ["restaurant_id"],
        },
    },
    {
        "name": "update_food_cart",
        "description": "Update the sample food cart.",
        "inputSchema": {"type": "object"},
    },
    {
        "name": "get_food_cart",
        "description": "Return the sample cart.",
        "inputSchema": {"type": "object"},
    },
    {
        "name": "place_food_order",
        "description": "Place a sample order.",
        "inputSchema": {"type": "object"},
    },
    {
        "name": "track_food_order",
        "description": "Track a sample order.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string"},
            },
        },
    },
]


CART: dict[str, Any] = {
    "restaurant_id": "demo-restaurant",
    "items": [],
}


def send(message: dict[str, Any]) -> None:
    print(json.dumps(message), flush=True)


def success(message_id: int, result: Any) -> None:
    send({"jsonrpc": "2.0", "id": message_id, "result": result})


def error(message_id: int | None, code: int, message: str) -> None:
    send(
        {
            "jsonrpc": "2.0",
            "id": message_id,
            "error": {
                "code": code,
                "message": message,
            },
        }
    )


def handle_tool_call(message_id: int, name: str, arguments: dict[str, Any]) -> None:
    if name == "search_restaurants":
        query = arguments.get("query", "")
        city = arguments.get("city", "unknown")
        success(
            message_id,
            {
                "structuredContent": {
                    "restaurants": [
                        {
                            "id": "rest-101",
                            "name": f"Demo Kitchen for {query or 'all cuisines'}",
                            "city": city,
                            "cuisines": ["North Indian", "Biryani"],
                        }
                    ]
                }
            },
        )
        return

    if name == "get_restaurant_menu":
        success(
            message_id,
            {
                "structuredContent": {
                    "restaurant_id": arguments["restaurant_id"],
                    "items": [
                        {"id": "dish-1", "name": "Classic Biryani", "price": 249},
                        {"id": "dish-2", "name": "Paneer Bowl", "price": 199},
                    ],
                }
            },
        )
        return

    if name == "update_food_cart":
        CART.update(arguments)
        success(message_id, {"structuredContent": CART})
        return

    if name == "get_food_cart":
        success(message_id, {"structuredContent": CART})
        return

    if name == "place_food_order":
        success(
            message_id,
            {
                "structuredContent": {
                    "order_id": "order-demo-1001",
                    "status": "PLACED",
                    "payment_mode": arguments.get("payment_mode", "unknown"),
                }
            },
        )
        return

    if name == "track_food_order":
        success(
            message_id,
            {
                "structuredContent": {
                    "order_id": arguments.get("order_id", "order-demo-1001"),
                    "status": "OUT_FOR_DELIVERY",
                    "eta_minutes": 18,
                }
            },
        )
        return

    error(message_id, -32601, f"Unknown tool: {name}")


def main() -> int:
    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue

        try:
            message = json.loads(line)
        except json.JSONDecodeError:
            error(None, -32700, "Invalid JSON")
            continue

        method = message.get("method")
        message_id = message.get("id")

        if method == "initialize":
            success(
                message_id,
                {
                    "protocolVersion": "2024-11-05",
                    "serverInfo": {"name": "mock-swiggy-mcp", "version": "0.1.0"},
                    "capabilities": {"tools": {}},
                },
            )
            continue

        if method == "notifications/initialized":
            continue

        if method == "tools/list":
            success(message_id, {"tools": TOOLS})
            continue

        if method == "tools/call":
            params = message.get("params", {})
            handle_tool_call(
                message_id,
                params.get("name", ""),
                params.get("arguments", {}),
            )
            continue

        error(message_id, -32601, f"Unknown method: {method}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
