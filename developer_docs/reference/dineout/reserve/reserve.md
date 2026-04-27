# book_table

Swiggy Dineout (Reservations): Book a table at a restaurant for a specific time slot. Only supports FREE reservations (isFree=true, bookingPrice=0). Paid deals will be rejected. Creates a cart then p...

Swiggy Dineout (Reservations): Book a table at a restaurant for a specific time slot. Only supports FREE reservations (isFree=true, bookingPrice=0). Paid deals will be rejected. Creates a cart then proceeds with checkout. Requires slot details from get_available_slots: - slotId: From slot.deals[].slotId - itemId: From slot.deals[].itemId - reservationTime: From slot.reservationTime Returns booking confirmation with order ID. Example: "Book a table for 4 people at 7 PM" → Call with restaurant ID, slot details, guest count, and coordinates.

## See book_table in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({
  name: "book_table",
  arguments: {
    restaurantId: "rest_42",
    slotId: 4242,
    itemId: "rest_42-ticket_7",
    reservationTime: 1735675200,
    guestCount: 2,
    latitude: 12.9716,
    longitude: 77.5946,
  },
});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| restaurantId | string | yes | Restaurant ID |
| slotId | number | yes | Slot ID from selected slot (slot.deals[].slotId) |
| itemId | string | yes | Deal/ticket item ID (slot.deals[].itemId, format: "restaurantId-ticketId") |
| reservationTime | number | yes | Unix timestamp from selected slot (slot.reservationTime) |
| guestCount | number | yes | Number of guests (1-20) |
| latitude | number | yes | Latitude from user address |
| longitude | number | yes | Longitude from user address |

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
| Name | book_table |
| MCP Server | Dineout |
| Endpoint | POST mcp.swiggy.com/dineout |
| Stage | Reserve |
| Behaviour | mutating |

# create_cart

Swiggy Dineout: Create a cart for TABLE BOOKING or bill payment. For booking (DEAL_TICKET_PURCHASE): requires restaurant ID, slot details, and guest count. Validates billToPay = 0 and skipPayment = t...

Swiggy Dineout: Create a cart for TABLE BOOKING or bill payment. For booking (DEAL_TICKET_PURCHASE): requires restaurant ID, slot details, and guest count. Validates billToPay = 0 and skipPayment = true for free reservations. Note: book_table creates cart internally, so this is only needed for standalone cart operations.

## See create_cart in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({
  name: "create_cart",
  arguments: {
    restaurantId: "rest_42",
    cartType: "DEAL_TICKET_PURCHASE",
    latitude: 12.9716,
    longitude: 77.5946,
  },
});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| restaurantId | string | yes | Restaurant ID |
| cartType | "DEAL_TICKET_PURCHASE" \| "DINEOUT" | yes | Cart type: DEAL_TICKET_PURCHASE for booking, DINEOUT for bill payment |
| latitude | number | yes | Latitude |
| longitude | number | yes | Longitude |
| slotId | number | no | Slot ID (required for booking cart) |
| itemId | string | no | Item ID (required for booking cart, format: "restaurantId-ticketId") |
| reservationTime | number | no | Unix timestamp (required for booking cart) |
| guestCount | number | no | Number of guests (required for booking cart, 1-20) |
| billAmount | number | no | Bill amount in rupees (required for bill payment cart) |
| source | string | no | Source for bill payment cart (default: "direct-payment-cart") |

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
| Name | create_cart |
| MCP Server | Dineout |
| Endpoint | POST mcp.swiggy.com/dineout |
| Stage | Reserve |
| Behaviour | mutating |

# book_table

Swiggy Dineout (Reservations): Book a table at a restaurant for a specific time slot. Only supports FREE reservations (isFree=true, bookingPrice=0). Paid deals will be rejected. Creates a cart then p...

Swiggy Dineout (Reservations): Book a table at a restaurant for a specific time slot. Only supports FREE reservations (isFree=true, bookingPrice=0). Paid deals will be rejected. Creates a cart then proceeds with checkout. Requires slot details from get_available_slots: - slotId: From slot.deals[].slotId - itemId: From slot.deals[].itemId - reservationTime: From slot.reservationTime Returns booking confirmation with order ID. Example: "Book a table for 4 people at 7 PM" → Call with restaurant ID, slot details, guest count, and coordinates.

## See book_table in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({
  name: "book_table",
  arguments: {
    restaurantId: "rest_42",
    slotId: 4242,
    itemId: "rest_42-ticket_7",
    reservationTime: 1735675200,
    guestCount: 2,
    latitude: 12.9716,
    longitude: 77.5946,
  },
});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| restaurantId | string | yes | Restaurant ID |
| slotId | number | yes | Slot ID from selected slot (slot.deals[].slotId) |
| itemId | string | yes | Deal/ticket item ID (slot.deals[].itemId, format: "restaurantId-ticketId") |
| reservationTime | number | yes | Unix timestamp from selected slot (slot.reservationTime) |
| guestCount | number | yes | Number of guests (1-20) |
| latitude | number | yes | Latitude from user address |
| longitude | number | yes | Longitude from user address |

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
| Name | book_table |
| MCP Server | Dineout |
| Endpoint | POST mcp.swiggy.com/dineout |
| Stage | Reserve |
| Behaviour | mutating |
