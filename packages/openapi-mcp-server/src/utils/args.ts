import minimist from 'minimist';
import { Authorization } from './http';

export type Service = {
  name: string;
  version: string;
};

interface ParsedArgs {
  services: string[];
  tags: string[];
  apiPath: string;
  authorization?: Authorization;
}

export const sanitizeArgs = (args: string): string[] => {
  return args
    ? args
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
    : [];
};

export const parseAuthorization = (auth: string): Authorization => {
  const parts = auth.split('/');
  if (parts.length < 2) {
    throw new Error('Invalid authorization format');
  }

  const [type, credentials] = parts;
  switch (type) {
    case 'Basic': {
      const [username, password] = credentials.split(':');
      if (!username || !password) {
        throw new Error(
          'Basic authorization must include username and password separated by ":"',
        );
      }
      return { type: 'Basic', username, password };
    }
    case 'Bearer': {
      if (credentials.length === 0) {
        throw new Error('Bearer authorization token cannot be empty');
      }
      return { type: 'Bearer', token: credentials };
    }
    case 'ApiKey': {
      const [key, value] = credentials.split(':');
      if (!key || !value) {
        throw new Error(
          'ApiKey authorization must include key and value separated by ":"',
        );
      }
      return { type: 'ApiKey', key, value };
    }
    default:
      throw new Error('Unsupported authorization type');
  }
};

const parsedArgs = async (argv: string[]): Promise<ParsedArgs> => {
  const parsed = minimist(argv, {
    alias: {
      a: 'apiPath',
      t: 'tags',
      s: 'services',
      p: 'authorization',
    },
    string: ['apiPath', 'tags', 'services', 'authorization'],
  });

  // eslint-disable-next-line prefer-const
  let { services, tags, apiPath, authorization } = parsed;
  if (!apiPath) {
    throw new Error('apiPath is required');
  }

  let parsedAuthorization;
  if (authorization) {
    parsedAuthorization = parseAuthorization(authorization);
  }

  return {
    services: sanitizeArgs(services),
    tags: sanitizeArgs(tags),
    apiPath,
    authorization: parsedAuthorization,
  };
};

export default parsedArgs;
