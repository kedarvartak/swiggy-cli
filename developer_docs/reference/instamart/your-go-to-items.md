# your_go_to_items

Fetch the user's Your Go To Items (frequently or recently ordered items) for the selected delivery address. Use addressId from get_addresses. Returns products with variants; use spinId from the chose...

Fetch the user's Your Go To Items (frequently or recently ordered items) for the selected delivery address. Use addressId from get_addresses. Returns products with variants; use spinId from the chosen variant when adding to cart.

## Demo

▶

See your_go_to_items in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "your_go_to_items",

arguments: {

addressId: "addr_01HXYZ",

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| addressId | string | yes | Address ID from get_addresses tool |
| offset | number | no | Pagination offset (default: 0) |

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
| Name | your_go_to_items |
| MCP Server | Instamart |
| Endpoint | POST mcp.swiggy.com/im |
| Stage | Discover |
| Behaviour | read-only |
