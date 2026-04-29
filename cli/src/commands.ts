import type { BackendClient } from "./backend-client.js";
import { formatJson, formatSection, formatTools } from "./render.js";
import type { ParsedArgs } from "./parser.js";
import type { JsonValue } from "./types.js";
import type { WorkflowDefinition } from "./workflows/types.js";

type CommandHandler = (client: BackendClient, args: ParsedArgs) => Promise<string>;
type ToolCommandDefinition = {
  command: string;
  toolName: string;
  summary: string;
};

export const localOnlyCommands = new Set<string>([
  "help",
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
async function listTools(client: BackendClient): Promise<string> {
  const tools = await client.listTools();
  return formatSection("Available Tools", formatTools(tools));
}

/**
 * Shows the result of the MCP initialization handshake.
 */
async function status(client: BackendClient): Promise<string> {
  const details = await client.status();
  return formatSection("MCP Status", formatJson(details));
}

/**
 * Invokes a specific Swiggy MCP tool and formats the result for terminal output.
 */
async function callMappedTool(
  client: BackendClient,
  toolName: string,
  args: Record<string, JsonValue>,
): Promise<string> {
  const result = await client.callTool(toolName, args);
  return formatSection(`Tool Result: ${toolName}`, formatJson(result));
}

const foodToolCommands: ToolCommandDefinition[] = [
  {
    command: "food:get-addresses",
    toolName: "get_addresses",
    summary: "List saved delivery addresses for Food/Instamart flows.",
  },
  {
    command: "food:search-restaurants",
    toolName: "search_restaurants",
    summary: "Search Food delivery restaurants using addressId and query.",
  },
  {
    command: "food:get-restaurant-menu",
    toolName: "get_restaurant_menu",
    summary: "Browse a restaurant menu by restaurantId and addressId.",
  },
  {
    command: "food:search-menu",
    toolName: "search_menu",
    summary: "Search dishes/menu items by query and addressId.",
  },
  {
    command: "food:update-cart",
    toolName: "update_food_cart",
    summary: "Add or update Food cart items.",
  },
  {
    command: "food:get-cart",
    toolName: "get_food_cart",
    summary: "Read the current Food cart and available payment methods.",
  },
  {
    command: "food:flush-cart",
    toolName: "flush_food_cart",
    summary: "Clear the entire Food cart.",
  },
  {
    command: "food:fetch-coupons",
    toolName: "fetch_food_coupons",
    summary: "Fetch Food coupons/offers for a restaurant and address.",
  },
  {
    command: "food:apply-coupon",
    toolName: "apply_food_coupon",
    summary: "Apply a Food coupon code to the current cart.",
  },
  {
    command: "food:place-order",
    toolName: "place_food_order",
    summary: "Place a Food order using addressId and optional paymentMethod.",
  },
  {
    command: "food:get-orders",
    toolName: "get_food_orders",
    summary: "Get active Food delivery orders for an address.",
  },
  {
    command: "food:track-order",
    toolName: "track_food_order",
    summary: "Track a Food order by orderId or fetch all active tracked orders.",
  },
  {
    command: "food:get-order-details",
    toolName: "get_food_order_details",
    summary: "Get detailed information about a specific Food order.",
  },
  {
    command: "food:report-error",
    toolName: "report_error",
    summary: "Report a Food-domain tool failure to Swiggy MCP support.",
  },
];

/**
 * Renders workflow catalog entries into a readable marketplace-style list.
 */
function formatWorkflowCatalog(definitions: WorkflowDefinition[]): string {
  if (definitions.length === 0) {
    return "No workflows found in the shared workflow catalog.";
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
    const foodUsage = foodToolCommands
      .map((entry) => `  swiggy ${entry.command} --payload '{...}'\n    ${entry.summary}`)
      .join("\n");

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
      "  swiggy raw:call --tool search_restaurants --payload '{\"query\":\"biryani\"}'",
      "",
      "Food Commands:",
      foodUsage,
      "",
      "Examples:",
      "  swiggy food:get-addresses",
      "  swiggy food:search-restaurants --payload '{\"addressId\":\"addr_01HXYZ\",\"query\":\"biryani\"}'",
      "  swiggy food:get-restaurant-menu --payload '{\"addressId\":\"addr_01HXYZ\",\"restaurantId\":\"rest_42\"}'",
      "  swiggy food:update-cart --payload '{\"addressId\":\"addr_01HXYZ\",\"restaurantId\":\"rest_42\",\"cartItems\":[]}'",
      "  swiggy food:place-order --payload '{\"addressId\":\"addr_01HXYZ\"}'",
      "  swiggy food:track-order --payload '{\"orderId\":\"ord_42\"}'",
      "",
      "Environment:",
      "  SWIGGY_BACKEND_URL  Optional. Backend base URL. Defaults to http://127.0.0.1:8000.",
      "  The backend owns MCP connectivity and shared workflow logic.",
    ].join("\n");
  },

  async "workflow:list"(client) {
    return formatSection(
      "Available Workflows",
      formatWorkflowCatalog(await client.listWorkflowDefinitions()),
    );
  },

  async "workflow:describe"(client, args) {
    const workflowId = requireValue(args, "workflow");
    return formatSection(
      "Workflow Definition",
      formatWorkflowDefinition(await client.getWorkflowDefinition(workflowId)),
    );
  },

  async "workflow:plan"(client, args) {
    const workflowId = requireValue(args, "workflow");
    const payload = parseJsonOption(args, "payload");
    const plan = await client.createWorkflowPlan(workflowId, payload);
    return formatSection("Workflow Plan", formatJson(plan));
  },

  async "workflow:write"(client, args) {
    const payload = parseJsonOption(args, "payload");
    const definition = payload as WorkflowDefinition;
    const result = await client.writeWorkflowDefinition(definition, { force: hasFlag(args, "force") });

    return formatSection(
      "Workflow Written",
      [
        `Workflow ID: ${result.workflowId}`,
        `Path: ${result.path}`,
        "Directory: shared repo-level workflows/",
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

  async "raw:call"(client, args) {
    const toolName = requireValue(args, "tool");
    const payload = parseJsonOption(args, "payload");
    return callMappedTool(client, toolName, payload);
  },
};

for (const entry of foodToolCommands) {
  commandHandlers[entry.command] = async (client, args) =>
    callMappedTool(client, entry.toolName, parseJsonOption(args, "payload"));
}
