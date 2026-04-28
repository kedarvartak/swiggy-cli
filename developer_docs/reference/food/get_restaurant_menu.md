# get_restaurant_menu

Get the complete menu of a restaurant, paginated by category. Use this to BROWSE a restaurant menu and see what is available. This is the PRIMARY tool for showing MORE options - use page/pageSize to ...

Get the complete menu of a restaurant, paginated by category. Use this to BROWSE a restaurant menu and see what is available. This is the PRIMARY tool for showing MORE options - use page/pageSize to navigate categories when user asks for more items or wants to explore the menu. All items within each shown category are included. Returns a COMPACT view with dish names, prices, and flags (hasVariants, hasAddons). To ORDER an item, use search_menu with the item name and restaurantId to get full customization details (variants, addons).

## Demo

▶

See get_restaurant_menu in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "get_restaurant_menu",

arguments: {

addressId: "addr_01HXYZ",

restaurantId: "rest_42",

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| addressId | string | yes | Address ID from get_addresses tool |
| restaurantId | string | yes | Restaurant ID to fetch menu for (from search_restaurants) |
| page | number | no | Page number for pagination (default: 1) |
| pageSize | number | no | Number of categories per page (default: 5, max: 8) |

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
| Name | get_restaurant_menu |
| MCP Server | Food |
| Endpoint | POST mcp.swiggy.com/food |
| Stage | Discover |
| Behaviour | read-only |

## Next in this journey →

- Continue with update_food_cart.
