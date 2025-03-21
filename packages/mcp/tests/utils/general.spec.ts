import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, test } from 'vitest';

import {
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
