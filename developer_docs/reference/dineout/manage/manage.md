# get_booking_status

Get booking status and details for a dineout order. Returns restaurant name, date, time, guests, deal title, and status. Example: "What is the status of my booking?" → Call with order ID.

Get booking status and details for a dineout order. Returns restaurant name, date, time, guests, deal title, and status. Example: "What is the status of my booking?" → Call with order ID.

## See get_booking_status in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({
  name: "get_booking_status",
  arguments: {
    orderId: "ord_42",
  },
});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| orderId | string | yes | Order ID from booking confirmation |

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
| Name | get_booking_status |
| MCP Server | Dineout |
| Endpoint | POST mcp.swiggy.com/dineout |
| Stage | Manage |
| Behaviour | read-only |
