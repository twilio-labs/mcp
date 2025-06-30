#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { logger, OpenAPIMCPServer, OpenAPIMCPServerConfiguration } from '.';
import parsedArgs from './utils/args';

(async () => {
  const args = await parsedArgs(process.argv);
  const config: OpenAPIMCPServerConfiguration = {
    server: {
      name: 'openapi-mcp-server',
      version: '0.0.1',
    },
    filters: {
      services: args.services,
      tags: args.tags,
    },
    openAPIDir: args.apiPath,
  };
  if (args.authorization) {
    config.authorization = args.authorization;
  }

  const server = new OpenAPIMCPServer(config);
  const transport = new StdioServerTransport();
  await server.start(transport);
  logger.info('Twilio MCP Server running on stdio');
})();
