# search_products

Search for products available at the selected address. Returns products with their variants (e.g., different pack sizes, quantities). When a user asks to add a product, ALWAYS search first to see ava...

Search for products available at the selected address. Returns products with their variants (e.g., different pack sizes, quantities). When a user asks to add a product, ALWAYS search first to see available variants, then ask the user which specific variant they want before adding to cart. Authentication is handled automatically. Use the addressId from get_addresses.

## Demo

▶

See search_products in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "search_products",

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
| query | string | yes | Search query (product name, category, or brand) |
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
| Name | search_products |
| MCP Server | Instamart |
| Endpoint | POST mcp.swiggy.com/im |
| Stage | Discover |
| Behaviour | read-only |
