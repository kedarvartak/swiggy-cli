# Change Log

## V1.2

Added:

- TypeScript-based environment doctor
- TypeScript-based mock Swiggy MCP server
- formalized documentation boundaries across README, roadmap, architecture, and change log
- function-level code comments aligned with repository conventions

Removed:

- Python development utility layer
- Python-based doctor script
- Python-based mock MCP server

Changed:

- `.env.example` now points to the TypeScript mock MCP server
- `package.json` scripts now run TypeScript-built utilities
- roadmap document now focuses on business scope instead of implementation tracking

## V1.1

Added:

- Group Ordering integration scaffolding for Slack and Microsoft Teams
- integration status command
- platform launch preview command
- environment-backed platform configuration

Changed:

- Group Ordering became a structured workflow area instead of a roadmap-only concept

## V1.0

Added:

- base TypeScript CLI
- stdio MCP client
- Swiggy Food command surface
- Group Ordering planning layer
- repository documentation
