# Book a table

Dineout journey - find a restaurant, check availability, reserve.

Dineout is Swiggy's table-reservation surface across 50+ Indian cities. The flow is compact: find → check slots → book → confirm.

## The flow

```text
get_saved_locations
     │
     ▼
search_restaurants_dineout ──► get_restaurant_details
                                        │
                                        ▼
                               get_available_slots ──► book_table ──► get_booking_status
```

## Step 1 - Start with a location

```ts
const locations = await client.callTool({ name: "get_saved_locations" });
// Unlike Food/Instamart, Dineout returns lat/lng explicitly for "near me" queries
```

If the user asks "restaurants near me for Friday dinner", use the first saved location's coordinates.

## Step 2 - Search

```ts
const restaurants = await client.callTool({
  name: "search_restaurants_dineout",
  arguments: {
    lat: locations.data[0].lat,
    lng: locations.data[0].lng,
    query: "italian",
  },
});
```

Results include availability status, offers, cuisines, and price range. Filter to restaurants where availability is "AVAILABLE" before presenting.

## Step 3 - Dig into details

```ts
const details = await client.callTool({
  name: "get_restaurant_details",
  arguments: { restaurantId: restaurants.data.restaurants[0].id },
});
// details.data: ratings, amenities, menu images, exclusive Dineout deals
```

## Step 4 - Check available slots

```ts
const slots = await client.callTool({
  name: "get_available_slots",
  arguments: {
    restaurantId: details.data.id,
    date: "2026-05-01",
    guestCount: 4,
  },
});
// slots.data has 7-day forward availability, broken into breakfast/lunch/dinner bands
```

Surface slot times in the user's timezone (all restaurants are in India; IST applies).

## Step 5 - Book

```ts
const booking = await client.callTool({
  name: "book_table",
  arguments: {
    restaurantId: details.data.id,
    slotId: slots.data.slots[0].slotId,
    guestCount: 4,
  },
});
```

Important: book_table is not idempotent. On 5xx, call get_booking_status with the restaurant and slot before retrying.

## Step 6 - Confirm

```ts
const status = await client.callTool({
  name: "get_booking_status",
  arguments: { bookingId: booking.data.bookingId },
});
```

Send the user the confirmation number and the restaurant's address.

## Agent prompt

You help users book restaurant tables on Swiggy Dineout. Resolve the user's location first (via get_saved_locations or lat/lng), then search. Always confirm slot date, time, and party size with the user before book_table. Show restaurant details (amenities, deals) before asking for slot confirmation.

## Common errors

SLOT_UNAVAILABLE → slot filled; refetch availability and offer alternatives.

RESTAURANT_NOT_BOOKABLE → restaurant isn't Dineout-enabled; offer dine-in walk-in guidance or a Food order instead.

BOOKING_WINDOW_CLOSED → outside booking hours; present next available day.

Full catalogue: errors.
