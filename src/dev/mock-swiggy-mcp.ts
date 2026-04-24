#!/usr/bin/env node

import process from "node:process";
import { createInterface } from "node:readline";
import type { JsonValue, ToolDescriptor } from "../types.js";

type JsonRpcInbound = {
  jsonrpc?: string;
  id?: number | null;
  method?: string;
  params?: Record<string, JsonValue>;
};

const tools: ToolDescriptor[] = [
  {
    name: "search_restaurants",
    description: "Search restaurants by free-text query and optional city.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        city: { type: "string" },
      },
    },
  },
  {
    name: "get_restaurant_menu",
    description: "Return a sample menu for a restaurant.",
    inputSchema: {
      type: "object",
      properties: {
        restaurant_id: { type: "string" },
      },
      required: ["restaurant_id"],
    },
  },
  {
    name: "update_food_cart",
    description: "Update the sample food cart.",
    inputSchema: { type: "object" },
  },
  {
    name: "get_food_cart",
    description: "Return the sample cart.",
    inputSchema: { type: "object" },
  },
  {
    name: "place_food_order",
    description: "Place a sample order.",
    inputSchema: { type: "object" },
  },
  {
    name: "track_food_order",
    description: "Track a sample order.",
    inputSchema: {
      type: "object",
      properties: {
        order_id: { type: "string" },
      },
    },
  },
];

const cart: Record<string, JsonValue> = {
  restaurant_id: "demo-restaurant",
  items: [],
};

/**
 * Sends a JSON-RPC message to stdout.
 */
function send(message: unknown): void {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

/**
 * Sends a JSON-RPC success response.
 */
function success(id: number, result: unknown): void {
  send({
    jsonrpc: "2.0",
    id,
    result,
  });
}

/**
 * Sends a JSON-RPC error response.
 */
function error(id: number | null, code: number, message: string): void {
  send({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
    } as JsonValue,
  });
}

/**
 * Handles a tool invocation against the in-memory mock store.
 */
function handleToolCall(id: number, name: string, args: Record<string, JsonValue>): void {
  if (name === "search_restaurants") {
    success(id, {
      structuredContent: {
        restaurants: [
          {
            id: "rest-101",
            name: `Demo Kitchen for ${String(args.query ?? "all cuisines")}`,
            city: String(args.city ?? "unknown"),
            cuisines: ["North Indian", "Biryani"],
          },
        ],
      },
    });
    return;
  }

  if (name === "get_restaurant_menu") {
    success(id, {
      structuredContent: {
        restaurant_id: String(args.restaurant_id ?? ""),
        items: [
          { id: "dish-1", name: "Classic Biryani", price: 249 },
          { id: "dish-2", name: "Paneer Bowl", price: 199 },
        ],
      },
    });
    return;
  }

  if (name === "update_food_cart") {
    Object.assign(cart, args);
    success(id, { structuredContent: cart });
    return;
  }

  if (name === "get_food_cart") {
    success(id, { structuredContent: cart });
    return;
  }

  if (name === "place_food_order") {
    success(id, {
      structuredContent: {
        order_id: "order-demo-1001",
        status: "PLACED",
        payment_mode: String(args.payment_mode ?? "unknown"),
      },
    });
    return;
  }

  if (name === "track_food_order") {
    success(id, {
      structuredContent: {
        order_id: String(args.order_id ?? "order-demo-1001"),
        status: "OUT_FOR_DELIVERY",
        eta_minutes: 18,
      },
    });
    return;
  }

  error(id, -32601, `Unknown tool: ${name}`);
}

/**
 * Routes inbound JSON-RPC requests to the mock MCP handlers.
 */
function handleMessage(message: JsonRpcInbound): void {
  const method = message.method;
  const id = typeof message.id === "number" ? message.id : null;

  if (method === "initialize" && id !== null) {
    success(id, {
      protocolVersion: "2024-11-05",
      serverInfo: { name: "mock-swiggy-mcp", version: "0.1.0" },
      capabilities: { tools: {} },
    });
    return;
  }

  if (method === "notifications/initialized") {
    return;
  }

  if (method === "tools/list" && id !== null) {
    success(id, { tools });
    return;
  }

  if (method === "tools/call" && id !== null) {
    const params = message.params ?? {};
    handleToolCall(
      id,
      String(params.name ?? ""),
      (params.arguments as Record<string, JsonValue> | undefined) ?? {},
    );
    return;
  }

  error(id, -32601, `Unknown method: ${String(method)}`);
}

const reader = createInterface({ input: process.stdin });
reader.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) {
    return;
  }

  try {
    handleMessage(JSON.parse(trimmed) as JsonRpcInbound);
  } catch {
    error(null, -32700, "Invalid JSON");
  }
});
