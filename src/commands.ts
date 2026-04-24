import type { McpClient } from "./mcp-client.js";
import { getGroupOrderingIntegrationStatus } from "./group-ordering/config.js";
import { createPlatformLaunchPreview } from "./group-ordering/adapters.js";
import { createGroupOrderPlan } from "./group-ordering/planner.js";
import { platformProfiles } from "./group-ordering/platforms.js";
import type { GroupOrderRequest, PlatformProfile } from "./group-ordering/types.js";
import { formatJson, formatSection, formatTools } from "./render.js";
import type { ParsedArgs } from "./parser.js";
import type { JsonValue } from "./types.js";

type CommandHandler = (client: McpClient, args: ParsedArgs) => Promise<string>;
export const localOnlyCommands = new Set<string>([
  "help",
  "group-ordering:capabilities",
  "group-ordering:integration-status",
  "group-ordering:plan",
  "group-ordering:preview",
]);

function requireValue(args: ParsedArgs, key: string): string {
  const value = args.options.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required option --${key}.`);
  }
  return value;
}

function optionalValue(args: ParsedArgs, key: string): string | undefined {
  const value = args.options.get(key);
  return typeof value === "string" ? value : undefined;
}

function parseJsonOption(args: ParsedArgs, key: string): Record<string, JsonValue> {
  const raw = optionalValue(args, key);
  if (!raw) {
    return {};
  }

  const parsed = JSON.parse(raw) as JsonValue;
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(`Option --${key} must be a JSON object.`);
  }

  return parsed as Record<string, JsonValue>;
}

async function listTools(client: McpClient): Promise<string> {
  const tools = await client.listTools();
  return formatSection("Available Tools", formatTools(tools));
}

async function status(client: McpClient): Promise<string> {
  const details = await client.initialize();
  return formatSection("MCP Status", formatJson(details));
}

async function callMappedTool(
  client: McpClient,
  toolName: string,
  args: Record<string, JsonValue>,
): Promise<string> {
  const result = await client.callTool(toolName, args);
  return formatSection(`Tool Result: ${toolName}`, formatJson(result));
}

function formatCapabilityProfile(profile: PlatformProfile): string {
  const strengths = profile.strengths.map((entry) => `- ${entry}`).join("\n");
  const capabilities = profile.capabilities
    .map((item) => `- ${item.title}: ${item.supported ? "Supported" : "Limited"}\n  ${item.description}`)
    .join("\n");

  return [
    profile.displayName,
    profile.summary,
    "",
    "Strengths",
    strengths,
    "",
    "Capabilities",
    capabilities,
  ].join("\n");
}

function parseGroupOrderRequest(args: ParsedArgs): GroupOrderRequest {
  const payload = parseJsonOption(args, "payload");
  const request = payload as unknown as GroupOrderRequest;

  if (!request || typeof request !== "object") {
    throw new Error("Option --payload must describe a group order request.");
  }

  if (request.platform !== "slack" && request.platform !== "teams") {
    throw new Error("Group order payload must include `platform` set to `slack` or `teams`.");
  }

  if (!request.teamName || !request.organizer || !request.restaurantQuery) {
    throw new Error("Group order payload must include `teamName`, `organizer`, and `restaurantQuery`.");
  }

  if (!Array.isArray(request.participants)) {
    throw new Error("Group order payload must include a `participants` array.");
  }

  return request;
}

export const commandHandlers: Record<string, CommandHandler> = {
  async help() {
    return [
      "Swiggy CLI",
      "",
      "Usage:",
      "  swiggy help",
      "  swiggy status",
      "  swiggy tools",
      "  swiggy restaurants --query \"biryani\" --city bangalore",
      "  swiggy menu --restaurant-id 12345",
      "  swiggy cart:view",
      "  swiggy cart:update --payload '{\"restaurant_id\":\"12345\",\"items\":[{\"id\":\"dish-1\",\"quantity\":2}]}'",
      "  swiggy order:place --payload '{\"payment_mode\":\"cod\"}'",
      "  swiggy order:track --order-id ORDER123",
      "  swiggy group-ordering:capabilities",
      "  swiggy group-ordering:integration-status",
      "  swiggy group-ordering:plan --payload '{\"teamName\":\"Product\",\"organizer\":\"kedar\",\"platform\":\"slack\",\"restaurantQuery\":\"biryani\",\"participants\":[{\"userId\":\"u1\",\"displayName\":\"Asha\"}]}'",
      "  swiggy group-ordering:preview --payload '{\"teamName\":\"Product\",\"organizer\":\"kedar\",\"platform\":\"teams\",\"restaurantQuery\":\"biryani\",\"participants\":[{\"userId\":\"u1\",\"displayName\":\"Asha\"}]}'",
      "  swiggy raw:call --tool search_restaurants --payload '{\"query\":\"biryani\"}'",
      "",
      "Environment:",
      "  SWIGGY_MCP_COMMAND  Required. Command that starts the Swiggy MCP server.",
      "  SWIGGY_MCP_ARGS     Optional. Space-delimited args for the MCP server command.",
      "  See .env.example for Slack and Teams group-ordering integration settings.",
    ].join("\n");
  },

  async status(client) {
    return status(client);
  },

  async tools(client) {
    return listTools(client);
  },

  async restaurants(client, args) {
    const payload = parseJsonOption(args, "payload");
    const query = optionalValue(args, "query");
    const city = optionalValue(args, "city");
    if (query) {
      payload.query = query;
    }
    if (city) {
      payload.city = city;
    }
    return callMappedTool(client, "search_restaurants", payload);
  },

  async menu(client, args) {
    const payload = parseJsonOption(args, "payload");
    const restaurantId = requireValue(args, "restaurant-id");
    payload.restaurant_id = restaurantId;
    return callMappedTool(client, "get_restaurant_menu", payload);
  },

  async "cart:view"(client, args) {
    const payload = parseJsonOption(args, "payload");
    return callMappedTool(client, "get_food_cart", payload);
  },

  async "cart:update"(client, args) {
    const payload = parseJsonOption(args, "payload");
    return callMappedTool(client, "update_food_cart", payload);
  },

  async "order:place"(client, args) {
    const payload = parseJsonOption(args, "payload");
    return callMappedTool(client, "place_food_order", payload);
  },

  async "order:track"(client, args) {
    const payload = parseJsonOption(args, "payload");
    const orderId = optionalValue(args, "order-id");
    if (orderId) {
      payload.order_id = orderId;
    }
    return callMappedTool(client, "track_food_order", payload);
  },

  async "group-ordering:capabilities"() {
    return [
      formatSection("Slack", formatCapabilityProfile(platformProfiles.slack)),
      "",
      formatSection("Microsoft Teams", formatCapabilityProfile(platformProfiles.teams)),
    ].join("\n");
  },

  async "group-ordering:integration-status"() {
    return formatSection("Group Ordering Integration Status", formatJson(getGroupOrderingIntegrationStatus()));
  },

  async "group-ordering:plan"(_client, args) {
    const plan = createGroupOrderPlan(parseGroupOrderRequest(args));
    return formatSection("Group Ordering Plan", formatJson(plan));
  },

  async "group-ordering:preview"(_client, args) {
    const preview = createPlatformLaunchPreview(parseGroupOrderRequest(args));
    return formatSection("Group Ordering Platform Preview", formatJson(preview));
  },

  async "raw:call"(client, args) {
    const toolName = requireValue(args, "tool");
    const payload = parseJsonOption(args, "payload");
    return callMappedTool(client, toolName, payload);
  },
};
