#!/usr/bin/env node

import process from "node:process";
import { commandHandlers } from "./commands.js";
import { loadMcpConfig } from "./config.js";
import { McpClient } from "./mcp-client.js";
import { parseArgv } from "./parser.js";

/**
 * Runs the CLI, routing local-only commands directly and MCP-backed commands through the client.
 */
async function main(): Promise<void> {
  const parsed = parseArgv(process.argv.slice(2));
  const handler = commandHandlers[parsed.command];

  if (!handler) {
    process.stderr.write(`Unknown command: ${parsed.command}\n`);
    process.stderr.write("Run `swiggy help` to view supported commands.\n");
    process.exitCode = 1;
    return;
  }

  if (parsed.command === "help") {
    process.stdout.write(`${await handler({} as never, parsed)}\n`);
    return;
  }

  const client = new McpClient(loadMcpConfig());

  try {
    await client.initialize();
    const output = await handler(client, parsed);
    process.stdout.write(`${output}\n`);
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
