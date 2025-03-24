import minimist from 'minimist';

export type Service = {
  name: string;
  version: string;
};

interface ParsedArgs {
  services: string[];
  tags: string[];
  apiPath: string;
  username?: string;
  password?: string;
}

const sanitizeArgs = (args: string): string[] => {
  return args
    ? args
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
    : [];
};

const parsedArgs = async (argv: string[]): Promise<ParsedArgs> => {
  const parsed = minimist(argv, {
    alias: {
      a: 'apiPath',
      t: 'tags',
      s: 'services',
      u: 'username',
      p: 'password',
    },
    string: ['apiPath', 'tags', 'services', 'username', 'password'],
  });

  // eslint-disable-next-line prefer-const
  let { services, tags, apiPath, username, password } = parsed;
  if (!apiPath) {
    throw new Error('apiPath is required');
  }

  return {
    services: sanitizeArgs(services),
    tags: sanitizeArgs(tags),
    apiPath,
    username,
    password,
  };
};

export default parsedArgs;
