# get_restaurant_details

Swiggy Dineout: Get details about a specific restaurant for TABLE BOOKING. Returns ratings, deals, timings, address. Use restaurant ID from search_restaurants_dineout results. Use same coordinates th...

Swiggy Dineout: Get details about a specific restaurant for TABLE BOOKING. Returns ratings, deals, timings, address. Use restaurant ID from search_restaurants_dineout results. Use same coordinates that were used in the search.

## See get_restaurant_details in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({
  name: "get_restaurant_details",
  arguments: {
    restaurantId: "rest_42",
    latitude: 12.9716,
    longitude: 77.5946,
  },
});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| restaurantId | string | yes | Restaurant ID from search results |
| latitude | number | yes | Latitude (use same as search) |
| longitude | number | yes | Longitude (use same as search) |

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
| Name | get_restaurant_details |
| MCP Server | Dineout |
| Endpoint | POST mcp.swiggy.com/dineout |
| Stage | Find |
| Behaviour | read-only |

# get_saved_locations

Swiggy Dineout: Get user's saved addresses for restaurant search. Returns address IDs that can be passed to search_restaurants_dineout.

Swiggy Dineout: Get user's saved addresses for restaurant search. Returns address IDs that can be passed to search_restaurants_dineout.

## See get_saved_locations in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({
  name: "get_saved_locations",
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
| Name | get_saved_locations |
| MCP Server | Dineout |
| Endpoint | POST mcp.swiggy.com/dineout |
| Stage | Find |
| Behaviour | read-only |

## Agent guidance

How Swiggy agents and orchestration logic use this tool. Surface these expectations in your prompts or tool-selection policies.

### WHEN TO USE THIS TOOL:

- User says "near my home"
- User says "near my office"
- User says "my location" or "my address"
- User says "where I live" or "my place"
- DO NOT USE when user mentions a specific city/area (Bangalore, Koramangala, Mumbai) - use coordinates directly in search_restaurants_dineout instead.

### WORKFLOW:

1. Call this tool to get saved locations
2. Show locations to user as numbered list
3. Ask: "Which location would you like to search near?"
4. Pass the chosen location's id as addressId in search_restaurants_dineout

RETURNS: List with index (1, 2, 3...), id, and addressLine for each saved address.

# search_restaurants_dineout

Swiggy Dineout: Search restaurants for TABLE BOOKING/RESERVATIONS. Use when user wants to GO OUT and book a table. NOT for food delivery. Returns rich results: cuisines, ratings with count, costForTw...

Swiggy Dineout: Search restaurants for TABLE BOOKING/RESERVATIONS. Use when user wants to GO OUT and book a table. NOT for food delivery. Returns rich results: cuisines, ratings with count, costForTwo, distance, highlights (valet parking, live music, etc.), offers, bank offers, and available deals.

## See search_restaurants_dineout in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({
  name: "search_restaurants_dineout",
  arguments: {
    query: "biryani",
  },
});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| query | string | yes | Search query - restaurant name, cuisine type (Italian, Chinese, Indian), locality/area (Koramangala, Indiranagar), or descriptive terms (romantic, rooftop). Do NOT include location/city in query. |
| entityType | undefined | no | Search filter type. "locality" for area search (Indiranagar, Koramangala). "CUISINE" for cuisine search (Italian, Chinese, Biryani). "RESTAURANT_CATEGORY" for category search (cafe, pub, bar, brewery, lounge, buffet). Omit for restaurant name searches. |
| addressId | string | no | Address ID from get_saved_locations. Coordinates are resolved server-side. Use this instead of latitude/longitude when searching near a saved address. |
| latitude | number | no | Latitude for search. Use for direct city/area searches. Not needed if addressId is provided. |
| longitude | number | no | Longitude for search. Use for direct city/area searches. Not needed if addressId is provided. |

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
| Name | search_restaurants_dineout |
| MCP Server | Dineout |
| Endpoint | POST mcp.swiggy.com/dineout |
| Stage | Find |
| Behaviour | read-only |

## Agent guidance

How Swiggy agents and orchestration logic use this tool. Surface these expectations in your prompts or tool-selection policies.

### **LOCATION **- Provide location using ONE of these methods:

- SAVED ADDRESS: If user says "near my home", "near my office", "my location" → First call get_saved_locations, then pass the chosen addressId here.
- CITY/AREA NAME: If user mentions a place (Bangalore, Koramangala, Mumbai, Indiranagar), use latitude/longitude for that location. Common coordinates:
- Bangalore center: 12.9716, 77.5946
- Koramangala: 12.9352, 77.6245
- Indiranagar: 12.9784, 77.6408
- Mumbai center: 19.0760, 72.8777
- Delhi center: 28.6139, 77.2090

### ENTITY TYPE (IMPORTANT): Set entityType to filter search results correctly:

- Locality/area search (Indiranagar, Koramangala, JP Nagar) → entityType="locality"
- Cuisine search (Chinese, Italian, Biryani) → entityType="CUISINE"
- Category search (cafe, pub, bar, brewery, lounge, buffet) → entityType="RESTAURANT_CATEGORY"
- Restaurant name search (Social, Ironhill, Zaika) → omit entityType
- Without entityType, locality and cuisine queries return generic nearby results instead of filtered results.

### SEARCH BEHAVIOR:

- With entityType: Returns rich data (cuisines, ratings, costForTwo, highlights, offers)
- Without entityType: Returns exact name matches but limited data. Call get_restaurant_details for full info on results with source="autosuggest".
- QUERY: Restaurant name, cuisine type, locality/area name, category, or descriptive terms. Do NOT include location/city in query if already provided via lat/lng.

### EXAMPLES:

- "Italian in Bangalore" → query="Italian", entityType="CUISINE", lat=12.9716, lng=77.5946
- "restaurants in Indiranagar" → query="Indiranagar", entityType="locality", lat=12.9784, lng=77.6408
- "cafes in Koramangala" → query="cafe", entityType="RESTAURANT_CATEGORY", lat=12.9352, lng=77.6245
- "pubs in Bangalore" → query="pub", entityType="RESTAURANT_CATEGORY", lat=12.9716, lng=77.5946
- "Social" → query="Social", no entityType, lat=12.9352, lng=77.6245
- "near my home" → First call get_saved_locations, then pass addressId here
