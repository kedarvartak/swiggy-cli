import type { McpClient } from "./mcp-client.js";
import { formatJson, formatSection, formatTools } from "./render.js";
import type { ParsedArgs } from "./parser.js";
import type { JsonValue } from "./types.js";
import {
  getWorkflowDefinition,
  getWorkflowDirectory,
  listWorkflowDefinitions,
  validateWorkflowDefinition,
  writeWorkflowDefinition,
} from "./workflows/catalog.js";
import { createWorkflowPlan } from "./workflows/planner.js";
import type { WorkflowDefinition } from "./workflows/types.js";

type CommandHandler = (client: McpClient, args: ParsedArgs) => Promise<string>;
export const localOnlyCommands = new Set<string>([
  "help",
  "workflow:list",
  "workflow:describe",
  "workflow:plan",
  "workflow:write",
]);

/**
 * Reads a required string option from the parsed CLI arguments.
 */
function requireValue(args: ParsedArgs, key: string): string {
  const value = args.options.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required option --${key}.`);
  }
  return value;
}

/**
 * Reads an optional string option from the parsed CLI arguments.
 */
function optionalValue(args: ParsedArgs, key: string): string | undefined {
  const value = args.options.get(key);
  return typeof value === "string" ? value : undefined;
}

/**
 * Reads a boolean flag option from the parsed CLI arguments.
 */
function hasFlag(args: ParsedArgs, key: string): boolean {
  return args.options.get(key) === true;
}

/**
 * Parses a JSON object passed through a command-line option.
 */
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

/**
 * Lists the tools currently advertised by the connected MCP server.
 */
async function listTools(client: McpClient): Promise<string> {
  const tools = await client.listTools();
  return formatSection("Available Tools", formatTools(tools));
}

/**
 * Shows the result of the MCP initialization handshake.
 */
async function status(client: McpClient): Promise<string> {
  const details = await client.initialize();
  return formatSection("MCP Status", formatJson(details));
}

/**
 * Invokes a specific Swiggy MCP tool and formats the result for terminal output.
 */
async function callMappedTool(
  client: McpClient,
  toolName: string,
  args: Record<string, JsonValue>,
): Promise<string> {
  const result = await client.callTool(toolName, args);
  return formatSection(`Tool Result: ${toolName}`, formatJson(result));
}

/**
 * Renders workflow catalog entries into a readable marketplace-style list.
 */
function formatWorkflowCatalog(definitions: WorkflowDefinition[]): string {
  if (definitions.length === 0) {
    return `No workflows found in ${getWorkflowDirectory()}.`;
  }

  return definitions
    .map((definition) =>
      [
        `- ${definition.id}`,
        `  ${definition.title} (${definition.difficulty})`,
        `  ${definition.summary}`,
        `  Tools: ${definition.tools.join(", ")}`,
        `  Tags: ${definition.tags.join(", ")}`,
      ].join("\n"),
    )
    .join("\n\n");
}

/**
 * Renders a single workflow definition for inspection.
 */
function formatWorkflowDefinition(definition: WorkflowDefinition): string {
  const inputs = definition.inputs
    .map(
      (input) =>
        `- ${input.name} (${input.type}${input.required ? ", required" : ", optional"}): ${input.description}`,
    )
    .join("\n");
  const steps = definition.steps
    .map((step) => `- ${step.title} [${step.kind}]${step.toolName ? ` -> ${step.toolName}` : ""}\n  ${step.description}`)
    .join("\n");
  const guarantees = definition.guarantees.map((entry) => `- ${entry}`).join("\n");
  const limitations = definition.limitations.map((entry) => `- ${entry}`).join("\n");

  return [
    `${definition.title}`,
    `${definition.summary}`,
    "",
    `Workflow ID: ${definition.id}`,
    `Version: ${definition.version}`,
    `App: ${definition.app}`,
    `Difficulty: ${definition.difficulty}`,
    `Tags: ${definition.tags.join(", ")}`,
    `Tools: ${definition.tools.join(", ")}`,
    "",
    "Inputs",
    inputs,
    "",
    "Steps",
    steps,
    "",
    "Guarantees",
    guarantees,
    "",
    "Limitations",
    limitations,
  ].join("\n");
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
      "  swiggy workflow:list",
      "  swiggy workflow:describe --workflow swiggy.healthy-meal",
      "  swiggy workflow:plan --workflow swiggy.team-offsite-meal-orchestration --payload '{\"teamName\":\"Launch War Room\",\"headcount\":26,\"deliveryWindow\":\"12:30-13:00\",\"officeLocation\":\"Bellandur\",\"dietaryMatrix\":{\"vegetarian\":8,\"vegan\":2,\"jain\":3,\"highProtein\":6},\"budgetCap\":8500}'",
      "  swiggy workflow:write --payload '{\"id\":\"swiggy.weekday-lunch\",\"title\":\"Weekday Lunch\",\"version\":\"0.1.0\",\"app\":\"swiggy\",\"summary\":\"Picks a quick lunch workflow.\",\"difficulty\":\"advanced\",\"tags\":[\"lunch\"],\"inputs\":[],\"tools\":[\"search_restaurants\"],\"steps\":[{\"id\":\"search\",\"title\":\"Search\",\"kind\":\"tool-call\",\"description\":\"Search restaurants.\",\"toolName\":\"search_restaurants\"}],\"guarantees\":[\"Uses MCP tools only.\"],\"limitations\":[\"Demo manifest.\"]}'",
      "  swiggy restaurants --query \"biryani\" --city bangalore",
      "  swiggy menu --restaurant-id 12345",
      "  swiggy cart:view",
      "  swiggy cart:update --payload '{\"restaurant_id\":\"12345\",\"items\":[{\"id\":\"dish-1\",\"quantity\":2}]}'",
      "  swiggy order:place --payload '{\"payment_mode\":\"cod\"}'",
      "  swiggy order:track --order-id ORDER123",
      "  swiggy raw:call --tool search_restaurants --payload '{\"query\":\"biryani\"}'",
      "",
      "Environment:",
      "  SWIGGY_MCP_COMMAND  Required. Command that starts the Swiggy MCP server.",
      "  SWIGGY_MCP_ARGS     Optional. Space-delimited args for the MCP server command.",
      "  See .env.example for the local MCP configuration.",
    ].join("\n");
  },

  async "workflow:list"() {
    return formatSection("Available Workflows", formatWorkflowCatalog(await listWorkflowDefinitions()));
  },

  async "workflow:describe"(_client, args) {
    const workflowId = requireValue(args, "workflow");
    return formatSection("Workflow Definition", formatWorkflowDefinition(await getWorkflowDefinition(workflowId)));
  },

  async "workflow:plan"(_client, args) {
    const workflowId = requireValue(args, "workflow");
    const payload = parseJsonOption(args, "payload");
    const plan = createWorkflowPlan(await getWorkflowDefinition(workflowId), payload);
    return formatSection("Workflow Plan", formatJson(plan));
  },

  async "workflow:write"(_client, args) {
    const payload = parseJsonOption(args, "payload");
    const definition = validateWorkflowDefinition(payload, "command payload");
    const filePath = await writeWorkflowDefinition(definition, { force: hasFlag(args, "force") });

    return formatSection(
      "Workflow Written",
      [
        `Workflow ID: ${definition.id}`,
        `Path: ${filePath}`,
        `Directory: ${getWorkflowDirectory()}`,
        hasFlag(args, "force")
          ? "Mode: overwrite enabled"
          : "Mode: create only (use --force to overwrite an existing manifest)",
      ].join("\n"),
    );
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

  async "raw:call"(client, args) {
    const toolName = requireValue(args, "tool");
    const payload = parseJsonOption(args, "payload");
    return callMappedTool(client, toolName, payload);
  },
};
