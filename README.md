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
--services # the name of the services you want to use (comma separated, no spaces) - this correponds to the filename https://github.com/twilio/twilio-oai/tree/main/spec/yaml without the `twilio_` prefix - for example `chat_v3` for `twilio_chat_v3`
--tags # The tag name as defined in each of the individual endpoints (comma separated, no spaces). If you want to filter by `tags` only, make sure you pass `--services ''` as an empty object.
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
                "abcd",
                "--services",
                "serverless_v1,numbers_v2"
            ]
        }
    }
}
```

## Logs

The logs for Claude are at ` ~/Library/Logs/Claude/mcp-server-twilio.log`.
