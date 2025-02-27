import minimist from 'minimist';

import logger from './logger';

interface ParsedArgs {
  accountSid: string;
  apiKey: string;
  apiSecret: string;
}

const args = (argv: string[]): ParsedArgs => {
  const parsed = minimist(argv.slice(2), {
    alias: {
      a: 'accountSid',
      k: 'apiKey',
      s: 'apiSecret',
    },
    string: ['accountSid', 'apiKey', 'apiSecret'],
  });

  const { accountSid, apiKey, apiSecret } = parsed;

  if (!accountSid) {
    logger.error('Error: --accountSid is required.');
    process.exit(1);
  }

  if ((apiKey && !apiSecret) || (!apiKey && apiSecret)) {
    logger.error('Error: --apiKey and --apiSecret must be provided together.');
    process.exit(1);
  }

  // TODO: Brian's use oe secrets will be here to replace apiKey/apiSecret

  // @ts-ignore
  return parsed;
};

export default args;
