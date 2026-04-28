# update_cart

Swiggy Instamart (Grocery): Update Swiggy Instamart grocery cart with items. Replaces entire cart with the provided items. Use this for Instamart grocery orders, NOT for Food delivery. Authentication...

Swiggy Instamart (Grocery): Update Swiggy Instamart grocery cart with items. Replaces entire cart with the provided items. Use this for Instamart grocery orders, NOT for Food delivery. Authentication is handled automatically. Use addressId from get_addresses.

## Demo

▶

See update_cart in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "update_cart",

arguments: {

selectedAddressId: "...",

items: [{ "spinId": "spin_42", "quantity": 1 }],

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| selectedAddressId | string | yes | Selected delivery address ID from get_addresses tool |
| items | object[] | yes | Array of items to add to cart |

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
| Name | update_cart |
| MCP Server | Instamart |
| Endpoint | POST mcp.swiggy.com/im |
| Stage | Cart |
| Behaviour | mutating |
