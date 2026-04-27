# Widgets

Render-ready UI fragments that Swiggy MCP servers can return alongside tool responses.

Not every AI client wants to render restaurant cards, menu items, and carts from scratch. Widgets let Swiggy ship pre-built UI fragments the client can embed directly.

The widget iframe/postMessage contract described below is the designed surface - the Food server flags hasWidgets: true and the internal registry is in place, but the public https://mcp.swiggy.com/widgets/... iframe URLs, the X-Swiggy-Widgets opt-in header, and the ?theme= query param are not live in v1.0. If you're prototyping a chat client today, wire the integration per this contract and expect widgets to populate once the hosting layer ships. The data envelope carries everything semantically needed even without widgets.

## What a widget is

An iframe-embeddable HTML document returned alongside the tool response:

```json
{
  "success": true,
  "data": { /* normal tool payload */ },
  "widgets": [
    {
      "id": "food-restaurant-card-abc",
      "type": "restaurant-card",
      "src": "https://mcp.swiggy.com/widgets/food/restaurant-card?id=res_123"
    }
  ]
}
```

Your client renders each widget in an iframe sized to the widget type. A postMessage bridge lets the widget send events back ("user clicked add-to-cart", "user bumped quantity", etc).

## Availability

| Server | v1.0 | Planned |
| --- | --- | --- |
| Food | Registry flagged hasWidgets: true; hosted iframe layer in progress | restaurant-card, menu-item, cart-widget GA |
| Instamart | - | product-card, cart-widget |
| Dineout | - | restaurant-card, slot-picker |

If you use voice or TTS surfaces, widgets are useless - stick to text responses. Widgets are for chat surfaces (Claude, ChatGPT, Cursor, custom web chat).

## Opt-in (planned)

Once the hosting layer ships, the opt-in will be the header X-Swiggy-Widgets: enabled on your tool calls. Without it, responses will omit the widgets array. Not wired in v1.0.

## Food widgets (planned)

### restaurant-card

Returned alongside: search_restaurants, get_restaurant_menu

| Field | Value |
| --- | --- |
| Purpose | Single restaurant with photo, rating, delivery time, "View menu" CTA |
| Iframe size | width: 100%; max-width: 420px; height: 180px |
| postMessage events | restaurant-card.clicked, restaurant-card.menu-requested |

### menu-item

Returned alongside: get_restaurant_menu, search_menu

| Field | Value |
| --- | --- |
| Purpose | Single menu item with photo, description, price, variant picker, "Add to cart" CTA |
| Iframe size | width: 100%; max-width: 420px; height: 240px |
| postMessage events | menu-item.add-to-cart with { itemId, variantId, addOns[] } |

### cart-widget

Returned alongside: get_food_cart, update_food_cart

| Field | Value |
| --- | --- |
| Purpose | Current cart: items, subtotal, delivery fee, total, "Checkout" CTA |
| Iframe size | width: 100%; max-width: 480px; height: 320px |
| postMessage events | cart.item-removed, cart.quantity-changed, cart.checkout-requested |

## Embedding pattern

```tsx
function SwiggyWidget({ widget }: { widget: Widget }) {
  return (
    <iframe
      src={widget.src}
      title={`Swiggy ${widget.type}`}
      sandbox="allow-scripts allow-same-origin allow-popups"
      style={{
        width: "100%",
        maxWidth: sizeFor(widget.type).maxWidth,
        height: sizeFor(widget.type).height,
        border: 0,
        borderRadius: 12,
      }}
    />
  );
}
```

## postMessage bridge

```tsx
useEffect(() => {
  function onMessage(e: MessageEvent) {
    // Security: only accept messages from Swiggy's widget origin
    if (e.origin !== "https://mcp.swiggy.com") return;

    const msg = e.data;
    if (msg?.type === "menu-item.add-to-cart") {
      // Either call update_food_cart via MCP, or just update local UI state
      handleAddToCart(msg.itemId, msg.variantId, msg.addOns);
    }
  }
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}, []);
```

Always verify e.origin. Messages from any other origin should be ignored - that's how you avoid a whole class of UI spoofing.

## Security

Sandbox the iframe with allow-scripts allow-same-origin allow-popups. Do not grant allow-top-navigation - widgets should never redirect the parent page.

Parent page must be HTTPS. Widgets refuse to load in mixed-content contexts.

The postMessage bridge is the only channel between widget and your client. No DOM crossing.

## Theming

All widgets honour ?theme=dark|light. Default: light.

```html
<iframe src="https://mcp.swiggy.com/widgets/food/restaurant-card?id=res_123&theme=dark" />
```

Custom brand theming (your palette, not Swiggy's) is planned for v1.1.

## Accessibility

Widgets set internal ARIA labels; your wrapper should set a meaningful title attribute on the iframe (announced by screen readers).

All widgets support keyboard navigation (Tab / Enter).
