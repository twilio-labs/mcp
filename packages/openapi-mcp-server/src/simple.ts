#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { Configuration, logger, OpenAPIMCPServer } from '.';
import parsedArgs from './utils/args';

const args = await parsedArgs(process.argv);
const config: Configuration = {
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
if (args.username && args.password) {
  config.authorization = {
    type: 'BasicAuth',
    username: args.username,
    password: args.password,
  };
}

const server = new OpenAPIMCPServer(config);
const transport = new StdioServerTransport();
await server.start(transport);
logger.info('Twilio MCP Server running on stdio');
