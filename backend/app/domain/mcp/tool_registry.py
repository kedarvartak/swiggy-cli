from __future__ import annotations

from typing import Iterable

from .models import ToolDescriptor, ToolPolicy


_TOOL_POLICIES: tuple[ToolPolicy, ...] = (
    ToolPolicy(
        name="get_addresses",
        domain="shared",
        stage="discover",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
        safeAtTurnBoundary=True,
        notes=["Shared address surface for Food and Instamart."],
    ),
    ToolPolicy(
        name="search_restaurants",
        domain="food",
        stage="discover",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="search_menu",
        domain="food",
        stage="discover",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
        notes=["Docs only expose veg-only filtering, not non-veg-only."],
    ),
    ToolPolicy(
        name="get_restaurant_menu",
        domain="food",
        stage="discover",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="update_food_cart",
        domain="food",
        stage="cart",
        retryClass="cart-mutation",
        requiresApproval=False,
        supportsBlindRetry=True,
        safeAtTurnBoundary=True,
        notes=["Refresh food cart before mutation in multi-turn flows."],
    ),
    ToolPolicy(
        name="get_food_cart",
        domain="food",
        stage="cart",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
        safeAtTurnBoundary=True,
        notes=["Call before placement and final confirmation."],
    ),
    ToolPolicy(
        name="fetch_food_coupons",
        domain="food",
        stage="cart",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="apply_food_coupon",
        domain="food",
        stage="cart",
        retryClass="cart-mutation",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="flush_food_cart",
        domain="food",
        stage="cart",
        retryClass="cart-mutation",
        requiresApproval=False,
        supportsBlindRetry=True,
        notes=["User-visible destructive cart clear."],
    ),
    ToolPolicy(
        name="place_food_order",
        domain="food",
        stage="order",
        retryClass="placement",
        requiresApproval=True,
        supportsBlindRetry=False,
        statusCheckTool="get_food_orders",
        notes=["Use check-then-retry, never blind retry."],
    ),
    ToolPolicy(
        name="get_food_orders",
        domain="food",
        stage="track",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="get_food_order_details",
        domain="food",
        stage="track",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="track_food_order",
        domain="food",
        stage="track",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="create_address",
        domain="instamart",
        stage="discover",
        retryClass="cart-mutation",
        requiresApproval=False,
        supportsBlindRetry=False,
        notes=["Requires explicit latitude/longitude from caller per docs."],
    ),
    ToolPolicy(
        name="delete_address",
        domain="instamart",
        stage="discover",
        retryClass="cart-mutation",
        requiresApproval=False,
        supportsBlindRetry=False,
        notes=["Destructive user data mutation."],
    ),
    ToolPolicy(
        name="search_products",
        domain="instamart",
        stage="discover",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="your_go_to_items",
        domain="instamart",
        stage="discover",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="update_cart",
        domain="instamart",
        stage="cart",
        retryClass="cart-mutation",
        requiresApproval=False,
        supportsBlindRetry=True,
        safeAtTurnBoundary=True,
        notes=["Replaces full Instamart cart; re-read before mutation."],
    ),
    ToolPolicy(
        name="get_cart",
        domain="instamart",
        stage="cart",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
        safeAtTurnBoundary=True,
        notes=["Call before checkout and approval."],
    ),
    ToolPolicy(
        name="clear_cart",
        domain="instamart",
        stage="cart",
        retryClass="cart-mutation",
        requiresApproval=False,
        supportsBlindRetry=True,
        notes=["Recommended before switching addresses."],
    ),
    ToolPolicy(
        name="checkout",
        domain="instamart",
        stage="order",
        retryClass="placement",
        requiresApproval=True,
        supportsBlindRetry=False,
        statusCheckTool="get_orders",
        notes=["Use check-then-retry, never blind retry."],
    ),
    ToolPolicy(
        name="get_orders",
        domain="instamart",
        stage="track",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="get_order_details",
        domain="instamart",
        stage="track",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="track_order",
        domain="instamart",
        stage="track",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
        notes=["Docs require coordinates alongside order tracking requests."],
    ),
    ToolPolicy(
        name="get_saved_locations",
        domain="dineout",
        stage="find",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="search_restaurants_dineout",
        domain="dineout",
        stage="find",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="get_restaurant_details",
        domain="dineout",
        stage="find",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="get_available_slots",
        domain="dineout",
        stage="reserve",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="create_cart",
        domain="dineout",
        stage="reserve",
        retryClass="cart-mutation",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="book_table",
        domain="dineout",
        stage="reserve",
        retryClass="placement",
        requiresApproval=True,
        supportsBlindRetry=False,
        statusCheckTool="get_booking_status",
        notes=["Use check-then-retry, never blind retry."],
    ),
    ToolPolicy(
        name="get_booking_status",
        domain="dineout",
        stage="manage",
        retryClass="read",
        requiresApproval=False,
        supportsBlindRetry=True,
    ),
    ToolPolicy(
        name="report_error",
        domain="unknown",
        stage="support",
        retryClass="support",
        requiresApproval=False,
        supportsBlindRetry=False,
        notes=["Support escalation tool across domains."],
    ),
)

_POLICY_BY_NAME = {policy.name: policy for policy in _TOOL_POLICIES}


def list_tool_policies() -> list[ToolPolicy]:
    return list(_TOOL_POLICIES)


def get_tool_policy(name: str) -> ToolPolicy | None:
    return _POLICY_BY_NAME.get(name)


def enrich_tool_descriptor(tool: dict, policy: ToolPolicy | None = None) -> ToolDescriptor:
    resolved_policy = policy or get_tool_policy(str(tool.get("name", "")))
    return ToolDescriptor(
        name=str(tool.get("name", "")),
        description=tool.get("description"),
        inputSchema=tool.get("inputSchema"),
        domain=resolved_policy.domain if resolved_policy else "unknown",
        stage=resolved_policy.stage if resolved_policy else "unknown",
        retryClass=resolved_policy.retryClass if resolved_policy else "unknown",
        requiresApproval=resolved_policy.requiresApproval if resolved_policy else False,
        supportsBlindRetry=resolved_policy.supportsBlindRetry if resolved_policy else False,
        safeAtTurnBoundary=resolved_policy.safeAtTurnBoundary if resolved_policy else False,
        statusCheckTool=resolved_policy.statusCheckTool if resolved_policy else None,
        notes=list(resolved_policy.notes) if resolved_policy else [],
    )


def list_registered_tool_descriptors() -> list[ToolDescriptor]:
    return [
        enrich_tool_descriptor(
            {"name": policy.name, "description": None, "inputSchema": None},
            policy=policy,
        )
        for policy in _TOOL_POLICIES
    ]


def partition_policies_by_domain(policies: Iterable[ToolPolicy] | None = None) -> dict[str, list[ToolPolicy]]:
    selected = list(policies or _TOOL_POLICIES)
    grouped: dict[str, list[ToolPolicy]] = {}
    for policy in selected:
        grouped.setdefault(policy.domain, []).append(policy)
    return grouped
