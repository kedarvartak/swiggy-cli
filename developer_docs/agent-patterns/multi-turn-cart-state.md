# Multi-turn cart state

Carrying cart identity across user turns on a stateless protocol.

Swiggy's cart state lives server-side, keyed to the authenticated session. Tools like update_food_cart and update_cart mutate that server-side cart; subsequent get_food_cart / get_cart calls see the mutation.

That means: your agent doesn't need to carry cart IDs or contents between turns. Just call get_*_cart at the top of any turn that might touch the cart, and you'll see the truth.

## Pattern: refresh at turn boundary

```ts
// Every turn that might involve cart state, start with:
const cart = await client.callTool({ name: "get_food_cart" });

// Decide next step based on what's actually in the cart server-side,
// NOT based on what you remember from the last turn
```

This avoids drift between "what the agent thinks is in the cart" and "what Swiggy actually has".

## Pattern: confirm before mutating

Because the cart is shared state, mutating it in a multi-turn conversation requires care:

```text
Turn 1:  User: "Add chicken biryani"
         Agent: [update_food_cart(add biryani)]
                "Added 1 chicken biryani (₹349). Anything else?"

Turn 2:  User: "Make it 2"
         Agent: [get_food_cart → sees 1 biryani]
                [update_food_cart(set biryani quantity to 2)]
                "Now 2 biryanis (₹698). Anything else?"

Turn 3:  User: "Actually, place the order"
         Agent: [get_food_cart → confirms current state]
                "Order: 2 chicken biryanis, total ₹698, COD. Place now?"
```

Call get_food_cart before place_food_order regardless of how confident you are - the user may have edited in the Swiggy app between turns.

## Restaurant switch (Food)

A Food cart binds to one restaurant. If the user asks for something from a different restaurant, the cart flushes automatically. Surface this:

```text
User:  "Add butter chicken from Punjab Grill"
Agent: [currently 2 biryanis from Biryani House in cart]
       "That will clear your Biryani House cart (2 chicken biryanis,
        ₹698). Continue?"
```

If you don't warn, the user loses work silently - bad for trust.

## Address switch (Instamart)

An Instamart cart binds to the delivery address (different addresses may have different serviceability and stock). Changing address mid-cart risks serviceability and stock failures on the new address.

Safer pattern: clear_cart before switching address.

## Across server boundaries

If your agent uses Food + Instamart + Dineout in one session:

- Carts are per-server, not shared. A Food cart doesn't affect an Instamart cart.
- Authentication is shared. One OAuth token works across all three servers.
- Orders are per-server. get_food_orders won't show Instamart orders.

## Abandoned carts

Carts have a TTL. If the user walks away mid-conversation and returns later, a stale cart may return CART_EXPIRED. Re-fetch, rebuild if necessary, confirm with the user before re-placing items.

## Don't cache cart state in your agent's memory

Tempting optimization: "I'll just remember what I added so I don't have to re-fetch". Don't. The authoritative copy is server-side, and:

- The user may edit in the Swiggy app.
- Items may go out of stock between turns.
- Prices may change.
- Coupons may become invalid.

get_*_cart is cheap (milliseconds). Always read before you mutate or confirm.
