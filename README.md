# mcp

This is a PoC project by the ETI team on the use of [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) for the exchange of model context information between different tools.

## Getting Started

1) Clone the repository
2) `npm install`
3) `npm run build`

## Using the MCP Server

You first need to `build` the server using `npm run build`. Then in the client, reference the `build/index.js` file. You need to pass the following arguments:

```
--accountSid # the accountSid of your account
--apiKey # the apiKey of your account
--apiSecret # the apiSecret of your account
```

This step depends on the client implementation. For example, with Claude, you should edit `~/Library/Application\ Support/Claude/claude_desktop_config.json` and paste (change the path to your `build/index.js`):

```json
{
    "mcpServers": {
        "twilio": {
            "command": "node",
            "args": [
                "/Users/ktalebian/Projects/github/twilio-internal/mcp/build/index.js",
                "--accountSid",
                "ACxxx",
                "--apiKey",
                "SKxxx",
                "--apiSecret",
                "abcd"
            ]
        }
    }
}
```

## Logs

The logs for Claude are at ` ~/Library/Logs/Claude/mcp-server-twilio.log`.
