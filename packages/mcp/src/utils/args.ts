import { logger } from '@twilio-alpha/openapi-mcp-server';
import minimist from 'minimist';

import { isValidTwilioSid } from './general';

interface ParsedArgs {
  services: string[];
  tags: string[];
  accountSid?: string;
  apiKey?: string;
  apiSecret?: string;
}

const DEFAULT_SERVICE = 'twilio_api_v2010';

const sanitizeArgs = (args: string): string[] => {
  return args
    ? args
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
    : [];
};

const parsedArgs = async (argv: string[]): Promise<ParsedArgs> => {
  const args = argv.slice(2);
  const firstArg = args[0];

  const parsed = minimist(argv, {
    alias: {
      a: 'accountSid',
      k: 'apiKey',
      s: 'apiSecret',
      t: 'tags',
      e: 'services',
    },
    string: ['accountSid', 'apiKey', 'apiSecret', 'tags', 'services'],
  });

  // eslint-disable-next-line prefer-const
  let { services: sArgs, accountSid, apiKey, apiSecret, tags: tArgs } = parsed;

  // Handle "accountSid/apiKey:apiSecret" format
  if (
    !accountSid &&
    !apiKey &&
    !apiSecret &&
    firstArg &&
    firstArg.includes('/')
  ) {
    const credsMatch = firstArg.match(/^([^/]+)\/([^:]+):(.+)$/);

    if (credsMatch) {
      const potentialAccountSid = credsMatch[1];
      const potentialApiKey = credsMatch[2];
      const potentialApiSecret = credsMatch[3];

      if (
        isValidTwilioSid(potentialAccountSid, 'AC') &&
        isValidTwilioSid(potentialApiKey, 'SK')
      ) {
        accountSid = potentialAccountSid;
        apiKey = potentialApiKey;
        apiSecret = potentialApiSecret;
      }
    }
  }

  if (accountSid && !isValidTwilioSid(accountSid, 'AC')) {
    logger.error('Error: Invalid AccountSid');
    process.exit(1);
  }

  if (apiKey && !isValidTwilioSid(apiKey, 'SK')) {
    logger.error('Error: Invalid ApiKey');
    process.exit(1);
  }

  let services = sanitizeArgs(sArgs);
  if (services.length === 0 && !tArgs) {
    services = [DEFAULT_SERVICE];
  }

  const tags = sanitizeArgs(tArgs);

  return {
    services,
    tags,
    accountSid,
    apiKey,
    apiSecret,
  };
};

export default parsedArgs;
