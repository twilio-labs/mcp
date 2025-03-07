import minimist from 'minimist';

export type Service = {
  name: string;
  version: string;
};

interface ParsedArgs {
  command: string;
  services: Service[];
  accountSid?: string;
  apiKey?: string;
  apiSecret?: string;
}

const parsedArgs = async (argv: string[]): Promise<ParsedArgs> => {
  const [command, ...args] = argv.slice(2);

  const parsed = minimist(args, {
    alias: {
      a: 'accountSid',
      k: 'apiKey',
      s: 'apiSecret',
      t: 'services',
    },
    string: ['accountSid', 'apiKey', 'apiSecret', 'services'],
  });

  const { services, accountSid, apiKey, apiSecret } = parsed;

  const servicesList: string[] = services ? services.split(',') : [];

  return {
    services: servicesList.map((s) => {
      const [name, version] = s.split('_');
      return { name, version };
    }),
    command,
    accountSid,
    apiKey,
    apiSecret,
  };
};

export default parsedArgs;
