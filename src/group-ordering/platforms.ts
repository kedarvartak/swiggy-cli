import type { PlatformProfile } from "./types.js";

export const platformProfiles: Record<"slack" | "teams", PlatformProfile> = {
  slack: {
    name: "slack",
    displayName: "Slack",
    summary: "Best fit for fast conversational collection, reminders, and lightweight approvals inside channels and direct messages.",
    strengths: [
      "Rich message blocks for preference forms and order summaries",
      "Threaded coordination for restaurant voting and clarifications",
      "Direct-message follow-ups for missing preferences or payment acknowledgements",
    ],
    capabilities: [
      {
        id: "launch-from-channel",
        title: "Launch group order from a channel",
        description: "Start a lunch collection flow from a team channel or a private operations channel.",
        supported: true,
      },
      {
        id: "dm-reminders",
        title: "Direct-message reminders",
        description: "Nudge non-responders individually without cluttering the main order thread.",
        supported: true,
      },
      {
        id: "interactive-forms",
        title: "Interactive preference capture",
        description: "Collect meal selections, allergies, and budget constraints through interactive blocks.",
        supported: true,
      },
      {
        id: "threaded-voting",
        title: "Threaded restaurant voting",
        description: "Run lightweight polling or emoji-based voting inside a channel thread.",
        supported: true,
      },
      {
        id: "adaptive-cards",
        title: "Adaptive card layout",
        description: "Native adaptive cards are not Slack's primary interaction model.",
        supported: false,
      },
    ],
  },
  teams: {
    name: "teams",
    displayName: "Microsoft Teams",
    summary: "Best fit for structured enterprise workflows, approval-heavy coordination, and organizations standardized on Microsoft 365.",
    strengths: [
      "Adaptive cards for structured multi-field submissions",
      "Strong enterprise deployment posture across departments and tenants",
      "Natural extension point into Microsoft approval and productivity workflows",
    ],
    capabilities: [
      {
        id: "launch-from-channel",
        title: "Launch group order from a channel",
        description: "Start a group order from a team channel with a shared adaptive card entry point.",
        supported: true,
      },
      {
        id: "dm-reminders",
        title: "Direct-message reminders",
        description: "Send reminder messages to users who have not submitted preferences.",
        supported: true,
      },
      {
        id: "interactive-forms",
        title: "Structured preference capture",
        description: "Collect meal selections, dietary constraints, and budgets through adaptive cards.",
        supported: true,
      },
      {
        id: "threaded-voting",
        title: "Threaded restaurant voting",
        description: "Conversation support exists, but voting is typically less fluid than Slack's thread-first experience.",
        supported: false,
      },
      {
        id: "adaptive-cards",
        title: "Adaptive card layout",
        description: "Use adaptive cards for rich structured forms, review states, and approval actions.",
        supported: true,
      },
    ],
  },
};

export function getPlatformProfile(name: string): PlatformProfile {
  if (name !== "slack" && name !== "teams") {
    throw new Error(`Unsupported platform: ${name}. Expected one of: slack, teams.`);
  }

  return platformProfiles[name];
}
