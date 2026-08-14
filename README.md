<p align="center"><img src="https://github.com/twilio-labs/mcp/blob/246f1b1cd1854d1343468af07a2dfa179dc30a16/docs/twilioAlphaLogoLight.png?raw=true#gh-dark-mode-only" height="70" alt="Twilio Alpha"/><img src="https://github.com/twilio-labs/mcp/blob/246f1b1cd1854d1343468af07a2dfa179dc30a16/docs/twilioAlphaLogoDark.png?raw=true#gh-light-mode-only" height="70" alt="Twilio Alpha"/></p>
<h1 align="center">Twilio MCP Monorepo</h1>

This is a monorepo for the Model Context Protocol server that exposes all of Twilio APIs.

## What is MCP?

The Model Context Protocol (MCP) is a protocol for exchanging model context information between AI tools and services. This implementation allows you to expose Twilio's APIs to AI assistants and other tools that support the MCP protocol.

## Packages

This monorepo contains two main packages:

- [mcp](/packages/mcp) - MCP Server for all of Twilio's Public API
- [openapi-mcp-server](/packages/openapi-mcp-server) - An MCP server that serves the given OpenAPI spec

Each package has its own comprehensive README with detailed documentation:

- [MCP Package Documentation](/packages/mcp/README.md)
- [OpenAPI MCP Server Documentation](/packages/openapi-mcp-server/README.md)

## Quick Start

The easiest way to get started is by using npx:

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

Visit [Twilio API Keys docs](https://www.twilio.com/docs/iam/api-keys) for information on how to find/create your API Key and Secret.

## Security Recommendations

To guard against injection attacks that may allow untrusted systems access to your Twilio data, the ETI team advises users of Twilio MCP servers to avoid installing or running any community MCP servers alongside our official ones. Doing so helps ensure that only trusted MCP servers have access to tools interacting with your Twilio account, reducing the risk of unauthorized data access.

### Deploying safely with AI agents

An MCP server gives an agent the same power your credentials have. For irreversible, billable actions (sending messages, placing calls), a few deployment practices keep one confused or injected agent turn from becoming an incident:

1. **Scope the credentials, not the prompt.** Prompt-level rules ("only text Alice") are advisory; an injected agent can ignore them. Use a [standard API key](https://www.twilio.com/docs/iam/api-keys) rather than your account SID/auth token, and use this server's `--services` and `--tags` flags to expose only the APIs the agent actually needs. Server- and account-side configuration is enforcement; conversation content is not.
2. **Gate write-class tools behind approval.** A tool that composes and sends in one call gives an injected instruction a one-step path to damage. Most MCP clients support per-tool approval — enable it for tools that send, call, or purchase, so a human sees the exact payload at the moment of irreversibility.
3. **Log and review every write.** An independent audit trail (who/what/when/outcome) is the difference between assuming an agent only messaged the intended recipient and knowing it. Review [usage records](https://www.twilio.com/docs/usage/api/usage-record) for volume anomalies.
4. **Evaluate with a test account first.** Run the agent against a [subaccount](https://www.twilio.com/docs/iam/api/subaccounts) or trial credentials before trusting it with production keys, and treat any tool output or inbound message content the agent reads as untrusted input.

## Basic Configuration Options

Both packages accept configuration parameters. Here's a brief overview:

- **MCP Server**: Use `--services` and `--tags` to filter which APIs to expose
- **OpenAPI MCP Server**: Use `--apiPath` to specify OpenAPI spec files location

For complete configuration details, refer to the package-specific documentation linked above.

## Development

```bash
# Run tests
npm test

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Troubleshooting Common Issues

- **Context Size Limitations**: Due to LLM context limits, load specific APIs using `--services` or `--tags`
- **Authentication Issues**: Verify your Twilio API credentials format and permissions
- **API Versioning**: Check you're using the correct API version (v1, v2, v3) for your needs

For detailed troubleshooting guidance, see the package-specific documentation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.
