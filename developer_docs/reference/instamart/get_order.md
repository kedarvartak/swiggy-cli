# get_orders

Swiggy Instamart order history - Use this to fetch ORDER HISTORY, past orders, or order preferences. Use this FIRST when user asks: "show my orders", "get my orders", "my last order", "order history"...

Swiggy Instamart order history - Use this to fetch ORDER HISTORY, past orders, or order preferences. Use this FIRST when user asks: "show my orders", "get my orders", "my last order", "order history", "past orders", "recent orders", "list my orders", "what did I order before", "my previous orders", "check my past orders", "my order preferences", "get preferences from past orders", "what do I usually order", "my frequent items", "reorder", "order again", "buy the same thing", "what groceries did I buy", "my purchase history", "items I bought before". Returns a list of orders from the last 15 days with basic details including items, status, and delivery address coordinates. Set activeOnly=true when user asks for active/current/ongoing orders: "active orders", "current orders", "ongoing orders", "pending orders", "in-progress orders", "orders on the way", "orders being delivered", "my current deliveries". For REAL-TIME TRACKING of a specific order (where is my order, track my order, ETA, delivery partner location), use the track_order tool instead - it requires orderId and coordinates which can be obtained from this tool. Authentication is handled automatically. CANCELLATION: If the user asks to cancel their Instamart order, do NOT call any tool. Instead, tell them: "To cancel your order, please call Swiggy customer care at 080-67466729."

## Demo

▶

See get_orders in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "get_orders",

arguments: {

count: 0,

orderType: "...",

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| count | number | no | Number of orders to fetch (default: 10, max recommended: 20) |
| orderType | string | no | Order type filter (e.g., "DASH", "INSTAMART"). Default: "DASH" |
| activeOnly | boolean | no | Set to true to filter only active/ongoing orders. Default: false (returns all orders) |

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
| Name | get_orders |
| MCP Server | Instamart |
| Endpoint | POST mcp.swiggy.com/im |
| Stage | Track |
| Behaviour | read-only |

## Next in this journey →

- Continue with get_order_details.
