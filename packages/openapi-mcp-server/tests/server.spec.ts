// @ts-nocheck
/* eslint-disable max-classes-per-file, class-methods-use-this */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { loadTools, readSpecs } from '@app/utils';

import { API } from '@app/types';
import OpenAPIMCPServer from '../src/server';

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  return {
    Server: vi.fn().mockImplementation(() => {
      return {
        connect: vi.fn().mockResolvedValue(undefined),
        setRequestHandler: vi.fn(),
      };
    }),
  };
});

vi.mock('@app/utils', async () => {
  const actual = await vi.importActual('@app/utils');
  return {
    ...actual,
    readSpecs: vi.fn(),
    loadTools: vi.fn(),
    logger: {
      child: () => ({
        debug: vi.fn(),
        error: vi.fn(),
      }),
    },
    Http: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    })),
  };
});

describe('OpenAPIMCPServer', () => {
  let mockConfig: any;
  let mockTool: Tool;
  let mockToolId: string;
  let server: OpenAPIMCPServer;

  beforeEach(() => {
    vi.clearAllMocks();

    mockConfig = {
      server: {
        name: 'test-server',
        version: '1.0.0',
        capabilities: {
          tools: {},
        },
      },
      openAPIDir: '/mock/path',
    };

    mockToolId = 'mockService--mockOperationId';
    mockTool = {
      id: mockToolId,
      name: mockToolId,
      description: 'Mock tool description',
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string' },
        },
      },
    };

    const mockApi = {
      path: '/api/resource',
      method: 'GET',
      contentType: 'application/json',
    };

    (readSpecs as Mock).mockResolvedValue([]);
    (loadTools as Mock).mockReturnValue({
      tools: new Map([[mockToolId, mockTool]]),
      apis: new Map([[mockToolId, mockApi]]),
    });

    server = new OpenAPIMCPServer(mockConfig);
  });

  it('should load tools when started', async () => {
    class TestServer extends OpenAPIMCPServer {
      async start() {
        await this.load();
      }

      get toolsMap() {
        return this.tools;
      }

      get apisMap() {
        return this.apis;
      }
    }

    const testServer = new TestServer(mockConfig);
    await testServer.start();

    expect(readSpecs).toHaveBeenCalledWith(
      mockConfig.openAPIDir,
      mockConfig.openAPIDir,
      [],
    );

    expect(loadTools).toHaveBeenCalled();

    expect(testServer.toolsMap.size).toBe(1);
    expect(testServer.apisMap.size).toBe(1);
    expect(testServer.toolsMap.get(mockToolId)).toBe(mockTool);
  });

  it('should initialize with the correct configuration', () => {
    expect(server.configuration).toBe(mockConfig);
    expect(server.capabilities).toHaveProperty('tools');
  });

  it('should check capabilities correctly', () => {
    const capabilitiesServer = new OpenAPIMCPServer({
      ...mockConfig,
      server: {
        ...mockConfig.server,
        capabilities: {
          tools: {},
          resources: {},
        },
      },
    });

    expect(capabilitiesServer.hasCapability('tools')).toBe(true);
    expect(capabilitiesServer.hasCapability('resources')).toBe(true);
    expect(capabilitiesServer.hasCapability('prompts')).toBe(false);

    expect(() => {
      capabilitiesServer.ensureCapability('resources');
    }).not.toThrow();

    expect(() => {
      capabilitiesServer.ensureCapability('prompts');
    }).toThrow('prompts not supported');
  });

  it('should make GET requests via the http util', async () => {
    class TestServer extends OpenAPIMCPServer {
      async start() {
        await this.load();
      }

      public testMakeRequest(id: string, api: any) {
        return this.makeRequest(id, api);
      }
    }

    const testServer = new TestServer(mockConfig);
    await testServer.start();

    const mockResponseData = { result: 'success' };
    const mockHttpResponse = {
      ok: true,
      data: mockResponseData,
      statusCode: 200,
    };

    testServer.http.get = vi.fn().mockResolvedValue(mockHttpResponse);

    const result = await testServer.testMakeRequest('test-id', {
      path: '/api/test',
      method: 'GET',
      contentType: 'application/json',
    });

    expect(testServer.http.get).toHaveBeenCalledWith('/api/test', {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toBe(mockHttpResponse);
  });

  it('should make POST requests via the http util', async () => {
    class TestServer extends OpenAPIMCPServer {
      public testMakeRequest(id: string, api: API, body?: any) {
        return this.makeRequest(id, api, body);
      }
    }

    const testServer = new TestServer(mockConfig);

    const mockResponseData = { result: 'created' };
    const mockHttpResponse = {
      ok: true,
      data: mockResponseData,
      statusCode: 201,
    };

    const mockBody = { name: 'test' };

    testServer.http.post = vi.fn().mockResolvedValue(mockHttpResponse);

    const result = await testServer.testMakeRequest(
      'test-id',
      { path: '/api/test', method: 'POST', contentType: 'application/json' },
      mockBody,
    );

    expect(testServer.http.post).toHaveBeenCalledWith('/api/test', mockBody, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toBe(mockHttpResponse);
  });

  it('should make DELETE requests via the http util', async () => {
    class TestServer extends OpenAPIMCPServer {
      public testMakeRequest(id: string, api: API, body?: any) {
        return this.makeRequest(id, api, body);
      }
    }

    const testServer = new TestServer(mockConfig);

    const mockResponseData = { result: 'deleted' };
    const mockHttpResponse = {
      ok: true,
      data: mockResponseData,
      statusCode: 200,
    };

    testServer.http.delete = vi.fn().mockResolvedValue(mockHttpResponse);

    const result = await testServer.testMakeRequest('test-id', {
      path: '/api/test',
      method: 'DELETE',
      contentType: 'application/json',
    });

    expect(testServer.http.delete).toHaveBeenCalledWith('/api/test', {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toBe(mockHttpResponse);
  });

  it('should throw an error for unsupported HTTP methods', async () => {
    class TestServer extends OpenAPIMCPServer {
      public testMakeRequest(id: string, api: API, body?: any) {
        return this.makeRequest(id, api, body);
      }
    }

    const testServer = new TestServer(mockConfig);

    await expect(
      testServer.testMakeRequest('test-id', {
        path: '/api/test',
        method: 'PATCH' as any,
        contentType: 'application/json',
      }),
    ).rejects.toThrow('Unsupported method: PATCH');
  });

  it('should prepare the body for API calls via callToolBody hook', async () => {
    class CustomServer extends OpenAPIMCPServer {
      protected callToolBody(
        tool: Tool,
        api: API,
        body: Record<string, unknown>,
      ) {
        return { ...body, extra: 'value' };
      }

      public testCallToolBody(
        tool: Tool,
        api: any,
        body: Record<string, unknown>,
      ) {
        return this.callToolBody(tool, api, body);
      }
    }

    const customServer = new CustomServer(mockConfig);

    const result = customServer.testCallToolBody(
      mockTool,
      { path: '/api/test', method: 'POST', contentType: 'application/json' },
      { original: 'data' },
    );

    expect(result).toEqual({ original: 'data', extra: 'value' });
  });

  it('should prepare the response for API calls via callToolResponse hook', async () => {
    class CustomServer extends OpenAPIMCPServer {
      protected callToolResponse(httpResponse: any, response: any) {
        return {
          ...response,
          content: [{ type: 'text', text: 'Modified response' }],
        };
      }

      public testCallToolResponse(httpResponse: any, response: any) {
        return this.callToolResponse(httpResponse, response);
      }
    }

    const customServer = new CustomServer(mockConfig);

    const result = customServer.testCallToolResponse(
      { ok: true, data: { result: 'success' }, statusCode: 200 },
      { content: [{ type: 'text', text: 'Original' }] },
    );

    expect(result).toEqual({
      content: [{ type: 'text', text: 'Modified response' }],
    });
  });

  it('should throw errors for unsupported resource capability', async () => {
    class TestServer extends OpenAPIMCPServer {
      public testHandleReadResource(request: any) {
        return this.handleReadResource(request);
      }
    }

    const noResourceServer = new TestServer({
      ...mockConfig,
      server: {
        ...mockConfig.server,
        capabilities: { tools: {} },
      },
    });

    await expect(
      noResourceServer.testHandleReadResource({ id: 'test' }),
    ).rejects.toThrow('resources not supported');
  });

  it('should throw errors for unsupported prompt capability', async () => {
    class TestServer extends OpenAPIMCPServer {
      public testHandleGetPrompt(request: any) {
        return this.handleGetPrompt(request);
      }
    }

    const noPromptServer = new TestServer({
      ...mockConfig,
      server: {
        ...mockConfig.server,
        capabilities: { tools: {} },
      },
    });

    await expect(
      noPromptServer.testHandleGetPrompt({ id: 'test' }),
    ).rejects.toThrow('prompts not supported');
  });

  it('should call loadCapabilities hook during startup', async () => {
    class CustomCapabilitiesServer extends OpenAPIMCPServer {
      public capabilitiesLoaded = false;

      protected async loadCapabilities() {
        this.capabilitiesLoaded = true;
        this.prompts.set('test-prompt', {
          id: 'test-prompt',
          name: 'Test Prompt',
          content: 'Test content',
        });
      }

      public async testLoad() {
        await this.load();
      }
    }

    const customServer = new CustomCapabilitiesServer(mockConfig);
    await customServer.testLoad();

    expect(customServer.capabilitiesLoaded).toBe(true);
    expect(customServer.prompts.size).toBe(1);
    expect(customServer.prompts.get('test-prompt')).toBeDefined();
  });

  it('should handle tool calls correctly', async () => {
    class TestServer extends OpenAPIMCPServer {
      public async testLoad() {
        await this.load();
      }

      public async testHandleCallTool(request: any) {
        return this.handleCallTool(request);
      }
    }

    const customServer = new TestServer(mockConfig);
    await customServer.testLoad();

    const mockHttpResponse = {
      ok: true,
      data: { result: 'success' },
      statusCode: 200,
    };
    customServer.http.get = vi.fn().mockResolvedValue(mockHttpResponse);

    const result = await customServer.testHandleCallTool({
      params: {
        name: mockToolId,
        arguments: { param1: 'value1' },
      },
    });

    expect(customServer.http.get).toHaveBeenCalledWith('/api/resource', {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ result: 'success' }, null, 2),
        },
      ],
    });
  });

  it('should throw error when tool is not found', async () => {
    class TestServer extends OpenAPIMCPServer {
      public async testLoad() {
        await this.load();
      }

      public async testHandleCallTool(request: any) {
        return this.handleCallTool(request);
      }
    }

    const customServer = new TestServer(mockConfig);
    await customServer.testLoad();

    await expect(
      customServer.testHandleCallTool({
        params: {
          name: 'nonExistentTool--unknown',
          arguments: {},
        },
      }),
    ).rejects.toThrow('Tool (nonExistentTool--unknown) not found: unknown');
  });

  it('should throw error when API call fails', async () => {
    class TestServer extends OpenAPIMCPServer {
      public async testLoad() {
        await this.load();
      }

      public async testHandleCallTool(request: any) {
        return this.handleCallTool(request);
      }
    }

    const customServer = new TestServer(mockConfig);
    await customServer.testLoad();

    const mockErrorResponse = {
      ok: false,
      error: { message: 'API error occurred' },
      statusCode: 400,
    };
    customServer.http.get = vi.fn().mockResolvedValue(mockErrorResponse);

    await expect(
      customServer.testHandleCallTool({
        params: {
          name: mockToolId,
          arguments: {},
        },
      }),
    ).rejects.toThrow('API error occurred');
  });

  it('should check capabilities correctly', () => {
    class TestServer extends OpenAPIMCPServer {
      public testHasCapability(capability: string) {
        return this.hasCapability(capability as any);
      }

      public testEnsureCapability(capability: string) {
        return this.ensureCapability(capability as any);
      }
    }

    const customServer = new TestServer({
      ...mockConfig,
      server: {
        ...mockConfig.server,
        capabilities: {
          tools: {},
          resources: {},
        },
      },
    });

    expect(customServer.testHasCapability('tools')).toBe(true);
    expect(customServer.testHasCapability('resources')).toBe(true);
    expect(customServer.testHasCapability('prompts')).toBe(false);

    expect(() => {
      customServer.testEnsureCapability('resources');
    }).not.toThrow();

    expect(() => {
      customServer.testEnsureCapability('prompts');
    }).toThrow('prompts not supported');
  });
});
