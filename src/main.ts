import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import TwilioOpenAPIMCPServer from '@app/server';
import { args, auth, logger, type AccountCredentials } from '@app/utils';

let credentials: AccountCredentials | null;

const { services, accountSid, apiKey, apiSecret, tags } = await args(
  process.argv,
);
if (accountSid && apiKey && apiSecret) {
  credentials = { accountSid, apiKey, apiSecret };
} else {
  credentials = await auth.getCredentials();
}

if (!credentials) {
  logger.error('Error: No credentials found.');
  process.exit(1);
}

const server = new TwilioOpenAPIMCPServer({
  server: {
    name: 'twilio-server',
    version: '0.0.1',
  },
  filter: {
    services,
    tags,
  },
  accountSid: credentials.accountSid,
  credentials: {
    apiKey: credentials.apiKey,
    apiSecret: credentials.apiSecret,
  },
});

export default async function main() {
  const transport = new StdioServerTransport();
  await server.start(transport);
  logger.info('Twilio MCP Server running on stdio');
}
