<p align="center"><img src="https://github.com/twilio-labs/mcp/blob/246f1b1cd1854d1343468af07a2dfa179dc30a16/docs/twilioAlphaLogoLight.png?raw=true#gh-dark-mode-only" height="70" alt="Twilio Alpha"/><img src="https://github.com/twilio-labs/mcp/blob/246f1b1cd1854d1343468af07a2dfa179dc30a16/docs/twilioAlphaLogoDark.png?raw=true#gh-light-mode-only" height="70" alt="Twilio Alpha"/></p>
<h1 align="center">Twilio MCP Server</h1>

This is a Proof of Concept (PoC) project by the ETI team, exploring the use of [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) for the exchange of model context information between different tools.

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- A Twilio account with API credentials

## Getting Started

The easiest way to get started is to edit the configuration of your client to point to the MCP server using `npx`.

```json
{
  "mcpServers": {
    "twilio": {
      "command": "npx",
      "args": [
        "-y",
        "@twilio-alpha/mcp",
        "YOUR_ACCOUNT_SID/YOUR_API_KEY:YOUR_API_SECRET"
      ]
    }
  }
}
```

Visit [Twilio API Keys docs](https://www.twilio.com/docs/iam/api-keys) for information on how to find/create your apiKey/apiSecret.

## Security Recommendations

In order to guard against injection attacks, the ETI team recommends that users of Twilio MCP servers do not install or run any community MCP servers alongside ours. Please only use official, trusted MCP servers in order to limit access to Tools that interact with your Twilio account.

## Configuration Parameters

You can pass the following optional parameters to the `mcp` server:

**--services (optional)**

The name of the services you want to use - this corresponds to the filename https://github.com/twilio/twilio-oai/tree/main/spec/yaml

**--tags (optional)**

The tag name as defined in each of the individual endpoints. If you want to filter by `tags` only, make sure you pass `--services ''` as an empty object.

## Loading Separate APIs

Due to the context size limitation of LLMs and the vast number of APIs available, you need to load separate APIs by passing the `--services/--tags` parameter. For example, to load the `chat_v3` API, you can pass `--services chat_v3`. If you need particular APIs from separate service files, you can use the `--tags` to individually select the endpoints.

### Examples: Serverless Tools

Load all the Serverless API tools.

```json
{
  "mcpServers": {
    "twilio": {
      "command": "npx",
      "args": [
        "-y",
        "@twilio-alpha/mcp",
        "YOUR_ACCOUNT_SID/YOUR_API_KEY:YOUR_API_SECRET",
        "--services",
        "twilio_serverless_v1"
      ]
    }
  }
}
```

### Examples: A Collection of Tools

Load the Incoming Phone Number and the Studio Flows API tools.

```json
{
  "mcpServers": {
    "twilio": {
      "command": "npx",
      "args": [
        "-y",
        "@twilio-alpha/mcp",
        "YOUR_ACCOUNT_SID/YOUR_API_KEY:YOUR_API_SECRET",
        "--tags",
        "Api20100401IncomingPhoneNumber,StudioV2Flow"
      ]
    }
  }
}
```

## Modifying Server

If you prefer to play around with the server, you can clone the repository and run the server locally. Once you've installed the server, `npm run build` and update your client's configuration to use

```json
{
  "mcpServers": {
    "twilio": {
      "command": "node",
      "args": [
        "PATH_TO_REPO/build/index.js",
        "YOUR_ACCOUNT_SID/YOUR_API_KEY:YOUR_API_SECRET"
      ]
    }
  }
}
```

## Available Services

The following services can be used with the `--services` parameter:

- `twilio_accounts_v1` - Account Management API
- `twilio_api_v2010` - Core Twilio API
- `twilio_assistants_v1` - Autopilot API
- `twilio_bulkexports_v1` - Bulk Exports API
- `twilio_chat_v1`, `twilio_chat_v2`, `twilio_chat_v3` - Chat API
- `twilio_content_v1`, `twilio_content_v2` - Content API
- `twilio_conversations_v1` - Conversations API
- `twilio_events_v1` - Events API
- `twilio_flex_v1`, `twilio_flex_v2` - Flex API
- `twilio_frontline_v1` - Frontline API
- `twilio_iam_v1` - Identity and Access Management API
- `twilio_insights_v1` - Insights API
- `twilio_intelligence_v2` - Intelligence API
- `twilio_ip_messaging_v1`, `twilio_ip_messaging_v2` - IP Messaging API
- `twilio_lookups_v1`, `twilio_lookups_v2` - Lookups API
- `twilio_marketplace_v1` - Marketplace API
- `twilio_messaging_v1` - Messaging API
- `twilio_microvisor_v1` - Microvisor API
- `twilio_monitor_v1`, `twilio_monitor_v2` - Monitor API
- `twilio_notify_v1` - Notify API
- `twilio_numbers_v1`, `twilio_numbers_v2` - Phone Numbers API
- `twilio_oauth_v1` - OAuth API
- `twilio_pricing_v1`, `twilio_pricing_v2` - Pricing API
- `twilio_proxy_v1` - Proxy API
- `twilio_routes_v2` - Routes API
- `twilio_serverless_v1` - Serverless API
- `twilio_studio_v1`, `twilio_studio_v2` - Studio API
- `twilio_supersim_v1` - Super SIM API
- `twilio_sync_v1` - Sync API
- `twilio_taskrouter_v1` - TaskRouter API
- `twilio_trunking_v1` - Trunking API
- `twilio_trusthub_v1` - Trust Hub API
- `twilio_verify_v2` - Verify API
- `twilio_video_v1` - Video API
- `twilio_voice_v1` - Voice API
- `twilio_wireless_v1` - Wireless API

For example, to use the Chat API v3, you would specify `--services twilio_chat_v3` in your configuration.

## Available Tags

The following tags can be used with the `--tags` parameter to select specific API endpoints:

### Accounts API Tags
- `AccountsV1AuthTokenPromotion` - Auth Token Promotion
- `AccountsV1Aws` - AWS Integration
- `AccountsV1BulkConsents` - Bulk Consents Management
- `AccountsV1BulkContacts` - Bulk Contacts Management
- `AccountsV1PublicKey` - Public Key Management
- `AccountsV1Safelist` - Safelist Management
- `AccountsV1SecondaryAuthToken` - Secondary Auth Token Management

### API 2010 Tags (Core Twilio API)
- `Api20100401Account` - Account Management
- `Api20100401AddOnResult` - AddOn Results
- `Api20100401Address` - Address Management
- `Api20100401Application` - Application Management
- `Api20100401Call` - Call Management
- `Api20100401Conference` - Conference Management
- `Api20100401IncomingPhoneNumber` - Incoming Phone Number Management
- `Api20100401Message` - Message Management
- `Api20100401Recording` - Recording Management
- `Api20100401Token` - Token Management
- `Api20100401Transcription` - Transcription Management
- `Api20100401Usage` - Usage Management

### Studio API Tags
- `StudioV2Execution` - Flow Execution Management
- `StudioV2ExecutionContext` - Flow Execution Context
- `StudioV2ExecutionStep` - Flow Execution Steps
- `StudioV2Flow` - Flow Management
- `StudioV2FlowRevision` - Flow Revision Management

### Conversations API Tags
- `ConversationsV1Conversation` - Conversation Management
- `ConversationsV1Message` - Message Management
- `ConversationsV1Participant` - Participant Management
- `ConversationsV1Service` - Service Management
- `ConversationsV1User` - User Management

### Serverless API Tags
- `ServerlessV1Asset` - Asset Management
- `ServerlessV1AssetVersion` - Asset Version Management
- `ServerlessV1Build` - Build Management
- `ServerlessV1Deployment` - Deployment Management
- `ServerlessV1Environment` - Environment Management
- `ServerlessV1Function` - Function Management
- `ServerlessV1Service` - Service Management
- `ServerlessV1Variable` - Environment Variable Management

### TaskRouter API Tags
- `TaskrouterV1Activity` - Activity Management
- `TaskrouterV1Event` - Event Management
- `TaskrouterV1Task` - Task Management
- `TaskrouterV1TaskChannel` - Task Channel Management
- `TaskrouterV1TaskQueue` - Task Queue Management
- `TaskrouterV1TaskReservation` - Task Reservation Management
- `TaskrouterV1Worker` - Worker Management
- `TaskrouterV1WorkerChannel` - Worker Channel Management
- `TaskrouterV1WorkerReservation` - Worker Reservation Management
- `TaskrouterV1Workflow` - Workflow Management
- `TaskrouterV1Workspace` - Workspace Management
- `TaskrouterV1WorkspaceStatistics` - Workspace Statistics

This list includes the most commonly used tags. Each service has its own set of tags that follow the pattern `{ServiceName}{Version}{Resource}`. You can combine multiple tags by separating them with commas in your configuration.

## Local Development

```bash
# Clone the repository
git clone https://github.com/twilio/mcp.git
cd mcp

# Install dependencies
npm install

# Build the packages
npm run build
```
