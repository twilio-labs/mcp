// @ts-nocheck
/* eslint-disable max-classes-per-file, class-methods-use-this */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { API } from '@twilio-alpha/openapi-mcp-server';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { toolRequiresAccountSid } from '@app/utils';

import TwilioOpenAPIMCPServer from '../src/server';

// Mock dependencies
vi.mock('path', () => ({
  join: vi.fn().mockReturnValue('/mocked/path'),
  dirname: vi.fn().mockReturnValue('/mocked/dirname'),
}));

vi.mock('url', () => ({
  fileURLToPath: vi.fn().mockReturnValue('/mocked/file/path'),
}));

vi.mock('@app/utils', () => ({
  toolRequiresAccountSid: vi.fn(),
}));

vi.mock('@twilio-alpha/openapi-mcp-server', () => {
  const constructorCalls = [];

  class MockOpenAPIMCPServer {
    constructor(config) {
      constructorCalls.push(config);
    }

    protected callToolBody() {}

    protected handleReadResource() {}

    protected loadCapabilities() {}
  }

  // Expose the calls for testing
  MockOpenAPIMCPServer.getConstructorCalls = () => constructorCalls;

  return {
    OpenAPIMCPServer: MockOpenAPIMCPServer,
  };
});

describe('TwilioOpenAPIMCPServer', () => {
  let server: TwilioOpenAPIMCPServer;
  const mockConfig = {
    server: {
      name: 'test-server',
      version: '1.0.0',
    },
    accountSid: 'AC00000000000000000000000000000000',
    credentials: {
      apiKey: 'SK00000000000000000000000000000000',
      apiSecret: 'testApiSecret',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    server = new TwilioOpenAPIMCPServer(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize correctly with provided config', () => {
      expect(server.config).toBe(mockConfig);
    });
  });

  describe('systemPrompt', () => {
    it('should include the accountSid in the system prompt', () => {
      const accountSid = 'AC12345';
      const prompt = TwilioOpenAPIMCPServer.systemPrompt(accountSid);
      expect(prompt).toContain(accountSid);
      expect(prompt).toContain('You are an agent to call Twilio APIs');
    });
  });

  describe('callToolBody', () => {
    it('should add accountSid when tool requires it and none is provided', () => {
      // Setup mock to indicate that tool requires accountSid
      (toolRequiresAccountSid as Mock).mockReturnValue({
        requiresAccountSid: true,
        accountSidKey: 'AccountSid',
      });

      const mockTool = { name: 'TestTool' } as Tool;
      const mockApi = { path: '/test' } as API;
      const mockBody = { param1: 'value1' };

      // Call method
      const result = server.callToolBody(mockTool, mockApi, mockBody);

      // Check if accountSid was added
      expect(result).toEqual({
        param1: 'value1',
        AccountSid: mockConfig.accountSid,
      });
    });

    it('should not modify body when accountSid is already provided', () => {
      // Setup mock to indicate that tool requires accountSid
      (toolRequiresAccountSid as Mock).mockReturnValue({
        requiresAccountSid: true,
        accountSidKey: 'AccountSid',
      });

      const mockTool = { name: 'TestTool' } as Tool;
      const mockApi = { path: '/test' } as API;
      const providedSid = 'AC11111111111111111111111111111111';
      const mockBody = {
        param1: 'value1',
        AccountSid: providedSid,
      };

      // Call method
      const result = server.callToolBody(mockTool, mockApi, mockBody);

      // Check body wasn't modified
      expect(result).toEqual(mockBody);
      expect(result.AccountSid).toBe(providedSid);
    });

    it('should not add accountSid when tool does not require it', () => {
      // Setup mock to indicate tool doesn't require accountSid
      (toolRequiresAccountSid as Mock).mockReturnValue({
        requiresAccountSid: false,
        accountSidKey: '',
      });

      const mockTool = { name: 'TestTool' } as Tool;
      const mockApi = { path: '/test' } as API;
      const mockBody = { param1: 'value1' };

      // Call method
      const result = server.callToolBody(mockTool, mockApi, mockBody);

      // Check body wasn't modified
      expect(result).toEqual(mockBody);
      expect(result).not.toHaveProperty('AccountSid');
      expect(result).not.toHaveProperty('accountSid');
    });

    it('should replace invalid accountSid with the configured one', () => {
      // Setup mock to indicate that tool requires accountSid
      (toolRequiresAccountSid as Mock).mockReturnValue({
        requiresAccountSid: true,
        accountSidKey: 'accountSid',
      });

      const mockTool = { name: 'TestTool' } as Tool;
      const mockApi = { path: '/test' } as API;
      const mockBody = {
        param1: 'value1',
        accountSid: 'invalid-sid', // Invalid format
      };

      // Call method
      const result = server.callToolBody(mockTool, mockApi, mockBody);

      // Check accountSid was replaced
      expect(result.accountSid).toBe(mockConfig.accountSid);
    });
  });

  describe('handleReadResource', () => {
    it('should return accountSid information for the correct uri', async () => {
      const request = {
        params: {
          uri: 'text://accountSid',
          name: 'Twilio AccountSid',
        },
      };

      const result = await server.handleReadResource(request);

      expect(result).toEqual({
        contents: [
          {
            uri: 'text://accountSid',
            name: 'Twilio AccountSid',
            mimeType: 'text/plain',
            text: `The Twilio accountSid is ${mockConfig.accountSid}`,
          },
        ],
      });
    });

    it('should throw error for unknown resources', async () => {
      const request = {
        params: {
          uri: 'text://unknown',
          name: 'Unknown Resource',
        },
      };

      await expect(server.handleReadResource(request)).rejects.toThrow(
        'Resource Unknown Resource not found',
      );
    });
  });

  describe('loadCapabilities', () => {
    it('should add accountSid resource to resources list', async () => {
      // Mock resources array
      server.resources = [];

      // Call method
      await server.loadCapabilities();

      // Check if resource was added
      expect(server.resources).toEqual([
        {
          uri: 'text://accountSid',
          name: 'Twilio AccountSid',
          description: 'The account SID for the Twilio account',
        },
      ]);
    });
  });
});
