# Plan my evening (combined)

One user ask, two MCP servers - Food delivery and Dineout reservations composed in a single agent turn.

A fun showcase of MCP's tool-composition strength: the user says "plan my evening for 4 - dinner out, dessert delivered later", and your agent fans out across two Swiggy servers.

## The ask

"Plan my evening for Friday. I want dinner out with 3 friends around 8pm, something Italian in Indiranagar. Then order dessert to my place for 10pm."

This requires both Dineout (for the reservation) and Food (for the delivery). Both servers share the underlying Swiggy session - one OAuth, two MCP URLs.

## Connect both servers

Most frameworks allow multiple MCP servers side-by-side. Example with OpenAI Agents SDK:

```ts
const dineout = new MCPServerStreamableHttp({
  url: "https://mcp.swiggy.com/dineout",
  requestInit: { headers: { Authorization: `Bearer ${token}` } },
});
const food = new MCPServerStreamableHttp({
  url: "https://mcp.swiggy.com/food",
  requestInit: { headers: { Authorization: `Bearer ${token}` } },
});

const agent = new Agent({
  name: "EveningPlanner",
  instructions: "Plan the user's evening using both servers.",
  mcpServers: [dineout, food],
});
```

Tool names don't collide - search_restaurants (Food) and search_restaurants_dineout are distinct.

## What the agent does

Internally, the model orchestrates the two flows in parallel:

```text
                  ┌──────────────────────────┐
                  │  User: Plan my evening    │
                  └─────────────┬─────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
   get_saved_locations                  get_addresses (Food)
              │                                   │
              ▼                                   │
   search_restaurants_dineout                     │
      (query="italian",                           │
       lat/lng of saved home)                     │
              │                                   │
              ▼                                   │
   get_restaurant_details                         │
              │                                   │
              ▼                                   │
   get_available_slots                            │
      (date=Friday, guestCount=4)                 │
              │                                   │
              ▼                                   │
   book_table                          (later, after dinner recommendation)
                                                  │
                                                  ▼
                                        search_restaurants
                                           (query="gelato",
                                            addressId=home)
                                                  │
                                                  ▼
                                        get_restaurant_menu
                                                  │
                                                  ▼
                                        update_food_cart
                                                  │
                                                  ▼
                                        place_food_order (scheduled 10pm)
```

## Agent prompt for this pattern

You compose Swiggy Dineout and Swiggy Food tools to plan user evenings. When the user asks for a restaurant reservation AND food delivery in one request, handle them sequentially: reservation first (so they see slot options early), then dessert/delivery second. Always confirm reservation details and food cart separately before calling book_table and place_food_order.

## Handle auth expiry across both servers

If one server returns 401, your session is gone for both. Re-run the OAuth flow once, update the bearer for both clients, retry.

## Gotchas

Scheduling: place_food_order places orders for immediate delivery. Swiggy Food doesn't support future-scheduled delivery in v1 - if the user wants dessert at 10pm exactly, your agent needs to remind them / place the order at the right time.

Address vs location: Dineout uses lat/lng for "near me"; Food uses addressId. They're different scopes. Don't try to pass an addressId to Dineout search.

Cart conflicts: Food cart is per-restaurant. If your agent adds to cart, then searches a different restaurant, the cart will be flushed. Surface that explicitly.
