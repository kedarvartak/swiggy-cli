export function clampLabel(items: string[], max = 3): string {
  if (items.length <= max) {
    return items.join(" · ");
  }

  return `${items.slice(0, max).join(" · ")} +${items.length - max}`;
}

export function sentenceCase(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function workflowVerb(toolCount: number): string {
  return toolCount === 1 ? "tool" : "tools";
}
