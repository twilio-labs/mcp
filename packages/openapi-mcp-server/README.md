<p align="center"><img src="docs/twilioAlphaLogo.png" height="70" alt="Twilio Alpha"/></p>
<h1 align="center">Twilio MCP Utils</h1>

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
        "@twilio-alpha/mcp-server",
        "--apiPath",
        "<PATH_TO_OPEN_API_YAML_DIR>",
        "--username",
        "YOUR_USERNAME",
        "--password",
        "YOUR_PASSWORD"
      ]
    }
  }
}
```

## Configuration Parameters

You can pass the following optional parameters to the `mcp` server:

**--username / --password (optional)**

If provided, the username/password will be used as basic-auth authentication with the API calls.

**--services (optional)**

The name of the services you want to use - this corresponds to the individual filename inside the directory of your OpenAPI yaml files.

**--tags (optional)**

The tag name as defined in each of the individual endpoints. If you want to filter by `tags` only, make sure you pass `--services ''` as an empty object.

## Extending Server

If you require more control over the server, you can extend `OpenAPIMCPServer`:

```ts
class CustomOpenAPIServer extends OpenAPIMCPServer {
  constructor(config: ExtendedConfiguration) {
    super({
      // these are required
      server: config.server,
      openAPIDir: '/path/to/openapi/yaml',

      // These are optional
      filters: config.filters,
      authorization: {
        type: 'BasicAuth',
        username: config.credentials.apiKey,
        password: config.credentials.apiSecret,
      },
    });

    // perform any other option
  }
}

const server = new CustomOpenAPIServer({ ... });
const transport = new StdioServerTransport();
await server.start(transport);
logger.info('MCP Server running on stdio');
```

### callToolBody(tool: Tool, api: API, body: Record<string, unknown>) => Record<string, unknown>

This method can be used to modify the body of the request before an API call is made.

### callToolResponse(httpResponse: HttpResponse<T>, response: CallToolResponse,) => CallToolResponse

This method can be used to modify the response of the API call before it is sent back to the client.

## Playing With Source Code

If you prefer to play around with the server, you can clone the repository and run the server locally. Once you've installed the server, `npm run build` and update your client's configuration to use

```json
{
  "mcpServers": {
    "openapi-server": {
      "command": "node",
      "args": [
        "PATH_TO_BUILD_SIMPLE.JS",
        "--apiPath",
        "PATH_TO_OPEN_API_YAML_SPEC"
      ]
    }
  }
}
```
