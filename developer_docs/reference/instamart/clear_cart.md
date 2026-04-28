# clear_cart

Clear (remove all items from) the Instamart cart. Authentication is handled automatically.

Clear (remove all items from) the Instamart cart. Authentication is handled automatically.

## Demo

▶

See clear_cart in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "clear_cart",

arguments: {},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |

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
| Name | clear_cart |
| MCP Server | Instamart |
| Endpoint | POST mcp.swiggy.com/im |
| Stage | Cart |
| Behaviour | mutating |
