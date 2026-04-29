#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/**
 * Splits a space-delimited argument string into argv fragments.
 */
function parseArgs(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Resolves an executable name against the current PATH.
 */
function resolveExecutable(command: string): string | null {
  if (command.includes("/") || command.includes("\\")) {
    return fs.existsSync(command) ? path.resolve(command) : null;
  }

  const pathEntries = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  for (const entry of pathEntries) {
    const candidate = path.join(entry, command);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Prints a readable validation report for the local CLI runtime configuration.
 */
function main(): number {
  const command = process.env.SWIGGY_MCP_COMMAND;
  const args = parseArgs(process.env.SWIGGY_MCP_ARGS);

  process.stdout.write("Swiggy CLI Environment Doctor\n");
  process.stdout.write("============================\n");

  if (!command) {
    process.stdout.write("Status: FAILED\n");
    process.stdout.write("Reason: SWIGGY_MCP_COMMAND is not set.\n");
    process.stdout.write("Action: Set the executable that starts the Swiggy MCP server.\n");
    return 1;
  }

  const executable = resolveExecutable(command);
  process.stdout.write(`Configured command: ${command}\n`);
  process.stdout.write(`Configured args: ${args.length > 0 ? args.join(" ") : "(none)"}\n`);

  if (!executable) {
    process.stdout.write("Status: FAILED\n");
    process.stdout.write("Reason: The configured command was not found on PATH.\n");
    process.stdout.write("Action: Install the runtime or provide an absolute executable path.\n");
    return 1;
  }

  process.stdout.write(`Resolved executable: ${executable}\n`);
  process.stdout.write("Status: OK\n");
  return 0;
}

process.exit(main());
