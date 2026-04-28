# Observations From Reference Docs

## Findings

1. Food order history and reorder are not exposed in the reference workflow.
The food docs only support active-order tracking through `get_food_orders` and explicitly say users should check the Swiggy app for past orders or order history. There is no documented equivalent of Instamart's `get_orders` flow for food, and no reorder or "order again" path.

2. Order cancellation is not available as an API workflow for either Food or Instamart.
Across both domains, the docs repeatedly instruct the agent not to call any tool for cancellation and instead direct the user to call Swiggy customer care. That suggests cancellation exists in the app support experience but is not exposed through the documented tool surface.

3. Instamart has no documented coupon or offers workflow.
Food has explicit `fetch_food_coupons` and `apply_food_coupon` tools, but Instamart has no comparable coupon-discovery or coupon-application tool in the reference set. If Instamart offers exist in the app, they are missing from the documented API surface.

4. Address creation depends on raw latitude/longitude, which is weaker than expected app behavior.
`create_address` requires latitude and longitude and the guidance asks the user to provide them directly. That implies there is no documented geocoding, map pin, or address-resolution workflow, even though users would normally expect address search or location picking in the app.

5. Instamart tracking has a hidden dependency on coordinates.
`track_order` requires `orderId`, `lat`, and `lng`, while `get_addresses` explicitly omits coordinates for privacy. The docs imply those coordinates come from `get_orders`, but that dependency is not surfaced very clearly in the workflow.

6. Cart mutation semantics are underspecified for common app actions.
Instamart `update_cart` says it replaces the entire cart, but does not clearly explain safe incremental updates, partial removal, or item-level quantity edits. Food `update_food_cart` gives more guidance, but there is still no dedicated remove-item tool, so the app-style `+`, `-`, and remove flows are only partially documented.

7. Food search has a notable filter limitation.
`search_menu` documents a veg-only filter, but explicitly says there is no non-veg-only filter. If the app supports richer filtering behavior, that is not reflected here; if it does not, the limitation is important and should be called out as a product constraint.

8. Slot-based delivery appears to exist conceptually but is undocumented.
Both `report_error` docs mention `slotId` as relevant context for tracing failures, but there is no slot-selection, delivery-window, or scheduled-order tool anywhere in the reference docs. That suggests either an undocumented flow or a missing feature surface.

9. Food-only readers would miss some address-management capabilities.
The Instamart address docs state that address tools work for both Instamart and Food, but the food folder only documents `get_addresses`. As a standalone reference, the food docs do not make `create_address` or `delete_address` discoverable.

10. Payment is referenced, but only at a minimal level.
The docs mention `paymentMethod`, `availablePaymentMethods`, payment success messaging, and COD-specific coupon filtering. However, there is no deeper documentation for payment states, retries, failures, wallet/UPI/card-specific behavior, or separate payment management flows.
