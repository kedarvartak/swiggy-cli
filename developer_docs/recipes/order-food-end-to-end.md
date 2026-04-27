# Order food end-to-end

The canonical 7-tool Food journey - from address to placed order to delivery tracking.

The full food-ordering journey across Swiggy's Food MCP server. COD payment, ₹1000 cart cap. Pseudo-code in TypeScript; the same sequence works in any framework.

## The flow

```text
get_addresses
     │
     ▼
search_restaurants ──► get_restaurant_menu
                            │
                            ▼
                       update_food_cart ◄── fetch_food_coupons
                            │                       │
                            ▼                       │
                       get_food_cart ◄── apply_food_coupon
                            │
                            ▼
                       place_food_order
                            │
                            ▼
                       track_food_order
```

## Step 1 - Resolve the delivery address

```ts
const addresses = await client.callTool({ name: "get_addresses" });
const home = addresses.data.find((a) => a.label === "Home") ?? addresses.data[0];
if (!home) throw new Error("User has no saved addresses; prompt them to add one.");
```

get_addresses returns label, addressId, and display text - never raw coordinates.

## Step 2 - Find restaurants

```ts
const restaurants = await client.callTool({
  name: "search_restaurants",
  arguments: { addressId: home.id, query: "biryani" },
});
```

Check availabilityStatus for each result - only recommend those marked "OPEN". Sort by a mix of distance and rating; always surface distance when picking far restaurants so the user isn't surprised.

## Step 3 - Browse the menu

```ts
const menu = await client.callTool({
  name: "get_restaurant_menu",
  arguments: { restaurantId: restaurants.data.restaurants[0].id },
});
```

Menus have categories, items, variants, and add-ons. Use search_menu for keyword search within (or across) restaurants.

## Step 4 - Build the cart

```ts
await client.callTool({
  name: "update_food_cart",
  arguments: {
    restaurantId: menu.data.restaurantId,
    items: [
      { itemId: menu.data.items[0].id, quantity: 1 },
    ],
  },
});
```

Cart is tied to a single restaurant. Changing restaurant flushes the cart. Use flush_food_cart explicitly when the user starts over.

## Step 5 - Apply a coupon (optional)

```ts
const coupons = await client.callTool({ name: "fetch_food_coupons" });

// v1 supports COD only - filter coupons that don't require online payment
const codCoupon = coupons.data.find((c) => !c.requiresOnlinePayment);

if (codCoupon) {
  await client.callTool({
    name: "apply_food_coupon",
    arguments: { code: codCoupon.code },
  });
}
```

## Step 6 - Confirm and place the order

```ts
const cart = await client.callTool({ name: "get_food_cart" });

// Swiggy v1: hard ₹1000 cap on Builders Club orders
if (cart.data.total > 1000) {
  throw new Error("Cart exceeds ₹1000 cap - ask user to reduce items.");
}

// Surface to the user before placing
// "Your order is: <items>. Total ₹<total>. Place now? (yes / no)"

const order = await client.callTool({
  name: "place_food_order",
  arguments: { paymentMethod: "COD" },
});
```

Critical: place_food_order is not idempotent. If it fails with 5xx, call get_food_orders to check if the order actually placed before retrying. See ship to production.

## Step 7 - Track the order

```ts
const status = await client.callTool({
  name: "track_food_order",
  arguments: { orderId: order.data.orderId },
});

// Poll no faster than every 10 seconds; delivery-partner ETA updates arrive at that cadence
```

## Full agent prompt

Good system prompt for the agent driving this flow:

You help users order food on Swiggy. Always resolve the user's saved address via get_addresses before searching. Only recommend restaurants with availabilityStatus: "OPEN". Confirm the cart and total with the user before calling place_food_order - that call places a real order. Only COD is supported in v1; filter coupons to those not requiring online payment. Never exceed ₹1000 cart total.

## What can go wrong

Until the symbolic error-code registry ships (see errors), classify by error.message text and HTTP status. Expect:

Restaurant closed between search and order → re-run search_restaurants.

Coupon requires online payment → filter upstream; only COD is supported in v1.

Minimum order not met → prompt user to add items.

Upstream shedding / timeout → exponential backoff; capacity questions go to rate-limits.
