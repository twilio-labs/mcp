import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  API,
  OpenAPIMCPServer,
  ToolFilters,
} from '@twilio-alpha/openapi-mcp-server';

import { Credentials } from '@app/types';
import { toolRequiresAccountSid } from '@app/utils';

type Configuration = {
  server: {
    name: string;
    version: string;
  };
  filters?: ToolFilters;
  accountSid: string;
  credentials: Credentials;
};

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');

export default class TwilioOpenAPIMCPServer extends OpenAPIMCPServer {
  private readonly config: Configuration;

  constructor(config: Configuration) {
    super({
      server: config.server,
      openAPIDir: join(ROOT_DIR, 'twilio-oai', 'spec', 'yaml'),
      filters: config.filters,
      authorization: {
        type: 'BasicAuth',
        username: config.credentials.apiKey,
        password: config.credentials.apiSecret,
      },
    });
    this.config = config;
  }

  /**
   * Call a tool with a body
   * @override
   */
  protected callToolBody(tool: Tool, api: API, body: Record<string, unknown>) {
    const { requiresAccountSid, accountSidKey } = toolRequiresAccountSid(tool);
    const providedSid = (body?.[accountSidKey] ?? '') as unknown;
    const hasAccountSid =
      typeof providedSid === 'string' &&
      /^AC[a-fA-F0-9]{32}$/.test(providedSid);
    if (requiresAccountSid && !hasAccountSid) {
      // eslint-disable-next-line no-param-reassign
      body[accountSidKey] = this.config.accountSid;
    }

    return body;
  }
}
