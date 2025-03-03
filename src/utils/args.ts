import minimist from 'minimist';

import logger from './logger';

export type Service = {
  name: string;
  version: string;
};

interface ParsedArgs {
  accountSid: string;
  apiKey: string;
  apiSecret: string;
  services: Service[];
}

const args = (argv: string[]): ParsedArgs => {
  const parsed = minimist(argv.slice(2), {
    alias: {
      a: 'accountSid',
      k: 'apiKey',
      s: 'apiSecret',
      t: 'services',
    },
    string: ['accountSid', 'apiKey', 'apiSecret', 'services'],
  });

  const { accountSid, apiKey, apiSecret, services } = parsed;

  if (!accountSid) {
    logger.error('Error: --accountSid is required.');
    process.exit(1);
  }

  if ((apiKey && !apiSecret) || (!apiKey && apiSecret)) {
    logger.error('Error: --apiKey and --apiSecret must be provided together.');
    process.exit(1);
  }

  // TODO: Brian's use oe secrets will be here to replace apiKey/apiSecret

  const servicesList: string[] = services ? services.split(',') : [];

  return {
    accountSid,
    apiKey,
    apiSecret,
    services: servicesList.map((s) => {
      const [name, version] = s.split('_');
      return { name, version };
    }),
  };
};

export default args;
