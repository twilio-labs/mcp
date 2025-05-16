import { join } from 'path';

import {
  ReadResourceRequest,
  ReadResourceResult,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import {
  API,
  OpenAPIMCPServer,
  ToolFilters,
} from '@twilio-alpha/openapi-mcp-server';

import { Credentials } from '@app/types';
import { toolRequiresAccountSid } from '@app/utils';
import { loadAdditionalTools, uploadFunction, uploadAsset } from '@app/tools';

type Configuration = {
  server: {
    name: string;
    version: string;
  };
  filters?: ToolFilters;
  accountSid: string;
  credentials: Credentials;
};

const ROOT_DIR = join(__dirname, '..');

export default class TwilioOpenAPIMCPServer extends OpenAPIMCPServer {
  private readonly config: Configuration;

  constructor(config: Configuration) {
    super({
      server: {
        name: config.server.name,
        version: config.server.version,
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
        instructions: TwilioOpenAPIMCPServer.systemPrompt(config.accountSid),
      },
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
   * Sets the system prompt for the server
   * @param accountSid
   * @returns
   */
  private static systemPrompt(accountSid: string): string {
    return `You are an agent to call Twilio APIs. If no accountSid is provided, you MUST use ${accountSid}`;
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

  /**
   * Handles read resource requests
   * @param request
   * @returns
   */
  protected async handleReadResource(
    request: ReadResourceRequest,
  ): Promise<ReadResourceResult> {
    const { uri, name } = request.params;
    if (uri === 'text://accountSid') {
      return {
        contents: [
          {
            uri,
            name,
            mimeType: 'text/plain',
            text: `The Twilio accountSid is ${this.config.accountSid}`,
          },
        ],
      };
    }

    throw new Error(`Resource ${name} not found`);
  }

  protected async makeRequest(
    id: string,
    api: API,
    body?: Record<string, unknown>,
  ) {
    if (id === uploadFunction.name && body) {
      return uploadFunction.uploadFunctionExecution(body, this.http);
    }
    if (id === uploadAsset.name && body) {
      return uploadAsset.uploadAssetExecution(body, this.http);
    }

    return super.makeRequest(id, api, body);
  }

  /**
   * Loads resources for the server
   * @returns
   */
  protected async loadCapabilities(): Promise<void> {
    this.resources.push({
      uri: 'text://accountSid',
      name: 'Twilio AccountSid',
      description: 'The account SID for the Twilio account',
      mimeType: 'text/plain',
    });

    for (const [id, tool] of this.tools) {
      if (tool.inputSchema?.properties?.AccountSid) {
        const originalDescription = tool.description;
        const enhancedDescription = `${originalDescription} (Uses default AccountSid: ${this.config.accountSid} if not provided)`;
        const updatedTool = {
          ...tool,
          description: enhancedDescription,
        };

        this.tools.set(id, updatedTool);
      }
    }

    const additionalTools = loadAdditionalTools(this.configuration?.filters);
    for (const [id, { tool, api }] of additionalTools) {
      this.tools.set(id, tool);
      this.apis.set(id, api);
    }
  }
}
