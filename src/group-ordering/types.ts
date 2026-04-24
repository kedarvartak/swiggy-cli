import type { JsonValue } from "../types.js";

export type CollaborationPlatform = "slack" | "teams";

export interface GroupOrderParticipant {
  userId: string;
  displayName: string;
  preferences?: string[];
  allergies?: string[];
  calorieTarget?: number;
  budgetLimit?: number;
}

export interface GroupOrderRequest {
  teamName: string;
  organizer: string;
  platform: CollaborationPlatform;
  city?: string;
  officeLocation?: string;
  restaurantQuery: string;
  participants: GroupOrderParticipant[];
  deliveryWindow?: string;
}

export interface PlatformCapability {
  id: string;
  title: string;
  description: string;
  supported: boolean;
}

export interface PlatformProfile {
  name: CollaborationPlatform;
  displayName: string;
  summary: string;
  strengths: string[];
  capabilities: PlatformCapability[];
}

export interface WorkflowStep {
  id: string;
  title: string;
  owner: "platform" | "orchestrator" | "swiggy-mcp";
  description: string;
}

export interface GroupOrderPlan {
  request: GroupOrderRequest;
  platform: PlatformProfile;
  workflow: WorkflowStep[];
  swiggyToolSequence: string[];
  outputContract: Record<string, JsonValue>;
}
