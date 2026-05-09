# Swiggy Tool Inventory

## Purpose

This is the Phase 0 audit of the documented Swiggy tool surface.

It translates `developer_docs/reference/**` and `developer_docs/ship/prod.md` into a backend-oriented inventory:

- domain
- stage
- retry class
- blind-retry safety
- approval sensitivity
- notes that affect backend execution policy

This inventory is the input for the backend tool registry in Phase 2.

## Tool Classes

### `read`

- Safe to retry
- No approval needed by default
- Examples: list/search/get/track style tools

### `cart-mutation`

- Safe to retry on same arguments
- Shared-state sensitive
- Must refresh cart at turn boundaries

### `placement`

- Not safe to blind-retry
- Requires check-then-retry pattern
- Must stop behind explicit approval

### `support`

- Not a user-goal tool
- Used for diagnostics/escalation

## Food Domain

Endpoint: `POST mcp.swiggy.com/food`

| Tool | Stage | Class | Blind Retry | Approval Sensitive | Notes |
| --- | --- | --- | --- | --- | --- |
| `get_addresses` | discover | read | yes | no | Shared with Instamart address layer |
| `search_restaurants` | discover | read | yes | no | Core food entrypoint |
| `search_menu` | discover | read | yes | no | Veg-only filter documented, no non-veg-only filter |
| `get_restaurant_menu` | discover | read | yes | no | Menu browse primitive |
| `update_food_cart` | cart | cart-mutation | yes | indirect | Refresh cart before mutation in multi-turn flows |
| `get_food_cart` | cart | read | yes | no | Must be called before place order / approval |
| `fetch_food_coupons` | cart | read | yes | no | Coupon discovery only for Food |
| `apply_food_coupon` | cart | cart-mutation | yes | indirect | Retryable per prod doc |
| `flush_food_cart` | cart | cart-mutation | yes | indirect | Clears cart; should be user-visible if destructive |
| `place_food_order` | order | placement | no | yes | Use check-then-retry via `get_food_orders` |
| `get_food_orders` | track | read | yes | no | Active food orders, not full history |
| `get_food_order_details` | track | read | yes | no | Detail lookup |
| `track_food_order` | track | read | yes | no | Delivery progress |
| `report_error` | support | support | n/a | no | Support escalation tool |

## Instamart Domain

Endpoint: `POST mcp.swiggy.com/im`

| Tool | Stage | Class | Blind Retry | Approval Sensitive | Notes |
| --- | --- | --- | --- | --- | --- |
| `get_addresses` | discover | read | yes | no | Shared address surface |
| `create_address` | discover | cart-mutation | use caution | indirect | Requires raw latitude/longitude per docs |
| `delete_address` | discover | cart-mutation | use caution | indirect | Destructive user data mutation |
| `search_products` | discover | read | yes | no | Product search |
| `your_go_to_items` | discover | read | yes | no | Frequently/recently ordered items |
| `update_cart` | cart | cart-mutation | yes | indirect | Replaces full cart; shared-state sensitive |
| `get_cart` | cart | read | yes | no | Must be fetched before checkout |
| `clear_cart` | cart | cart-mutation | yes | indirect | Recommended before address switch |
| `checkout` | order | placement | no | yes | Use check-then-retry via `get_orders` / `get_order_details` |
| `get_orders` | track | read | yes | no | Includes history and reorder preference signals |
| `get_order_details` | track | read | yes | no | Detail lookup |
| `track_order` | track | read | yes | no | Requires coordinates per docs |
| `report_error` | support | support | n/a | no | Support escalation tool |

## Dineout Domain

Endpoint: `POST mcp.swiggy.com/dineout`

| Tool | Stage | Class | Blind Retry | Approval Sensitive | Notes |
| --- | --- | --- | --- | --- | --- |
| `get_saved_locations` | find | read | yes | no | Location context for dineout search |
| `search_restaurants_dineout` | find | read | yes | no | Venue search |
| `get_restaurant_details` | find | read | yes | no | Venue details, timings, deals |
| `get_available_slots` | reserve | read | yes | no | Slot availability |
| `create_cart` | reserve | cart-mutation | yes | indirect | Booking-state preparation |
| `book_table` | reserve | placement | no | yes | Use check-then-retry via `get_booking_status` |
| `get_booking_status` | manage | read | yes | no | Booking confirmation/status |
| `report_error` | support | support | n/a | no | Support escalation tool |

## Cross-Domain Backend Rules

## 1. Cart Refresh Rule

Before any cart mutation or placement step:

- Food: call `get_food_cart`
- Instamart: call `get_cart`

This comes directly from `developer_docs/agent-patterns/multi-turn-cart-state.md`.

## 2. Placement Retry Rule

Never blind-retry:

- `place_food_order`
- `checkout`
- `book_table`

Instead:

1. Wait briefly on network/5xx failure
2. Check status via the domain’s read API
3. Treat a found order/booking as success
4. Retry original placement only if status check shows it did not go through

## 3. Approval Rule

All placement tools are approval-gated by default.

The backend execution engine should stop before:

- `place_food_order`
- `checkout`
- `book_table`

And only proceed after explicit approval.

## 4. Shared-State Rule

Food and Instamart carts are server-side session state.

Implication for backend runtime:

- do not trust local cached cart state
- always re-read before mutation or confirmation
- surface restaurant-switch / address-switch risks before destructive cart changes

## 5. Domain Gaps The Backend Must Respect

From `developer_docs/observations/observations_from_docs.md`:

- Food order history is limited versus Instamart history
- Cancellation is not documented as a tool workflow
- Instamart has no documented coupon flow
- Address creation depends on explicit coordinates
- Scheduled-slot behavior is not properly surfaced as a documented tool set

These are not just product notes. They should become backend validation and UX constraints so frontend/CLI do not imply unsupported capabilities.

## Phase 0 Outcome

This inventory should be treated as the source audit for:

- Phase 2 tool registry implementation
- retry policy coding
- approval policy coding
- frontend capability gating
- CLI command safety
