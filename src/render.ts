import type { JsonValue, ToolDescriptor } from "./types.js";

function indent(text: string, spaces = 2): string {
  return text
    .split("\n")
    .map((line) => `${" ".repeat(spaces)}${line}`)
    .join("\n");
}

export function formatJson(value: unknown): string {
  if (value === undefined) {
    return "";
  }

  return JSON.stringify(value, null, 2);
}

export function formatTools(tools: ToolDescriptor[]): string {
  if (tools.length === 0) {
    return "No tools were reported by the MCP server.";
  }

  return tools
    .map((tool) => {
      const lines = [`- ${tool.name}`];
      if (tool.description) {
        lines.push(indent(tool.description));
      }
      if (tool.inputSchema) {
        lines.push(indent("Input schema:"));
        lines.push(indent(formatJson(tool.inputSchema), 4));
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

export function formatSection(title: string, body: string): string {
  return `${title}\n${"-".repeat(title.length)}\n${body}`;
}
