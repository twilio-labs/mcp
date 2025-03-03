#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import init from '@app/init';
import TwilioOpenAPIMCPServer from '@app/server';
import { args, auth, logger } from '@app/utils';

const { services, command } = await args(process.argv);

if (command === 'start') {
  const credentials = await auth.getCredentials();

  if (!credentials) {
    logger.error('Error: No credentials found.');
    process.exit(1);
  }

  const server = new TwilioOpenAPIMCPServer({
    server: {
      name: 'twilio-server',
      version: '0.0.1',
    },
    services,
    accountSid: credentials.accountSid,
    credentials: {
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
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
}

if (command === 'init') {
  await init();
}
