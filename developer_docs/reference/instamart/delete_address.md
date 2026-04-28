# delete_address

Swiggy (Instamart/Food): Delete a saved delivery address for the authenticated user.

Swiggy (Instamart/Food): Delete a saved delivery address for the authenticated user.

## Demo

▶

See delete_address in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "delete_address",

arguments: {

addressId: "addr_01HXYZ",

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| addressId | string | yes | The ID of the address to delete (from get_addresses response) |

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
| Name | delete_address |
| MCP Server | Instamart |
| Endpoint | POST mcp.swiggy.com/im |
| Stage | Discover |
| Behaviour | mutating |

## Agent guidance

How Swiggy agents and orchestration logic use this tool. Surface these expectations in your prompts or tool-selection policies.

- WORKFLOW:
- First call get_addresses to show the user their saved addresses
- Ask the user which address they want to delete
- Get the addressId from the user's selection
- Call this tool with the addressId
