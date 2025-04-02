import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequest,
  CallToolRequestSchema,
  CallToolResult,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequest,
  ReadResourceRequestSchema,
  ReadResourceResult,
  Resource,
  ServerCapabilities,
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
    capabilities?: ServerCapabilities;
  };
  openAPIDir: string;
  filters?: ToolFilters;
  authorization?: Authorization;
};

export default class OpenAPIMCPServer {
  public readonly server: Server;

  protected capabilities: ServerCapabilities;

  protected resources: Resource[] = [];

  protected tools: Map<string, Tool> = new Map();

  protected apis: Map<string, API> = new Map();

  protected readonly configuration: Configuration;

  protected readonly logger;

  private http: Http;

  constructor(config: Configuration) {
    this.configuration = config;
    this.capabilities = {
      tools: {},
      ...config.server.capabilities,
    };
    this.server = new Server(config.server, {
      capabilities: this.capabilities,
    });
    this.logger = logger.child({ module: config.server.name });
    this.http = new Http({
      authorization: config.authorization,
    });
  }

  public async start(transport: any) {
    await this.load();
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
    response: CallToolResult,
  ): CallToolResult {
    return response;
  }

  /**
   * Custom hook for extending capabilities
   */
  protected async loadCapabilities() {
    /* no--op */
  }

  /**
   * Handles the read resource request
   * @param request the request to handle
   */
  protected async handleReadResource(
    request: ReadResourceRequest,
  ): Promise<ReadResourceResult> {
    this.ensureCapability('resources');

    throw new Error(
      'handleReadResource method must be implemented to handle resource reading',
    );
  }

  /**
   * Ensure that the server has the specified capability
   * @param capability
   */
  protected ensureCapability(capability: keyof typeof this.capabilities) {
    if (!this.hasCapability(capability)) {
      throw new Error(`${capability} not supported`);
    }
  }

  /**
   * Check if the server has the specified capability
   * @param capability
   * @returns
   */
  protected hasCapability(capability: keyof typeof this.capabilities): boolean {
    return capability in this.capabilities;
  }

  /**
   * Setup request handlers
   * @private
   */
  private setupHandlers(): void {
    if (this.hasCapability('resources')) {
      /**
       * List resources
       */
      this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return {
          resources: this.resources,
        };
      });

      this.server.setRequestHandler(
        ReadResourceRequestSchema,
        this.handleReadResource.bind(this),
      );
    }

    /**
     * List tools
     */
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()),
      };
    });

    /**
     * Call tool
     */
    this.server.setRequestHandler(
      CallToolRequestSchema,
      this.handleCallTool.bind(this),
    );
  }

  /**
   * Handles the Call Tool
   * @param request
   * @returns
   */
  private async handleCallTool(request: CallToolRequest) {
    const { name } = request.params;
    const id: string = name.split('---')[1]?.trim();
    const tool = this.tools.get(id);
    const api = this.apis.get(id);
    if (!tool || !api) {
      throw new Error(`Tool (${id}) not found: ${name}`);
    }
    const rawBody = request.params.arguments ?? {};
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
    const response: CallToolResult = {
      content: [
        {
          type: 'text',
          text: JSON.stringify(httpResponse.data, null, 2),
        },
      ],
    };

    return this.callToolResponse(httpResponse, response);
  }

  /**
   * Load tools from the OpenAPI specs
   * @private
   */
  private async load() {
    const apiDir = this.configuration.openAPIDir;
    const specs = await readSpecs(apiDir, apiDir);
    const { tools, apis } = loadTools(specs, this.configuration.filters);
    this.tools = tools;
    this.apis = apis;

    // Load additional capabilities
    await this.loadCapabilities();
  }
}
