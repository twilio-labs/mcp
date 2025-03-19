import minimist from 'minimist';

export type Service = {
  name: string;
  version: string;
};

interface ParsedArgs {
  command: string;
  services: Service[];
  tags: string[];
  accountSid?: string;
  apiKey?: string;
  apiSecret?: string;
}

const DEFAULT_SERVICE = { name: 'api', version: 'v2010' };

const sanitizeArgs = (args: string): string[] => {
  return args
    ? args
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
    : [];
};

const parsedArgs = async (argv: string[]): Promise<ParsedArgs> => {
  const [command, ...args] = argv.slice(2);

  const parsed = minimist(args, {
    alias: {
      a: 'accountSid',
      k: 'apiKey',
      s: 'apiSecret',
      t: 'tags',
      e: 'services',
    },
    string: ['accountSid', 'apiKey', 'apiSecret', 'tags', 'services'],
  });

  const {
    services: sArgs,
    accountSid,
    apiKey,
    apiSecret,
    tags: tArgs,
  } = parsed;

  const servicesList = sanitizeArgs(sArgs);

  let services = servicesList
    .filter((s: string) => (s.match(/_/g) || []).length === 1)
    .map((s: string) => {
      const [name, version] = s.split('_');
      return { name, version };
    });

  if (services.length === 0 && !tArgs) {
    services = [DEFAULT_SERVICE];
  }

  const tags = sanitizeArgs(tArgs);

  return {
    services,
    tags,
    command,
    accountSid,
    apiKey,
    apiSecret,
  };
};

export default parsedArgs;
