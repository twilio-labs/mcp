#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import TwilioOpenAPIMCPServer from '@app/server';
import { logger } from '@app/utils';

const [accountSid, authToken] = process.argv.slice(2);

const server = new TwilioOpenAPIMCPServer({
  server: {
    name: 'twilio-server',
    version: '0.0.1',
  },
  accountSid,
  authToken,
});

async function main() {
  const transport = new StdioServerTransport();
  await server.start(transport);
  logger.info('Twilio MCP Server running on stdio');
}

main().catch((error) => {
  logger.error('Fatal error in main():', error);
  process.exit(1);
});
