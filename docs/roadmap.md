# Roadmap

## Current Goal

Deliver a complete Swiggy Food CLI integrated with an MCP server using the Model Context Protocol over stdio.

## Active Pipeline

Only the following ideas remain in scope for future iterations:

1. Group Ordering
   Slack or Microsoft Teams workflow that gathers team preferences and places a single optimized order.
2. Dietary Planner
   Meal planning copilot that filters menus by macros, allergies, and calorie targets.
3. Voice Agent
   Conversational ordering flow that handles end-to-end food ordering through natural language.

## Explicitly Deferred

The following ideas are intentionally not tracked in this repository at this time:

- Auto-restock
- Reservation agent
- Multi-modal agent
- Instamart automation
- Dineout reservation workflows

## Exit Criteria for Version 0.1

- Connect to an MCP server from the CLI
- Discover available tools
- Execute the Swiggy Food ordering flow
- Document installation, configuration, and future direction

## Group Ordering Progress

Status: In progress

Implemented foundation:

- Shared group-order request and workflow model
- Slack capability profile
- Microsoft Teams capability profile
- Planner that maps collaboration input to Swiggy MCP tool usage

Next implementation steps:

- Add Slack adapter for message blocks, reminders, and confirmation updates
- Add Microsoft Teams adapter for adaptive cards and review states
- Persist order sessions and participant responses
- Connect planner output to real MCP tool execution
