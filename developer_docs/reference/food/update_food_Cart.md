# update_food_cart

Add items to food delivery cart or update cart contents. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to add food items, dishes, or meals to their delivery cart. Swiggy Food delivery. Sup...

Add items to food delivery cart or update cart contents. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to add food items, dishes, or meals to their delivery cart. Swiggy Food delivery. Supports variants, variantsV2, and addons for customizing menu items. CRITICAL: Each menu item uses EITHER "variants" OR "variantsV2" format (check search_menu response) - use the SAME format that the item has, never both fields. IMPORTANT: Addon availability depends on variant selection - some addons are only valid for specific variant combinations. After choosing the variant for an item, check the cart response for valid_addons to see which addons are actually available. NOT for groceries or restaurant reservations.

## Demo

▶

See update_food_cart in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "update_food_cart",

arguments: {

restaurantId: "rest_42",

cartItems: [],

addressId: "addr_01HXYZ",

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| restaurantId | string | yes | Restaurant ID for the cart |
| cartItems | object[] | yes | Array of items to add to cart with their customizations |
| addressId | string | yes | Address ID to get accurate delivery charges based on location. |
| restaurantName | string | no | Restaurant name from search_restaurants or search_menu results. Pass this so the cart widget can display the restaurant name (the cart API does not always return it). |

Session credentials (user identity, access token) are supplied automatically by the authenticated MCP session - you do not pass them in the tool call. See Authenticate.

## Response

All Swiggy MCP tools return:

```json
{

"success": true,

"data": { /* tool-specific payload */ },

"message": "optional human-readable message"

}
```

On failure:

```json
{

"success": false,

"error": { "message": "description of what went wrong" }

}
```

See Error codes for the full catalogue.

## Details

| Field | Value |
| --- | --- |
| Name | update_food_cart |
| MCP Server | Food |
| Endpoint | POST mcp.swiggy.com/food |
| Stage | Cart |
| Behaviour | mutating |

## Agent guidance

How Swiggy agents and orchestration logic use this tool. Surface these expectations in your prompts or tool-selection policies.

NO WIDGET: This tool does NOT render any widget or cart UI. The user CANNOT see the cart after this call. You MUST follow up by calling get_food_cart immediately to show the updated cart to the user. Do NOT say "your cart is shown above" or "cart reflected above" - there is nothing to see until you call get_food_cart.

RESPONSE FORMAT: Keep your text response brief - just confirm what was updated, e.g. "Added 2x Chicken Biryani to your cart." Then immediately call get_food_cart.

COUPON NOTE: The response may include offers.coupon_applied with coupon_discount=0 - this means the coupon is auto-suggested (best available) but NOT actually applied. Do NOT tell the user a coupon is "applied" unless coupon_discount > 0. Only mention savings if there is an actual discount amount.

**IMPORTANT **- QUANTITY CHANGES FOR CUSTOMIZED ITEMS: When user taps +/- or asks to change quantity of an item that has addons or variants: (1) Do NOT silently replicate the same addons for the new quantity. (2) ASK the user: "Would you like the same add-ons (e.g. Extra Raita, Salan) for the additional item, or different ones?" (3) Also briefly mention other available addons they haven't picked yet - e.g. "You can also add Gulab Jamun or Extra Gravy." (4) Only after the user confirms, call update_food_cart with the chosen customization. For items WITHOUT addons/variants, quantity changes can be applied directly without asking.

## Next in this journey →

- Continue with get_food_cart.
