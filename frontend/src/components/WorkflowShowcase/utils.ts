export const workflowCards = [
  {
    title: "Food ordering",
    tools: ["get_addresses", "search_restaurants", "search_menu", "place_food_order"],
    summary:
      "Handle address resolution, restaurant discovery, cart review, payment method awareness, and confirmation before a live order.",
  },
  {
    title: "Instamart runs",
    tools: ["get_addresses", "search_products", "update_cart", "checkout"],
    summary:
      "Build grocery carts with store-aware constraints, multi-store checkout handling, and post-checkout tracking.",
  },
  {
    title: "Dineout reservations",
    tools: ["get_saved_locations", "search_restaurants_dineout", "get_available_slots", "book_table"],
    summary:
      "Move from restaurant discovery to slot-aware reservations with explicit date, time, and party-size confirmation.",
  },
];
