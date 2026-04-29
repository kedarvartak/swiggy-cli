export const runStages = [
  {
    title: "Resolve context",
    state: "complete",
    detail: "Saved locations, delivery address, and domain selection loaded.",
  },
  {
    title: "Plan tool sequence",
    state: "active",
    detail: "Workflow planner is mapping required steps and missing inputs.",
  },
  {
    title: "Await approval",
    state: "pending",
    detail: "High-impact actions pause for explicit user confirmation.",
  },
  {
    title: "Execute safely",
    state: "pending",
    detail: "Mutating calls are run only after guardrails and retries are applied.",
  },
] as const;
