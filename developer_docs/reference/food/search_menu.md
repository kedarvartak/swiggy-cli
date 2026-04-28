# search_menu

Search for dishes and menu items to order for food delivery. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to find specific dishes, browse menu items, see what a restaurant offers, or orde...

Search for dishes and menu items to order for food delivery. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to find specific dishes, browse menu items, see what a restaurant offers, or order food. Swiggy Food delivery. Returns items with their customizations. The text response includes variant/addon IDs that you need for update_food_cart calls. IMPORTANT: Each item has EITHER "variations" (legacy format) OR "variantsV2" (new format), never both - check which field exists and use the corresponding field when adding to cart. The addons shown are ALL possible addons for the item, but some addons are only valid for specific variant selections. When adding items to cart with customizations: (1) Add item with variants first using the SAME format (variations or variantsV2) as returned, (2) Check cart response for valid_addons to see which addons are actually available for your variant selection, (3) Then add addons from valid_addons list. Optionally scope with restaurantIdOfAddedItem. NOT for groceries or restaurant reservations.

## Demo

▶

See search_menu in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "search_menu",

arguments: {

addressId: "addr_01HXYZ",

query: "biryani",

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| addressId | string | yes | Address ID from get_addresses tool |
| query | string | yes | Search query (dish name) |
| restaurantIdOfAddedItem | string | no | Optional restaurant ID to scope search |
| vegFilter | number | no | Veg filter flag (0 or 1). Pass 1 for veg-only items. 0 or omitted returns mixed veg + non-veg. There is NO non-veg-only filter - if user asks for "non-veg only", pass 0 (mixed) and mention in text that you are showing all items including non-veg, since a non-veg-only filter is not available yet. |
| offset | number | no | Pagination offset. Use nextOffset from previous response to load more results. Default: 0. |

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
| Name | search_menu |
| MCP Server | Food |
| Endpoint | POST mcp.swiggy.com/food |
| Stage | Discover |
| Behaviour | read-only |

## Agent guidance

How Swiggy agents and orchestration logic use this tool. Surface these expectations in your prompts or tool-selection policies.

CROSS-RESTAURANT SEARCH: When user asks for a dish, first search within the current restaurant (using restaurantIdOfAddedItem if items are in cart). If no results or poor matches, search again WITHOUT restaurantIdOfAddedItem to find the dish at other restaurants. Inform the user: "I couldn't find that at [restaurant]. Here are options from other restaurants."

ADDONS & CUSTOMIZATIONS: When user asks about addons or customizations for an item, use the addons data already returned in this search_menu response - do NOT call search_menu again. Present the available addon choices (name + price) in text. If the item has hasAddons=true, the addons array contains all options.

MORE OPTIONS: search_menu returns paginated results. Use nextOffset from the response to load more items for the same query. For different dishes, call search_menu with a DIFFERENT query or use get_restaurant_menu to browse categories.

After showing results, let the user review the items and confirm what to add. Do NOT automatically call update_food_cart - wait for the user to decide.

## Next in this journey →

- Continue with get_restaurant_menu.
