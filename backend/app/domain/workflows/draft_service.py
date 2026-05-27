from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from typing import Any
from uuid import uuid4

from app.core.errors import WorkflowValidationError
from app.domain.mcp.tool_registry import list_registered_tool_descriptors

from .catalog_service import list_workflow_definitions, validate_workflow_definition
from .models import WorkflowDefinition, WorkflowDomain


ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages"


def draft_workflow_definition(
    description: str,
    domain: WorkflowDomain | None = None,
) -> WorkflowDefinition:
    cleaned_description = description.strip()
    if not cleaned_description:
        raise WorkflowValidationError("Workflow draft description cannot be empty.")

    payload = (
        _draft_with_claude(cleaned_description, domain)
        if _anthropic_api_key()
        else _draft_with_local_heuristics(cleaned_description, domain)
    )
    return validate_workflow_definition(payload)


def _draft_with_claude(description: str, domain: WorkflowDomain | None) -> dict[str, Any]:
    request_body = {
        "model": os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest"),
        "max_tokens": 6000,
        "temperature": 0.2,
        "system": _system_prompt(),
        "messages": [
            {
                "role": "user",
                "content": _user_prompt(description, domain),
            }
        ],
    }

    request = urllib.request.Request(
        ANTHROPIC_MESSAGES_URL,
        data=json.dumps(request_body).encode("utf-8"),
        headers={
            "content-type": "application/json",
            "x-api-key": _anthropic_api_key(),
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise WorkflowValidationError(f"Claude workflow draft request failed: {detail}") from error
    except urllib.error.URLError as error:
        raise WorkflowValidationError(f"Claude workflow draft request failed: {error}") from error

    text = _extract_claude_text(body)
    return _parse_json_object(text)


def _system_prompt() -> str:
    return (
        "You draft Swiggy workflow definitions for a backend workflow runtime. "
        "Return only one JSON object that conforms to the WorkflowDefinition schema. "
        "Use only registered tools. Put approval points before irreversible placement tools. "
        "Respect documented production constraints: food orders cap practical examples at INR 1000, "
        "Instamart checkout has a minimum order expectation around INR 99, payment is COD-oriented in examples, "
        "and placement tools must not be represented as blind-retry-safe. "
        "Always use 'swiggy.<kebab-slug>' as the workflow id (e.g. 'swiggy.healthy-meal', 'swiggy.team-offsite-lunch')."
    )


def _user_prompt(description: str, domain: WorkflowDomain | None) -> str:
    context = {
        "description": description,
        "requestedDomain": domain,
        "workflowDefinitionJsonSchema": WorkflowDefinition.model_json_schema(),
        "registeredTools": [
            descriptor.model_dump(mode="json") for descriptor in list_registered_tool_descriptors()
        ],
        "fewShotWorkflowDefinitions": [
            definition.model_dump(mode="json") for definition in list_workflow_definitions()[:2]
        ],
    }
    return json.dumps(context, indent=2)


def _extract_claude_text(body: dict[str, Any]) -> str:
    content = body.get("content")
    if not isinstance(content, list):
        raise WorkflowValidationError("Claude workflow draft response did not include content.")
    chunks: list[str] = []
    for item in content:
        if isinstance(item, dict) and item.get("type") == "text" and isinstance(item.get("text"), str):
            chunks.append(item["text"])
    if not chunks:
        raise WorkflowValidationError("Claude workflow draft response did not include text content.")
    return "\n".join(chunks)


def _parse_json_object(text: str) -> dict[str, Any]:
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = re.sub(r"^```(?:json)?\s*", "", stripped)
        stripped = re.sub(r"\s*```$", "", stripped)

    try:
        parsed = json.loads(stripped)
    except json.JSONDecodeError as error:
        match = re.search(r"\{.*\}", stripped, flags=re.DOTALL)
        if not match:
            raise WorkflowValidationError("Workflow draft response was not valid JSON.") from error
        parsed = json.loads(match.group(0))

    if not isinstance(parsed, dict):
        raise WorkflowValidationError("Workflow draft response must be a JSON object.")
    return parsed


def _draft_with_local_heuristics(description: str, domain: WorkflowDomain | None) -> dict[str, Any]:
    resolved_domain = _infer_domain(description, domain)
    slug = _slugify(description)
    title = _title_from_description(description, resolved_domain)

    if resolved_domain == "instamart":
        return _instamart_draft(slug, title, description)
    if resolved_domain == "dineout":
        return _dineout_draft(slug, title, description)
    return _food_draft(slug, title, description)


def _food_draft(slug: str, title: str, description: str) -> dict[str, Any]:
    return {
        "id": f"swiggy.{slug}",
        "title": title,
        "version": "0.1.0",
        "app": "swiggy",
        "domain": "food",
        "goal": description,
        "summary": f"Draft workflow generated from: {description}",
        "difficulty": "advanced",
        "tags": ["draft", "food", "approval-gated"],
        "inputs": [
            _input("query", "string", "Cuisine, dish, or meal preference to search for.", True, "high protein meal"),
            _input("city", "string", "City used for restaurant discovery.", False, "Bangalore"),
            _input("maxBudget", "number", "Maximum food order budget in INR.", False, 500),
            _input("addressId", "string", "Saved delivery address identifier.", False, ""),
            _input("paymentMethod", "string", "Payment mode to use after approval.", False, "COD"),
        ],
        "constraints": [
            _constraint("budget-cap", "Respect budget", "Keep the cart within the user's declared budget.", "budget"),
            _constraint("approval-before-placement", "Require approval", "Pause before placing any food order.", "approval"),
        ],
        "approvalPoints": [
            {
                "stepId": "review-cart",
                "title": "Review food cart",
                "description": "Pause so the user can inspect restaurant, items, fees, and budget before placement.",
                "kind": "final_confirmation",
            }
        ],
        "tools": ["search_restaurants", "get_restaurant_menu", "update_food_cart", "get_food_cart", "place_food_order", "track_food_order"],
        "toolStrategy": ["search_restaurants", "get_restaurant_menu", "update_food_cart", "get_food_cart", "place_food_order", "track_food_order"],
        "steps": [
            _step("capture-intent", "Capture food intent", "input", "Normalize the user's food preference, budget, address, and approval expectations.", produces=["normalized food brief"]),
            _step("search-restaurants", "Search restaurant candidates", "tool-call", "Find restaurants that match the user's meal intent.", tool_name="search_restaurants", argument_hints=["query", "city", "addressId"], produces=["candidate restaurants"]),
            _step("inspect-menu", "Inspect selected menu", "tool-call", "Read menu details before selecting cart items.", tool_name="get_restaurant_menu", argument_hints=["restaurant_id"], produces=["candidate menu items"]),
            _step("choose-cart", "Choose a cart candidate", "decision", "Rank candidate items against budget, preference, and fallback posture.", produces=["selected cart items"]),
            _step("stage-cart", "Stage food cart", "tool-call", "Write the chosen items into the cart after server-side cart refresh.", tool_name="update_food_cart", argument_hints=["restaurant_id", "items"]),
            _step("review-cart", "Review cart before placement", "tool-call", "Read back cart state for user confirmation.", tool_name="get_food_cart"),
            _step("place-order", "Place approved order", "tool-call", "Place the food order only after approval.", tool_name="place_food_order", argument_hints=["paymentMethod"]),
            _step("track-order", "Track fulfillment", "tool-call", "Track the placed order.", tool_name="track_food_order", argument_hints=["orderId"]),
        ],
        "guarantees": ["Uses only registered food MCP tools.", "Requires explicit approval before order placement."],
        "limitations": ["Generated draft should be reviewed before saving.", "Nutrition and availability depend on live Swiggy data."],
        "fallbackRules": ["If the selected restaurant is unavailable, continue with the next ranked candidate.", "If placement fails, check order status before retrying."],
        "successOutput": {"type": "approved-food-order", "description": "An approved and trackable food order workflow."},
    }


def _instamart_draft(slug: str, title: str, description: str) -> dict[str, Any]:
    return {
        "id": f"swiggy.{slug}",
        "title": title,
        "version": "0.1.0",
        "app": "swiggy",
        "domain": "instamart",
        "goal": description,
        "summary": f"Draft workflow generated from: {description}",
        "difficulty": "advanced",
        "tags": ["draft", "instamart", "restock"],
        "inputs": [
            _input("query", "string", "Product or grocery theme to search for.", True, "weekly groceries"),
            _input("maxBudget", "number", "Maximum grocery cart budget in INR.", False, 1500),
            _input("addressId", "string", "Saved delivery address identifier.", False, ""),
            _input("paymentMethod", "string", "Payment mode to use after approval.", False, "COD"),
        ],
        "constraints": [
            _constraint("minimum-order", "Respect checkout minimum", "Keep the draft cart above the expected Instamart minimum before checkout.", "budget"),
            _constraint("approval-before-checkout", "Require approval", "Pause before checkout.", "approval"),
        ],
        "approvalPoints": [
            {
                "stepId": "review-cart",
                "title": "Review grocery cart",
                "description": "Pause so the user can inspect substitutions, quantity, and budget before checkout.",
                "kind": "final_confirmation",
            }
        ],
        "tools": ["get_addresses", "your_go_to_items", "search_products", "update_cart", "get_cart", "checkout", "track_order"],
        "toolStrategy": ["get_addresses", "your_go_to_items", "search_products", "update_cart", "get_cart", "checkout", "track_order"],
        "steps": [
            _step("capture-intent", "Capture grocery intent", "input", "Normalize products, budget, delivery address, and substitution preferences.", produces=["normalized grocery brief"]),
            _step("resolve-address", "Resolve address", "tool-call", "Read saved delivery addresses.", tool_name="get_addresses", produces=["available addresses"]),
            _step("pull-repeat-items", "Pull repeat items", "tool-call", "Inspect frequent grocery items.", tool_name="your_go_to_items", produces=["repeat items"]),
            _step("search-products", "Search products", "tool-call", "Fill missing grocery items from search.", tool_name="search_products", argument_hints=["query"], produces=["candidate products"]),
            _step("stage-cart", "Stage grocery cart", "tool-call", "Update the grocery cart after server-side cart refresh.", tool_name="update_cart", argument_hints=["items", "addressId"]),
            _step("review-cart", "Review cart before checkout", "tool-call", "Read back cart state for approval.", tool_name="get_cart"),
            _step("checkout", "Checkout approved cart", "tool-call", "Checkout only after approval.", tool_name="checkout", argument_hints=["paymentMethod"]),
            _step("track-order", "Track grocery order", "tool-call", "Track fulfillment after checkout.", tool_name="track_order", argument_hints=["orderId"]),
        ],
        "guarantees": ["Uses only registered Instamart MCP tools.", "Requires explicit approval before checkout."],
        "limitations": ["Generated draft should be reviewed before saving.", "Substitutions depend on live inventory."],
        "fallbackRules": ["If an item is unavailable, choose a like-for-like substitute within budget.", "If checkout fails, check order status before retrying."],
        "successOutput": {"type": "approved-instamart-order", "description": "An approved and trackable grocery order workflow."},
    }


def _dineout_draft(slug: str, title: str, description: str) -> dict[str, Any]:
    return {
        "id": f"swiggy.{slug}",
        "title": title,
        "version": "0.1.0",
        "app": "swiggy",
        "domain": "dineout",
        "goal": description,
        "summary": f"Draft workflow generated from: {description}",
        "difficulty": "advanced",
        "tags": ["draft", "dineout", "reservation"],
        "inputs": [
            _input("query", "string", "Restaurant, cuisine, or occasion to search for.", True, "dinner for two"),
            _input("city", "string", "City or neighborhood for discovery.", False, "Bangalore"),
            _input("partySize", "number", "Number of guests.", True, 2),
            _input("reservationTime", "string", "Preferred reservation time.", True, "20:00"),
        ],
        "constraints": [
            _constraint("slot-fit", "Honor preferred slot", "Prefer venues with slots close to the requested time.", "timing"),
            _constraint("approval-before-booking", "Require approval", "Pause before booking the table.", "approval"),
        ],
        "approvalPoints": [
            {
                "stepId": "review-booking",
                "title": "Review booking option",
                "description": "Pause so the user can inspect venue, slot, party size, and offer details before booking.",
                "kind": "final_confirmation",
            }
        ],
        "tools": ["get_saved_locations", "search_restaurants_dineout", "get_restaurant_details", "get_available_slots", "book_table", "get_booking_status"],
        "toolStrategy": ["get_saved_locations", "search_restaurants_dineout", "get_restaurant_details", "get_available_slots", "book_table", "get_booking_status"],
        "steps": [
            _step("capture-intent", "Capture reservation intent", "input", "Normalize occasion, location, party size, and slot preference.", produces=["normalized reservation brief"]),
            _step("resolve-location", "Resolve saved locations", "tool-call", "Read saved Dineout locations.", tool_name="get_saved_locations", produces=["saved locations"]),
            _step("search-venues", "Search venues", "tool-call", "Shortlist matching Dineout restaurants.", tool_name="search_restaurants_dineout", argument_hints=["query", "city"], produces=["candidate venues"]),
            _step("inspect-venue", "Inspect venue details", "tool-call", "Review venue details and offers.", tool_name="get_restaurant_details", argument_hints=["restaurantId"], produces=["venue details"]),
            _step("check-slots", "Check available slots", "tool-call", "Find reservation slots close to the requested time.", tool_name="get_available_slots", argument_hints=["restaurantId", "partySize", "reservationTime"], produces=["available slots"]),
            _step("review-booking", "Review booking before placement", "approval", "Require final confirmation before booking."),
            _step("book-table", "Book approved table", "tool-call", "Book the selected table only after approval.", tool_name="book_table"),
            _step("track-booking", "Track booking status", "tool-call", "Check booking status.", tool_name="get_booking_status"),
        ],
        "guarantees": ["Uses only registered Dineout MCP tools.", "Requires explicit approval before booking."],
        "limitations": ["Generated draft should be reviewed before saving.", "Slot availability depends on live venue data."],
        "fallbackRules": ["If a slot is unavailable, pick the closest acceptable slot.", "If booking fails, check booking status before retrying."],
        "successOutput": {"type": "approved-dineout-booking", "description": "An approved and trackable Dineout reservation workflow."},
    }


def _input(name: str, field_type: str, description: str, required: bool, example: Any) -> dict[str, Any]:
    return {
        "name": name,
        "type": field_type,
        "description": description,
        "required": required,
        "example": example,
    }


def _constraint(constraint_id: str, title: str, description: str, constraint_type: str) -> dict[str, Any]:
    return {
        "id": constraint_id,
        "title": title,
        "description": description,
        "type": constraint_type,
    }


def _step(
    step_id: str,
    title: str,
    kind: str,
    description: str,
    *,
    tool_name: str | None = None,
    argument_hints: list[str] | None = None,
    produces: list[str] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": step_id,
        "title": title,
        "kind": kind,
        "description": description,
    }
    if tool_name:
        payload["toolName"] = tool_name
    if argument_hints:
        payload["argumentHints"] = argument_hints
    if produces:
        payload["produces"] = produces
    return payload


def _infer_domain(description: str, domain: WorkflowDomain | None) -> WorkflowDomain:
    if domain and domain != "multi-domain":
        return domain
    lowered = description.lower()
    if any(keyword in lowered for keyword in ("grocery", "groceries", "instamart", "staples", "restock", "pantry")):
        return "instamart"
    if any(keyword in lowered for keyword in ("dineout", "reservation", "table", "restaurant booking", "book a table")):
        return "dineout"
    return "food"


def _title_from_description(description: str, domain: WorkflowDomain) -> str:
    words = re.findall(r"[A-Za-z0-9]+", description)[:6]
    base = " ".join(words).strip().title()
    if not base:
        base = {"food": "Food", "instamart": "Instamart", "dineout": "Dineout"}.get(domain, "Swiggy")
    return f"{base} Workflow"


def _slugify(description: str) -> str:
    words = re.findall(r"[a-z0-9]+", description.lower())[:8]
    slug = "-".join(words).strip("-")
    if not slug:
        slug = f"workflow-{uuid4().hex[:8]}"
    return slug[:80]


def _anthropic_api_key() -> str:
    return os.environ.get("ANTHROPIC_API_KEY", "").strip()
