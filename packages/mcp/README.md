# mcp

This is a Proof of Concept (PoC) project by the ETI team, exploring the use of [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) for the exchange of model context information between different tools.

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

Alternatively, use the `npx -y @twilio-alpha config` command to set your credentials, choose tags and services, and automatically save MCP client configuration for Cursor or Claude Desktop.

Visit [Twilio API Keys docs](https://www.twilio.com/docs/iam/api-keys) for information on how to find/create your apiKey/apiSecret.

## Configuration Parameters

You can pass the following optional parameters to the `mcp` server:

**--services (optional)** 

The name of the services you want to use - this corresponds to the filename https://github.com/twilio/twilio-oai/tree/main/spec/yaml without the `twilio_` prefix - for example `chat_v3` for `twilio_chat_v3`.

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
        "serverless_v1"
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