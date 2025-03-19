import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, test } from 'vitest';

import {
  interpolateUrl,
  isValidTwilioSid,
  toolRequiresAccountSid,
} from '../../src/utils/general';

describe('general', () => {
  describe('isValidTwilioSid', () => {
    test('should return true for valid SIDs', () => {
      expect(isValidTwilioSid('AC1234567890123456789012345678901a', 'AC')).toBe(
        true,
      );
      expect(isValidTwilioSid('SK1234567890123456789012345678901b', 'SK')).toBe(
        true,
      );
    });

    test('should return false for invalid SIDs', () => {
      // Wrong prefix
      expect(isValidTwilioSid('AC1234567890123456789012345678901', 'SK')).toBe(
        false,
      );

      // Wrong length
      expect(isValidTwilioSid('AC123456789012345678901234567890', 'AC')).toBe(
        false,
      );
      expect(isValidTwilioSid('AC1234567890123456789012345012', 'AC')).toBe(
        false,
      );

      // Invalid characters
      expect(isValidTwilioSid('AC1234567890123456789012345678$01', 'AC')).toBe(
        false,
      );

      // Empty string
      expect(isValidTwilioSid('', 'AC')).toBe(false);
    });
  });

  describe('interpolateUrl', () => {
    test('should return the original URL if no params are provided', () => {
      expect(interpolateUrl('/api/v1/resource')).toBe('/api/v1/resource');
      expect(interpolateUrl('/api/v1/resource', undefined)).toBe(
        '/api/v1/resource',
      );
    });

    test('should return the original URL if params is an array', () => {
      expect(interpolateUrl('/api/v1/resource', [] as any)).toBe(
        '/api/v1/resource',
      );
    });

    test('should replace string parameters in the URL', () => {
      expect(interpolateUrl('/api/{version}/resource', { version: 'v1' })).toBe(
        '/api/v1/resource',
      );

      expect(
        interpolateUrl('/api/{version}/resource/{id}', {
          version: 'v1',
          id: 'abc123',
        }),
      ).toBe('/api/v1/resource/abc123');
    });

    test('should replace number parameters in the URL', () => {
      expect(interpolateUrl('/api/v1/resource/{id}', { id: 123 })).toBe(
        '/api/v1/resource/123',
      );
    });

    test('should replace boolean parameters in the URL', () => {
      expect(
        interpolateUrl('/api/v1/resource/{active}', { active: true }),
      ).toBe('/api/v1/resource/true');

      expect(
        interpolateUrl('/api/v1/resource/{active}', { active: false }),
      ).toBe('/api/v1/resource/false');
    });

    test('should not replace parameters of unsupported types', () => {
      expect(
        interpolateUrl('/api/v1/resource/{obj}', { obj: { key: 'value' } }),
      ).toBe('/api/v1/resource/{obj}');

      expect(interpolateUrl('/api/v1/resource/{arr}', { arr: [1, 2, 3] })).toBe(
        '/api/v1/resource/{arr}',
      );

      expect(interpolateUrl('/api/v1/resource/{nul}', { nul: null })).toBe(
        '/api/v1/resource/{nul}',
      );
    });

    test('should handle multiple replacements of different types', () => {
      expect(
        interpolateUrl('/api/{version}/resource/{id}/status/{active}', {
          version: 'v1',
          id: 123,
          active: true,
        }),
      ).toBe('/api/v1/resource/123/status/true');
    });

    test('should leave placeholders for missing parameters', () => {
      expect(
        interpolateUrl('/api/{version}/resource/{id}', { version: 'v1' }),
      ).toBe('/api/v1/resource/{id}');
    });
  });

  describe('toolRequiresAccountSid', () => {
    test('should return false when tool does not require AccountSid', () => {
      const tool: Tool = {
        name: 'TestTool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            param1: { type: 'string' },
            param2: { type: 'number' },
          },
          required: ['param1'],
        },
      } as Tool;

      expect(toolRequiresAccountSid(tool)).toEqual({
        requiresAccountSid: false,
        accountSidKey: '',
      });
    });

    test('should detect AccountSid with capital A', () => {
      const tool: Tool = {
        name: 'TestTool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            AccountSid: { type: 'string' },
            param2: { type: 'number' },
          },
          required: ['AccountSid'],
        },
      } as Tool;

      expect(toolRequiresAccountSid(tool)).toEqual({
        requiresAccountSid: true,
        accountSidKey: 'AccountSid',
      });
    });

    test('should detect accountSid with lowercase a', () => {
      const tool: Tool = {
        name: 'TestTool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            accountSid: { type: 'string' },
            param2: { type: 'number' },
          },
          required: ['accountSid'],
        },
      } as Tool;

      expect(toolRequiresAccountSid(tool)).toEqual({
        requiresAccountSid: true,
        accountSidKey: 'accountSid',
      });
    });

    test('should prioritize AccountSid with capital A if both are present', () => {
      const tool: Tool = {
        name: 'TestTool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            AccountSid: { type: 'string' },
            accountSid: { type: 'string' },
          },
          required: ['AccountSid'],
        },
      } as Tool;

      expect(toolRequiresAccountSid(tool)).toEqual({
        requiresAccountSid: true,
        accountSidKey: 'AccountSid',
      });
    });
  });
});
