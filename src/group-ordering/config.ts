import process from "node:process";
import type {
  GroupOrderingIntegrationConfig,
  GroupOrderingIntegrationStatus,
  RedactedSecretStatus,
  SlackIntegrationConfig,
  TeamsIntegrationConfig,
} from "./types.js";

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function requireUrl(name: string): string | undefined {
  const value = optionalEnv(name);
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`Environment variable ${name} must be a valid absolute URL.`);
  }
}

function secretStatus(sourceEnv: string): RedactedSecretStatus {
  return {
    configured: Boolean(optionalEnv(sourceEnv)),
    sourceEnv,
  };
}

function loadSlackConfig(): SlackIntegrationConfig | null {
  const botToken = optionalEnv("SLACK_BOT_TOKEN");
  const signingSecret = optionalEnv("SLACK_SIGNING_SECRET");
  const appBaseUrl = requireUrl("SLACK_APP_BASE_URL");

  if (!botToken || !signingSecret || !appBaseUrl) {
    return null;
  }

  return {
    botToken,
    signingSecret,
    appToken: optionalEnv("SLACK_APP_TOKEN"),
    clientId: optionalEnv("SLACK_CLIENT_ID"),
    clientSecret: optionalEnv("SLACK_CLIENT_SECRET"),
    appBaseUrl,
    oauthRedirectUrl: requireUrl("SLACK_OAUTH_REDIRECT_URL"),
    defaultChannelId: optionalEnv("SLACK_DEFAULT_CHANNEL_ID"),
  };
}

function loadTeamsConfig(): TeamsIntegrationConfig | null {
  const appId = optionalEnv("TEAMS_APP_ID");
  const appPassword = optionalEnv("TEAMS_APP_PASSWORD");
  const appBaseUrl = requireUrl("TEAMS_APP_BASE_URL");
  const botEndpointPath = optionalEnv("TEAMS_BOT_ENDPOINT_PATH") ?? "/api/teams/messages";

  if (!appId || !appPassword || !appBaseUrl) {
    return null;
  }

  return {
    appId,
    appPassword,
    tenantId: optionalEnv("TEAMS_TENANT_ID"),
    appBaseUrl,
    botEndpointPath,
    oauthRedirectUrl: requireUrl("TEAMS_OAUTH_REDIRECT_URL"),
    defaultTeamId: optionalEnv("TEAMS_DEFAULT_TEAM_ID"),
    defaultChannelId: optionalEnv("TEAMS_DEFAULT_CHANNEL_ID"),
  };
}

export function loadGroupOrderingIntegrationConfig(): GroupOrderingIntegrationConfig {
  return {
    slack: loadSlackConfig(),
    teams: loadTeamsConfig(),
  };
}

export function getGroupOrderingIntegrationStatus(): GroupOrderingIntegrationStatus {
  const slack = loadSlackConfig();
  const teams = loadTeamsConfig();

  return {
    slack: {
      configured: Boolean(slack),
      appBaseUrl: slack?.appBaseUrl ?? null,
      oauthRedirectUrl: slack?.oauthRedirectUrl ?? null,
      defaultChannelId: slack?.defaultChannelId ?? null,
      botToken: secretStatus("SLACK_BOT_TOKEN"),
      signingSecret: secretStatus("SLACK_SIGNING_SECRET"),
      appToken: secretStatus("SLACK_APP_TOKEN"),
      clientId: secretStatus("SLACK_CLIENT_ID"),
      clientSecret: secretStatus("SLACK_CLIENT_SECRET"),
    },
    teams: {
      configured: Boolean(teams),
      appBaseUrl: teams?.appBaseUrl ?? null,
      botEndpointPath: teams?.botEndpointPath ?? null,
      oauthRedirectUrl: teams?.oauthRedirectUrl ?? null,
      defaultTeamId: teams?.defaultTeamId ?? null,
      defaultChannelId: teams?.defaultChannelId ?? null,
      appId: secretStatus("TEAMS_APP_ID"),
      appPassword: secretStatus("TEAMS_APP_PASSWORD"),
      tenantId: secretStatus("TEAMS_TENANT_ID"),
    },
  };
}
