# get_food_orders

Get active food delivery orders and order status. PRIMARY FOOD DELIVERY SERVICE - Use this when user asks about their orders, order status, or current food delivery orders. Swiggy Food delivery. Retu...

Get active food delivery orders and order status. PRIMARY FOOD DELIVERY SERVICE - Use this when user asks about their orders, order status, or current food delivery orders. Swiggy Food delivery. Returns order details like status, items, restaurant info, and available actions for orders currently in progress. If user asks for past orders or order history, direct them to check the Swiggy app. Uses addressId instead of lat/lng for privacy - coordinates are fetched internally. CANCELLATION: If the user asks to cancel their food order, do NOT call any tool. Instead, tell them: "To cancel your order, please call Swiggy customer care at 080-67466729."

## Demo

▶

See get_food_orders in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "get_food_orders",

arguments: {

addressId: "addr_01HXYZ",

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| orderCount | number | no | Number of orders to fetch (default: 5, max: 20) |
| addressId | string | yes | Address ID to use for fetching orders (can be obtained from get_addresses) |

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
| Name | get_food_orders |
| MCP Server | Food |
| Endpoint | POST mcp.swiggy.com/food |
| Stage | Track |
| Behaviour | read-only |

## Next in this journey →

- Continue with get_food_order_details.
