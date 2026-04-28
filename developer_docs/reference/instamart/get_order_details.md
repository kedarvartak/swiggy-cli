# get_order_details

Get detailed information for a specific Swiggy Instamart order by order ID. Use this when the user wants to see complete details about a specific order including: full list of items with quantities a...

Get detailed information for a specific Swiggy Instamart order by order ID. Use this when the user wants to see complete details about a specific order including: full list of items with quantities and prices, itemized bill breakdown (item total, delivery fee, handling fee, grand total), order status, and whether there are any refunds. This tool provides more detailed information than get_orders. Note: For store information, delivery address, or real-time tracking, use get_orders or track_order instead. To use this tool, you need an orderId which can be obtained from the get_orders tool first. Example use cases: "show me details of order 123456", "what items were in my last order", "show me the bill for order 123456", "what was the total for my recent order".

## Demo

▶

See get_order_details in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "get_order_details",

arguments: {

orderId: "ord_42",

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| orderId | string | yes | The order ID to fetch details for (required). Can be obtained from get_orders tool. |

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
| Name | get_order_details |
| MCP Server | Instamart |
| Endpoint | POST mcp.swiggy.com/im |
| Stage | Track |
| Behaviour | read-only |
