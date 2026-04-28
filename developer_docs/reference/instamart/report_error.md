# report_error

Generate an error report to share with the Swiggy MCP team. Use this when the user encounters an error and wants to report it. Returns a pre-filled mailto: link and a human-readable summary. The user...

Generate an error report to share with the Swiggy MCP team. Use this when the user encounters an error and wants to report it. Returns a pre-filled mailto: link and a human-readable summary. The user can click the link to open their email client with the report ready to send. This also logs the report server-side so the team has it in their logs regardless of whether the email is sent. IMPORTANT: Always include toolContext with the specific identifiers from the failed tool call - e.g., orderId, restaurantId, addressId, spinId, menu_item_id, couponCode, query, cartId, slotId, paymentMethod. Include whichever IDs were part of the failed request so the team can trace the exact issue.

## Demo

▶

See report_error in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "report_error",

arguments: {

tool: "...",

errorMessage: "...",

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| tool | string | yes | Name of the tool that errored (e.g., "checkout", "search_products", "place_food_order") |
| domain | string | no | MCP server name where the error occurred (e.g., "im", "food", "dineout"). Auto-detected if not provided. |
| errorMessage | string | yes | The error message the user saw |
| flowDescription | string | no | Brief description of what the user was doing (e.g., "searched for milk → added to cart → checkout failed") |
| toolContext | object | no | Key-value pairs of identifiers from the failed tool call. Include ALL relevant IDs such as: orderId, restaurantId, addressId, spinId, menu_item_id, couponCode, query, cartId, slotId, paymentMethod, guestCount, itemId - whichever were part of the request that failed. |
| userNotes | string | no | Any additional notes or context the user wants to share |

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
| Name | report_error |
| MCP Server | Instamart |
| Endpoint | POST mcp.swiggy.com/im |
| Stage | Support |
| Behaviour | mutating |
