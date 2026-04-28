# get_addresses

Swiggy (Instamart/Food): Get all saved delivery addresses for the authenticated Swiggy user, sorted by last order date. This tool works for Swiggy Instamart and Food services. Addresses are returned ...

Swiggy (Instamart/Food): Get all saved delivery addresses for the authenticated Swiggy user, sorted by last order date. This tool works for Swiggy Instamart and Food services. Addresses are returned WITHOUT coordinates (latitude/longitude) for privacy protection. No parameters needed - authentication is handled automatically.

## Demo

▶

See get_addresses in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "get_addresses",

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
| Name | get_addresses |
| MCP Server | Instamart |
| Endpoint | POST mcp.swiggy.com/im |
| Stage | Discover |
| Behaviour | read-only |

## Agent guidance

How Swiggy agents and orchestration logic use this tool. Surface these expectations in your prompts or tool-selection policies.

- **IMPORTANT **- STOP here and let the user choose:
- Show the address list to the user
- Ask: "Which address would you like to use for delivery?"
- Do NOT call any other tool until the user has selected an address
- Remember the selected addressId for all subsequent operations
- If no addresses are returned, inform the user that they need to add an address first
