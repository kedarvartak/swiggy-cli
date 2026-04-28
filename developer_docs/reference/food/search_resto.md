# search_restaurants

Search and order food from restaurants for delivery. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to order food, get food delivered, or search restaurants for delivery. Swiggy Food delive...

Search and order food from restaurants for delivery. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to order food, get food delivered, or search restaurants for delivery. Swiggy Food delivery service. Use the preferred addressId from get_addresses. NOT for restaurant reservations or dine-out.

## Demo

▶

See search_restaurants in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "search_restaurants",

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
| query | string | yes | Search query (restaurant name or cuisine) |
| offset | number | no | Pagination offset. Use nextOffset from previous response to load more results. Default: 0. |

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
| Name | search_restaurants |
| MCP Server | Food |
| Endpoint | POST mcp.swiggy.com/food |
| Stage | Discover |
| Behaviour | read-only |

## Agent guidance

How Swiggy agents and orchestration logic use this tool. Surface these expectations in your prompts or tool-selection policies.

IMPORTANT: Each restaurant in the response includes an "availabilityStatus" field with values "OPEN", "CLOSED", or "UNAVAILABLE". Always check this status before proceeding: only recommend or add items from restaurants with availabilityStatus "OPEN". If a restaurant is "CLOSED" or "UNAVAILABLE", inform the user and suggest open alternatives from the results.

After showing results, let the user pick a restaurant before searching the menu. Do NOT automatically call search_menu - wait for the user to choose.

IMPORTANT: When user asks for more options or different dishes after seeing search_menu results, first call get_restaurant_menu to discover available menu categories at the restaurant. Then call search_menu with a different category/dish name to show fresh results. Do NOT re-run search_menu with the exact same query - it will return identical results.

DISTANCE & RELEVANCE: Results are sorted by a mix of distance, rating, and relevance. Each restaurant has a "distanceKm" field. When presenting results in text: (1) Prioritize nearby restaurants with good ratings first, (2) Always mention distance for far restaurants so the user can decide - e.g. "Biryani House (8.2 km away, ~40 min delivery)", (3) Never silently recommend a far restaurant without mentioning distance and expected delivery time.

GENERIC QUERIES: When user asks generic things like "popular restaurants", "best food", "what should I eat", "suggest something" - the search API handles natural language queries with query understanding. Search with broad cuisine terms like "biryani", "pizza", "chinese", "thali" based on meal time (lunch → thali/biryani/rice, dinner → similar, snack → rolls/momos/sandwich, late night → pizza/burger). Present a curated mix of top-rated nearby options across cuisines rather than dumping raw results.

## Next in this journey →

- Continue with get_restaurant_menu
