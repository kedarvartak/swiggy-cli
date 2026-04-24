# Roadmap

## Product Summary

Swiggy CLI is intended to be a command-line operating layer for Swiggy-powered workflows. It starts with direct food-ordering operations and expands into higher-value decision support and agentic ordering experiences.

## What The CLI Does Today

The product currently supports the Swiggy Food ordering lifecycle through an MCP backend:

- discover restaurants
- inspect menus
- manage cart state
- place orders
- track active orders

It also introduces the first business workflow layer through Group Ordering, including Slack and Microsoft Teams integration planning.

## Business Value

The CLI is useful because it turns fragmented food-ordering steps into a programmable workflow surface.

That creates value for:

- individual power users who want fast repeatable food ordering
- operators who want predictable command-line flows
- product teams experimenting with agentic food experiences
- workplace use cases such as coordinated lunch ordering

## Current Business Themes

### Swiggy Food Operations

The base product focuses on reliable ordering operations over MCP.

### Group Ordering

Group Ordering is the first business workflow layered above raw tool calls. It is aimed at workplace and team meal coordination, with Slack and Microsoft Teams positioned as the first collaboration surfaces.

## Future Scope

### Dietary Planner

Meal planning copilot that filters menus by macros, allergies, and calorie targets.

### Voice Agent

Conversational ordering flow that handles end-to-end food ordering through natural language.

### Reorder Agent

Assistant that learns repeat ordering patterns and prepares near-final orders based on time, location, budget, and prior choices.

### Budget Optimizer Agent

Agent that assembles the best possible cart for a target budget while respecting cuisine preferences and dietary constraints.

## Deliberate Non-Scope For The First Phase

The first phase does not target:

- Instamart workflows
- Dineout workflows
- reservation products
- image-based ordering
- auto-restock automation

## Long-Term Direction

The long-term direction is to evolve from a tool-driven CLI into a workflow and agent platform for food ordering, workplace coordination, and decision support around meal selection.
