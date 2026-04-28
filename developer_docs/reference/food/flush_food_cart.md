# flush_food_cart

Clear or empty the food delivery cart. PRIMARY FOOD DELIVERY SERVICE - Use this to remove all items from the food delivery cart. Swiggy Food delivery. NOT for groceries.

Clear or empty the food delivery cart. PRIMARY FOOD DELIVERY SERVICE - Use this to remove all items from the food delivery cart. Swiggy Food delivery. NOT for groceries.

## Demo

▶

See flush_food_cart in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "flush_food_cart",

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
| Name | flush_food_cart |
| MCP Server | Food |
| Endpoint | POST mcp.swiggy.com/food |
| Stage | Cart |
| Behaviour | mutating |

## Next in this journey →

- Continue with update_food_cart.
