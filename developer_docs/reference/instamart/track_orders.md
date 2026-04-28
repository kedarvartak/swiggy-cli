# track_order

Track Swiggy Instamart order status in real-time. PRIMARY TOOL for order tracking - Use this FIRST when user asks: "where is my order", "track my order", "order status", "what's the status of my orde...

Track Swiggy Instamart order status in real-time. PRIMARY TOOL for order tracking - Use this FIRST when user asks: "where is my order", "track my order", "order status", "what's the status of my order", "when will my order arrive", "ETA for my order", "is my order on the way", "has my order been delivered", "track order", "check order status", or any query about a specific order's current status. Returns real-time tracking info including: current status, ETA, delivery partner location, store info, delivery address, items ordered, and payment details. Requires orderId and delivery address coordinates. If user doesn't provide orderId, first use get_orders to find the order, then use this tool to track it.

## Demo

▶

See track_order in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "track_order",

arguments: {

orderId: "ord_42",

lat: 12.9716,

lng: 77.5946,

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| orderId | string | yes | The order ID to track (required). Can be obtained from get_orders tool. |
| lat | number | yes | Latitude of the delivery address (required for accurate tracking) |
| lng | number | yes | Longitude of the delivery address (required for accurate tracking) |

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
| Name | track_order |
| MCP Server | Instamart |
| Endpoint | POST mcp.swiggy.com/im |
| Stage | Track |
| Behaviour | read-only |

## Next in this journey →

- Continue with get_order_details.
