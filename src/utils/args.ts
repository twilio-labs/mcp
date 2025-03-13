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

  const servicesList: string[] = sArgs ? sArgs.split(',') : [];
  const services = servicesList
    .filter((s) => (s.match(/_/g) || []).length === 1)
    .map((s) => {
      const [name, version] = s.split('_');
      return { name, version };
    });
  const tags: string[] = tArgs ? tArgs.split(',') : [];

  return {
    // if tags provided by no services provided, do not use default service
    services: tArgs ? services : [DEFAULT_SERVICE],
    tags,
    command,
    accountSid,
    apiKey,
    apiSecret,
  };
};

export default parsedArgs;
