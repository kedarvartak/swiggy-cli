#!/usr/bin/env python3

from __future__ import annotations

import json
import sys
from typing import Any


TOOLS: list[dict[str, Any]] = [
    {
        "name": "search_restaurants",
        "description": "Search restaurants by free-text query and delivery address ID, returning sample delivery metadata.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "addressId": {"type": "string"},
            },
            "required": ["addressId"],
        },
    },
    {
        "name": "get_restaurant_menu",
        "description": "Return a sample menu for a restaurant with basic nutrition metadata.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "restaurantId": {"type": "string"},
            },
            "required": ["restaurantId"],
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
                "orderId": {"type": "string"},
            },
        },
    },
]


CART: dict[str, Any] = {
    "restaurantId": "demo-restaurant",
    "items": [],
}


def send(message: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(message) + "\n")
    sys.stdout.flush()


def success(message_id: int, result: Any) -> None:
    send({"jsonrpc": "2.0", "id": message_id, "result": result})


def error(message_id: int | None, code: int, message: str) -> None:
    send(
        {
            "jsonrpc": "2.0",
            "id": message_id,
            "error": {"code": code, "message": message},
        }
    )


def handle_tool_call(message_id: int, name: str, args: dict[str, Any]) -> None:
    if name == "search_restaurants":
        success(
            message_id,
            {
                "structuredContent": {
                    "restaurants": [
                        {
                            "id": "rest-101",
                            "name": f"Demo Kitchen for {args.get('query', 'all cuisines')}",
                            "addressId": args.get("addressId", ""),
                            "cuisines": ["North Indian", "Biryani"],
                            "rating": 4.4,
                            "distance_km": 3.2,
                            "avg_delivery_minutes": 28,
                            "cost_for_two": 420,
                            "reliability_label": "high",
                        },
                        {
                            "id": "rest-205",
                            "name": "Protein House",
                            "addressId": args.get("addressId", ""),
                            "cuisines": ["Healthy", "Bowls", "Grills"],
                            "rating": 4.6,
                            "distance_km": 5.8,
                            "avg_delivery_minutes": 31,
                            "cost_for_two": 540,
                            "reliability_label": "high",
                        },
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
                    "restaurantId": str(args.get("restaurantId", "")),
                    "items": [
                        {
                            "id": "dish-1",
                            "name": "Classic Biryani",
                            "price": 249,
                            "protein_grams": 28,
                            "calories": 640,
                            "dietary_tags": ["high-protein"],
                        },
                        {
                            "id": "dish-2",
                            "name": "Paneer Bowl",
                            "price": 199,
                            "protein_grams": 24,
                            "calories": 520,
                            "dietary_tags": ["vegetarian"],
                        },
                    ],
                }
            },
        )
        return

    if name == "update_food_cart":
        CART.update(args)
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
                    "orderId": "order-demo-1001",
                    "status": "PLACED",
                    "paymentMethod": str(args.get("paymentMethod", "unknown")),
                }
            },
        )
        return

    if name == "track_food_order":
        success(
            message_id,
            {
                "structuredContent": {
                    "orderId": str(args.get("orderId", "order-demo-1001")),
                    "status": "OUT_FOR_DELIVERY",
                    "eta_minutes": 18,
                }
            },
        )
        return

    error(message_id, -32601, f"Unknown tool: {name}")


def handle_message(message: dict[str, Any]) -> None:
    method = message.get("method")
    message_id = message.get("id") if isinstance(message.get("id"), int) else None

    if method == "initialize" and message_id is not None:
        success(
            message_id,
            {
                "protocolVersion": "2024-11-05",
                "serverInfo": {"name": "mock-swiggy-mcp", "version": "0.1.0"},
                "capabilities": {"tools": {}},
            },
        )
        return

    if method == "notifications/initialized":
        return

    if method == "tools/list" and message_id is not None:
        success(message_id, {"tools": TOOLS})
        return

    if method == "tools/call" and message_id is not None:
        params = message.get("params") or {}
        handle_tool_call(
            message_id,
            str(params.get("name", "")),
            params.get("arguments") if isinstance(params.get("arguments"), dict) else {},
        )
        return

    error(message_id, -32601, f"Unknown method: {method}")


def main() -> int:
    for line in sys.stdin:
        trimmed = line.strip()
        if not trimmed:
            continue
        try:
            handle_message(json.loads(trimmed))
        except json.JSONDecodeError:
            error(None, -32700, "Invalid JSON")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
