import { getPlatformProfile } from "./platforms.js";
import type { GroupOrderPlan, GroupOrderRequest, WorkflowStep } from "./types.js";

/**
 * Builds the shared workflow that turns a collaboration request into a Swiggy ordering flow.
 */
function buildWorkflow(platformName: "slack" | "teams"): WorkflowStep[] {
  const platformAction =
    platformName === "slack"
      ? "Open a channel post and collect submissions through Slack blocks and direct-message reminders."
      : "Open a channel post and collect submissions through Teams adaptive cards and follow-up messages.";

  return [
    {
      id: "announce-order-window",
      title: "Open collection window",
      owner: "platform",
      description: platformAction,
    },
    {
      id: "normalize-preferences",
      title: "Normalize team preferences",
      owner: "orchestrator",
      description: "Merge dietary notes, budgets, cuisine preferences, and missing responses into a single request set.",
    },
    {
      id: "search-restaurants",
      title: "Search candidate restaurants",
      owner: "swiggy-mcp",
      description: "Call `search_restaurants` using the group query, city, and office area constraints.",
    },
    {
      id: "review-menu",
      title: "Review menu options",
      owner: "swiggy-mcp",
      description: "Call `get_restaurant_menu` for shortlisted restaurants and map menu items against team needs.",
    },
    {
      id: "build-cart",
      title: "Construct a consolidated cart",
      owner: "swiggy-mcp",
      description: "Call `update_food_cart` with the optimized final basket for the team.",
    },
    {
      id: "confirm-order",
      title: "Share final confirmation",
      owner: "platform",
      description: "Present the final cart summary, price split assumptions, and delivery estimate for approval.",
    },
    {
      id: "place-order",
      title: "Place and monitor the order",
      owner: "swiggy-mcp",
      description: "Call `place_food_order`, then `track_food_order`, and broadcast updates back to the collaboration platform.",
    },
  ];
}

/**
 * Produces a platform-aware Group Ordering plan from a single business request.
 */
export function createGroupOrderPlan(request: GroupOrderRequest): GroupOrderPlan {
  const platform = getPlatformProfile(request.platform);

  return {
    request,
    platform,
    workflow: buildWorkflow(request.platform),
    swiggyToolSequence: [
      "search_restaurants",
      "get_restaurant_menu",
      "update_food_cart",
      "get_food_cart",
      "place_food_order",
      "track_food_order",
    ],
    outputContract: {
      team_name: request.teamName,
      organizer: request.organizer,
      participant_count: request.participants.length,
      platform: request.platform,
      restaurant_query: request.restaurantQuery,
      city: request.city ?? null,
      office_location: request.officeLocation ?? null,
      delivery_window: request.deliveryWindow ?? null,
    },
  };
}
