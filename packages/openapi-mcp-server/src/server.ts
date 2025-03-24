import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { API } from '@app/types';
import {
  Authorization,
  Http,
  interpolateUrl,
  loadTools,
  logger,
  readSpecs,
  ToolFilters,
} from '@app/utils';
import { HttpResponse } from '@app/utils/http';

export type Configuration = {
  server: {
    name: string;
    version: string;
  };
  openAPIDir: string;
  filters?: ToolFilters;
  authorization?: Authorization;
};

type CallToolResponse = {
  content: {
    type: 'text';
    text: string;
  }[];
};

export default class OpenAPIMCPServer {
  public readonly server: Server;

  protected tools: Map<string, Tool> = new Map();

  protected apis: Map<string, API> = new Map();

  private http: Http;

  private readonly configuration: Configuration;

  protected readonly logger;

  constructor(config: Configuration) {
    this.configuration = config;
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
  protected async makeRequest(api: API, body?: Record<string, unknown>) {
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
   * Prepare the body for the API call
   * @param tool the tool being called
   * @param api the API definition of the tool
   * @param body the raw body from the request
   * @protected
   */
  // eslint-disable-next-line class-methods-use-this
  protected callToolBody(tool: Tool, api: API, body: Record<string, unknown>) {
    return body;
  }

  /**
   * Prepare the response for the API call
   * @param httpResponse the HTTP response from the API call
   * @param response the response to be sent to the client
   * @protected
   */
  // eslint-disable-next-line class-methods-use-this
  protected callToolResponse<T>(
    httpResponse: HttpResponse<T>,
    response: CallToolResponse,
  ): CallToolResponse {
    return response;
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
      if (!tool || !api) {
        throw new Error(`Tool (${id}) not found: ${name}`);
      }
      const rawBody =
        (request.params.arguments as Record<string, unknown>) ?? {};
      const body = this.callToolBody(tool, api, rawBody);

      const httpResponse = await this.makeRequest(api, body);
      if (!httpResponse.ok) {
        this.logger.error({
          message: 'failed to make request',
          api,
          tool,
          httpResponse,
        });
        throw new Error(httpResponse.error.message);
      }
      const response: CallToolResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(httpResponse.data, null, 2),
          },
        ],
      };

      return this.callToolResponse(httpResponse, response);
    });
  }

  /**
   * Load tools from the OpenAPI specs
   * @private
   */
  private async loadTools() {
    const apiDir = this.configuration.openAPIDir;
    const specs = await readSpecs(apiDir, apiDir);
    const { tools, apis } = loadTools(specs, this.configuration.filters);
    this.tools = tools;
    this.apis = apis;
  }
}
