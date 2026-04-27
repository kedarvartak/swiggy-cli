# Order groceries end-to-end

Full Instamart journey - find products, build a cart, checkout, track delivery.

Instamart is Swiggy's quick-commerce grocery service across 1000+ Indian cities. Same shape as Food (discover → cart → order → track), different catalogue.

## The flow

```text
get_addresses
     │
     ▼
search_products ──► update_cart ──► get_cart ──► checkout ──► track_order
     ▲                  │
     └──────────────────┘
     your_go_to_items (bypass search)
```

## Step 1 - Resolve the delivery address

```ts
const addresses = await client.callTool({ name: "get_addresses" });
const home = addresses.data.find((a) => a.label === "Home") ?? addresses.data[0];
```

If the user has no addresses, walk them through create_address.

## Step 2 - Find products (or reorder)

Two paths. For quick reorders:

```ts
const goTo = await client.callTool({
  name: "your_go_to_items",
  arguments: { addressId: home.id },
});
// goTo.data has frequently-ordered SKUs - present as one-tap add
```

For search:

```ts
const results = await client.callTool({
  name: "search_products",
  arguments: { addressId: home.id, query: "bananas" },
});
```

Each product returns one or more variants with their own spinId (the SKU-level identifier). You add variants to the cart, not the parent product.

## Step 3 - Build the cart

```ts
await client.callTool({
  name: "update_cart",
  arguments: {
    items: [
      { spinId: results.data.products[0].variants[0].spinId, quantity: 2 },
    ],
  },
});
```

Swapping address mid-cart? Don't. Run clear_cart first to avoid cross-address SKU mismatches.

## Step 4 - Review the cart

```ts
const cart = await client.callTool({ name: "get_cart" });
// cart.data has items[], bill breakdown, payment methods available
```

Check ADDRESS_NOT_SERVICEABLE or MIN_ORDER_NOT_MET errors; Instamart has a ₹99 minimum and service-area restrictions.

## Step 5 - Checkout

```ts
const order = await client.callTool({
  name: "checkout",
  arguments: { paymentMethod: "COD" },
});
```

Same non-idempotency rule as Food: if checkout 5xxs, check get_orders before retrying.

## Step 6 - Track

```ts
const status = await client.callTool({
  name: "track_order",
  arguments: { orderId: order.data.orderId },
});
// ETA typically 10-20 min post-checkout
```

Poll no faster than every 10s.

## Agent prompt

You help users shop on Swiggy Instamart. Start by resolving the user's saved address. Offer your_go_to_items for quick reorders; use search_products for new queries. Always confirm the cart and total before checkout. COD-only in v1.

## Common errors

Until the symbolic error.code registry ships (see errors), classify by error.message text. Expect:

Item out of stock at this address → suggest alternatives from search_products.

Address not serviceable → Instamart doesn't deliver here; ask for another address or offer Food.

Minimum order not met (cart under ₹99) → prompt user to add items.

Cart expired / abandoned → rebuild the cart.

← Previous
Order food end-to-end
