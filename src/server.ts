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
    logger.info('ALOHA');
    logger.info(url);

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

      if (!tool || !api) {
        throw new Error(`Tool (${id}) not found: ${name}`);
      }

      const response = await this.makeRequest(
        api,
        request.params.arguments as Record<string, unknown>,
      );

      // this.logger.info(JSON.stringify({ params }));
      // this.logger.info(JSON.stringify({ tool, api, arugments }));
      // this.logger.info(JSON.stringify({ api }));

      throw new Error(`Tool (${id}) not found: ${name}`);

      // // Find tool by ID or name
      // let tool: Tool | undefined;
      // let toolId: string | undefined;
      //
      // if (id) {
      //   toolId = id.trim();
      //   tool = this.tools.get(toolId);
      // } else if (name) {
      //   for (const [tid, t] of this.tools.entries()) {
      //     if (t.name === name) {
      //       tool = t;
      //       toolId = tid;
      //       break;
      //     }
      //   }
      // }
      //
      // if (!tool || !toolId) {
      //   console.error(
      //     `Available tools: ${Array.from(this.tools.entries())
      //       .map(([id, t]) => `${id} (${t.name})`)
      //       .join(', ')}`,
      //   );
      //   throw new Error(`Tool not found: ${id || name}`);
      // }
      //
      // console.error(`Executing tool: ${toolId} (${tool.name})`);
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
