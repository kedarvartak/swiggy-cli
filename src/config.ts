import process from "node:process";

export interface McpConfig {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
}

function parseArgs(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function loadMcpConfig(): McpConfig {
  const command = process.env.SWIGGY_MCP_COMMAND;
  if (!command) {
    throw new Error(
      "Missing SWIGGY_MCP_COMMAND. Set it to the executable that starts your Swiggy MCP server.",
    );
  }

  return {
    command,
    args: parseArgs(process.env.SWIGGY_MCP_ARGS),
    env: {
      ...process.env,
    },
  };
}
