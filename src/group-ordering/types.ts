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

export interface RedactedSecretStatus {
  configured: boolean;
  sourceEnv: string;
}

export interface SlackIntegrationConfig {
  botToken: string;
  signingSecret: string;
  appToken?: string;
  clientId?: string;
  clientSecret?: string;
  appBaseUrl: string;
  oauthRedirectUrl?: string;
  defaultChannelId?: string;
}

export interface TeamsIntegrationConfig {
  appId: string;
  appPassword: string;
  tenantId?: string;
  appBaseUrl: string;
  botEndpointPath: string;
  oauthRedirectUrl?: string;
  defaultTeamId?: string;
  defaultChannelId?: string;
}

export interface GroupOrderingIntegrationConfig {
  slack: SlackIntegrationConfig | null;
  teams: TeamsIntegrationConfig | null;
}

export interface GroupOrderingIntegrationStatus {
  slack: {
    configured: boolean;
    appBaseUrl: string | null;
    oauthRedirectUrl: string | null;
    defaultChannelId: string | null;
    botToken: RedactedSecretStatus;
    signingSecret: RedactedSecretStatus;
    appToken: RedactedSecretStatus;
    clientId: RedactedSecretStatus;
    clientSecret: RedactedSecretStatus;
  };
  teams: {
    configured: boolean;
    appBaseUrl: string | null;
    botEndpointPath: string | null;
    oauthRedirectUrl: string | null;
    defaultTeamId: string | null;
    defaultChannelId: string | null;
    appId: RedactedSecretStatus;
    appPassword: RedactedSecretStatus;
    tenantId: RedactedSecretStatus;
  };
}

export interface PlatformLaunchPreview {
  platform: CollaborationPlatform;
  summary: string;
  configStatus: GroupOrderingIntegrationStatus["slack"] | GroupOrderingIntegrationStatus["teams"];
  launchArtifacts: Record<string, JsonValue>;
}
