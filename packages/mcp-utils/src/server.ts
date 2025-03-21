import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { loadTools, readSpecs } from '@app/openapi';
import { API, Filter } from '@app/types';
import { Authorization, Http, interpolateUrl, logger } from '@app/utils';

type Configuration = {
  server: {
    name: string;
    version: string;
  };
  openAPIDir: string;
  filter: Filter;
  authorization: Authorization;
};

export default class OpenAPIMCPServer {
  private rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

  public readonly server: Server;

  private tools: Map<string, Tool> = new Map();

  private apis: Map<string, API> = new Map();

  private http: Http;

  private config: Configuration;

  private readonly logger;

  constructor(config: Configuration) {
    this.config = config;
    this.server = new Server(config.server, {
      capabilities: {
        tools: {},
      },
    });
    this.logger = logger.child({ module: config.server.name });
    this.http = new Http({
      authorization: config.authorization,
    });
  }

  public async start(transport: any) {
    await this.loadTools();
    this.setupHandlers();
    await this.server.connect(transport);
  }

  /**
   * Make a request to the API
   * @param api
   * @param body
   * @private
   */
  private async makeRequest(api: API, body?: Record<string, unknown>) {
    const url = interpolateUrl(api.path, body);
    const headers = {
      'Content-Type': api.contentType,
    };

    if (api.method === 'GET') {
      return this.http.get(url, { headers });
    }

    if (api.method === 'POST') {
      return this.http.post(url, body, { headers });
    }

    if (api.method === 'DELETE') {
      return this.http.delete(url, { headers });
    }

    throw new Error(`Unsupported method: ${api.method}`);
  }

  /**
   * Setup request handlers
   * @private
   */
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

  /**
   * Load tools from the OpenAPI specs
   * @private
   */
  private async loadTools() {
    const apiDir = join(this.rootDir, this.config.openAPIDir);
    const specs = await readSpecs(apiDir, apiDir);
    const { tools, apis } = loadTools(specs, this.config.filter);
    this.tools = tools;
    this.apis = apis;
  }
}
