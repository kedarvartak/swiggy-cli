import { getGroupOrderingIntegrationStatus, loadGroupOrderingIntegrationConfig } from "./config.js";
import type { GroupOrderRequest, PlatformLaunchPreview } from "./types.js";

/**
 * Creates a stable session identifier that platform adapters can attach to interactive payloads.
 */
function createSessionKey(request: GroupOrderRequest): string {
  const normalizedTeam = request.teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${request.platform}-${normalizedTeam}-${request.participants.length}`;
}

/**
 * Generates the Slack-specific launch preview used by a custom app integration.
 */
function slackPreview(request: GroupOrderRequest): PlatformLaunchPreview {
  const config = loadGroupOrderingIntegrationConfig().slack;
  const status = getGroupOrderingIntegrationStatus().slack;
  const sessionKey = createSessionKey(request);

  return {
    platform: "slack",
    summary: "Slack launch payload preview for a channel-driven group ordering flow.",
    configStatus: status,
    launchArtifacts: {
      sessionKey,
      requestContext: {
        teamName: request.teamName,
        organizer: request.organizer,
        restaurantQuery: request.restaurantQuery,
        participantCount: request.participants.length,
      },
      oauthInstallUrl:
        config?.clientId && config.oauthRedirectUrl
          ? `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(config.clientId)}&scope=chat:write,commands,users:read&redirect_uri=${encodeURIComponent(config.oauthRedirectUrl)}`
          : null,
      interactionEndpoint: config ? `${config.appBaseUrl}/api/slack/interactions` : null,
      eventsEndpoint: config ? `${config.appBaseUrl}/api/slack/events` : null,
      slashCommandExample: {
        command: "/swiggy-group-order",
        text: `${request.teamName} | ${request.restaurantQuery} | ${request.deliveryWindow ?? "today lunch"}`,
      },
      launchMessage: {
        channel: config?.defaultChannelId ?? "CHANNEL_ID_REQUIRED",
        text: `Lunch order started for ${request.teamName}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${request.teamName} lunch order*\nOrganizer: ${request.organizer}\nCuisine query: ${request.restaurantQuery}`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                action_id: "join_group_order",
                text: {
                  type: "plain_text",
                  text: "Add preference",
                },
                value: sessionKey,
              },
            ],
          },
        ],
      },
    },
  };
}

/**
 * Generates the Microsoft Teams launch preview used by a custom app integration.
 */
function teamsPreview(request: GroupOrderRequest): PlatformLaunchPreview {
  const config = loadGroupOrderingIntegrationConfig().teams;
  const status = getGroupOrderingIntegrationStatus().teams;
  const sessionKey = createSessionKey(request);

  return {
    platform: "teams",
    summary: "Microsoft Teams launch payload preview for an adaptive-card-based group ordering flow.",
    configStatus: status,
    launchArtifacts: {
      sessionKey,
      requestContext: {
        teamName: request.teamName,
        organizer: request.organizer,
        restaurantQuery: request.restaurantQuery,
        participantCount: request.participants.length,
      },
      oauthInstallUrl:
        config?.tenantId && config.oauthRedirectUrl
          ? `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/authorize?client_id=${encodeURIComponent(config.appId)}&response_type=code&redirect_uri=${encodeURIComponent(config.oauthRedirectUrl)}&response_mode=query&scope=${encodeURIComponent("offline_access https://graph.microsoft.com/User.Read")}`
          : null,
      botMessagesEndpoint: config ? `${config.appBaseUrl}${config.botEndpointPath}` : null,
      launchCard: {
        teamId: config?.defaultTeamId ?? "TEAM_ID_REQUIRED",
        channelId: config?.defaultChannelId ?? "CHANNEL_ID_REQUIRED",
        type: "AdaptiveCard",
        version: "1.5",
        body: [
          {
            type: "TextBlock",
            weight: "Bolder",
            size: "Medium",
            text: `${request.teamName} group order`,
          },
          {
            type: "TextBlock",
            wrap: true,
            text: `Organizer: ${request.organizer}. Cuisine query: ${request.restaurantQuery}.`,
          },
          {
            type: "Input.Text",
            id: "preference",
            placeholder: "Enter dish preferences or dietary constraints",
          },
        ],
        actions: [
          {
            type: "Action.Submit",
            title: "Submit preference",
            data: {
              action: "submit_group_order_preference",
              sessionKey,
            },
          },
        ],
      },
    },
  };
}

/**
 * Routes a group order request to the correct platform preview adapter.
 */
export function createPlatformLaunchPreview(request: GroupOrderRequest): PlatformLaunchPreview {
  if (request.platform === "slack") {
    return slackPreview(request);
  }

  return teamsPreview(request);
}
