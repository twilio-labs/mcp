#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import TwilioOpenAPIMCPServer from '@app/server';
import { args, logger } from '@app/utils';

const { accountSid, apiSecret, apiKey, services } = args(process.argv);

const server = new TwilioOpenAPIMCPServer({
  server: {
    name: 'twilio-server',
    version: '0.0.1',
  },
  services,
  accountSid,
  credentials: {
    apiKey,
    apiSecret,
  },
});

async function main() {
  const transport = new StdioServerTransport();
  await server.start(transport);
  logger.info('Twilio MCP Server running on stdio');
}

main().catch((error) => {
  logger.error(`Fatal error in main(): ${error}`);
  process.exit(1);
});
