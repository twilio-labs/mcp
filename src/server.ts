import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import loadTools from '@app/openapi/loadTools';
import readSpecs from '@app/openapi/specs';
import { API } from '@app/types';
import { Http, interpolateUrl, logger } from '@app/utils';

type Environment = 'dev' | 'stage' | 'prod';

type Configuration = {
  server: {
    name: string;
    version: string;
  };
  accountSid: string;
  authToken: string;
  env?: Environment;
};

export default class TwilioOpenAPIMCPServer {
  private rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

  public readonly server: Server;

  private tools: Map<string, Tool> = new Map();

  private apis: Map<string, API> = new Map();

  private http: Http;

  private readonly accountSid: string;

  private env: Environment;

  private readonly logger;

  constructor(config: Configuration) {
    this.server = new Server(config.server, {
      capabilities: {
        tools: {},
      },
    });
    this.env = config.env ?? 'prod';
    this.logger = logger.child({ module: 'TwilioOpenAPIMCPServer' });

    this.accountSid = config.accountSid;
    this.http = new Http({
      credentials: {
        accountSid: config.accountSid,
        authToken: config.authToken,
      },
    });
  }

  public async start(transport: any) {
    await this.loadTools();
    this.setupHandlers();
    await this.server.connect(transport);

    this.logger.info('Twilio OpenAPI MCP server started');
  }

  private async makeRequest(api: API, body?: Record<string, unknown>) {
    const url = interpolateUrl(api.path, body);

    if (api.method === 'GET') {
      return this.http.get(url);
    }

    if (api.method === 'POST') {
      return this.http.post(url, body, { urlencoded: api.urlencoded });
    }

    if (api.method === 'DELETE') {
      return this.http.delete(url, { urlencoded: api.urlencoded });
    }

    throw new Error(`Unsupported method: ${api.method}`);
  }

  private static requiresAccountSid(tool: Tool) {
    const requiresAccountSid =
      tool.inputSchema.properties?.AccountSid ||
      tool.inputSchema.properties?.accountSid;

    if (!requiresAccountSid) {
      return { requiresAccountSid: false, accountSidKey: '' };
    }

    if (tool.inputSchema.properties?.AccountSid) {
      return { requiresAccountSid: true, accountSidKey: 'AccountSid' };
    }

    return { requiresAccountSid: true, accountSidKey: 'accountSid' };
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name } = request.params;
      const id: string = name.split('---')[1]?.trim();
      const tool = this.tools.get(id);
      const api = this.apis.get(id);
      const body = (request.params.arguments as Record<string, unknown>) ?? {};

      if (!tool || !api) {
        throw new Error(`Tool (${id}) not found: ${name}`);
      }

      this.logger.info('ALOHA');
      this.logger.info(JSON.stringify(body));

      const { requiresAccountSid, accountSidKey } =
        TwilioOpenAPIMCPServer.requiresAccountSid(tool);
      const providedSid = (body?.[accountSidKey] ?? '') as unknown;
      const hasAccountSid =
        typeof providedSid === 'string' &&
        /^AC[a-fA-F0-9]{32}$/.test(providedSid);
      if (requiresAccountSid && !hasAccountSid) {
        body[accountSidKey] = this.accountSid;
      }

      const response = await this.makeRequest(api, body);
      if (!response.ok) {
        this.logger.error({
          message: 'failed to make request',
          api,
          tool,
          response,
        });
        throw new Error(response.error.message);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    });
  }

  private async loadTools() {
    const apiDir = join(this.rootDir, 'open-api', 'spec');
    const specs = await readSpecs(apiDir, apiDir);
    const { tools, apis } = loadTools(specs);
    this.tools = tools;
    this.apis = apis;
  }
}
