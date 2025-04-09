<p align="center"><img src="https://github.com/twilio-labs/mcp/blob/246f1b1cd1854d1343468af07a2dfa179dc30a16/docs/twilioAlphaLogoLight.png?raw=true#gh-dark-mode-only" height="70" alt="Twilio Alpha"/><img src="https://github.com/twilio-labs/mcp/blob/246f1b1cd1854d1343468af07a2dfa179dc30a16/docs/twilioAlphaLogoDark.png?raw=true#gh-light-mode-only" height="70" alt="Twilio Alpha"/></p>
<h1 align="center">OpenAPI MCP Server</h1>

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
        "@twilio-alpha/openapi-mcp-server",
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

## Security Recommendations

In order to guard against injection attacks, the ETI team recommends that users of Twilio MCP servers do not install or run any community MCP servers alongside ours. Please only use official, trusted MCP servers in order to limit access to Tools that interact with your Twilio account.

## Configuration Parameters

You can pass the following optional parameters to the `mcp` server:

**--username / --password (optional)**

If provided, the username/password will be used as basic-auth authentication with the API calls.

**--services (optional)**

The name of the services you want to use - this corresponds to the individual filename inside the directory of your OpenAPI yaml files.

**--tags (optional)**

The tag name as defined in each of the individual endpoints. If you want to filter by `tags` only, make sure you pass `--services ''` as an empty object.

## Custom Server

First, install the package in your repo:

```bash
# Clone the repository
npm install @twilio-alpha/openapi-mcp-server --save
```

Then you can extend `OpenAPIMCPServer`:

```ts
import {
  OpenAPIMCPServer,
  OpenAPIMCPServerConfiguration,
} from '@twilio-alpha/openapi-mcp-server';

class CustomOpenAPIServer extends OpenAPIMCPServer {
  constructor(config: OpenAPIMCPServerConfiguration) {
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


### loadCapabilities() => Promise<void>

Use this method to load/modify any additional capabilities, such as making change to the default tools or adding resources.

_Note_: To enable resources, include

```js
const configuration = {
  server: {
    name: config.server.name,
    version: config.server.version,
    capabilities: {
      resources: {},
      tools: {},
    },
  }
}
```

#### Example

```ts
/**
 * Loads resources for the server
 * @returns
 */
protected async loadCapabilities(): Promise<void> {
  this.resources.push({
    uri: 'text://accountSid',
    name: 'Twilio AccountSid',
    description: 'The account SID for the Twilio account',
  });

  this.prompts.set('userSid', {
    name: 'Twilio UserSid',
    description: 'The UserSid for the Twilio account',
    arguments: [
      {
        name: 'userSid'
        description: 'The UserSid for the Twilio account',
        required: true,
      },
    ],
  });

  // Modify anything else here
}
```

### callToolBody(tool: Tool, api: API, body: Record<string, unknown>) => Record<string, unknown>

This method can be used to modify the body of the request before an API call is made.

### callToolResponse(httpResponse: HttpResponse<T>, response: CallToolResponse,) => CallToolResponse

This method can be used to modify the response of the API call before it is sent back to the client.

###  handleReadResource(request: ReadResourceRequest) => Promise<ReadResourceResult>

Use this method to handle Resource loading.

#### Example

```ts
/**
 * Handles read resource requests
 * @param request
 * @returns
 */
protected async handleReadResource(
  request: ReadResourceRequest,
): Promise<ReadResourceResult> {
  const { uri, name } = request.params;
  if (uri === 'text://accountSid') {
    return {
      contents: [
        {
          uri,
          name,
          mimeType: 'text/plain',
          text: `The Twilio accountSid is ${this.config.accountSid}`,
        },
      ],
    };
  }

  throw new Error(`Resource ${name} not found`);
}
```

For more information see [resources#example-implementation](https://modelcontextprotocol.io/docs/concepts/resources#example-implementation)

### protected async handleGetPrompt(request: GetPromptRequest) => Promise<GetPromptResult>

```ts
/**
 * Handles the get prompt request
 * @param request the request to handle
 */
protected async handleGetPrompt(
  request: GetPromptRequest,
): Promise<GetPromptResult> {
  const { name, arguments } = request.params;
  if (name === 'twilio-userSid') {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `The Twilio UserSid is ${arguments.userSid}`,
          },
        },
      ],
    };
  }

  throw new Error(`Prompt ${name} not found`);
}
```

For more information see [prompts#example-implementation](https://modelcontextprotocol.io/docs/concepts/prompts#example-implementation)
