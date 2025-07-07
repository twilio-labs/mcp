import { describe, it, expect } from 'vitest';
import parsedArgs, { sanitizeArgs, parseAuthorization } from '@app/utils/args';
import { Authorization } from '@app/utils/http';

describe('Args', () => {
  describe('sanitizeArgs', () => {
    it('should return an empty array for empty input', () => {
      expect(sanitizeArgs('')).toEqual([]);
    });

    it('should split and trim a string of comma-separated values', () => {
      expect(sanitizeArgs(' one, two , three ')).toEqual([
        'one',
        'two',
        'three',
      ]);
    });

    it('should filter out empty values from the input', () => {
      expect(sanitizeArgs('one, , ,three')).toEqual(['one', 'three']);
    });

    it('should return an empty array when input is null or undefined', () => {
      expect(sanitizeArgs(undefined)).toEqual([]);
      expect(sanitizeArgs(null)).toEqual([]);
    });
  });

  // Test Suite for `parseAuthorization` function
  describe('parseAuthorization', () => {
    it('should throw an error for invalid authorization format', () => {
      expect(() => parseAuthorization('invalid')).toThrow(
        'Invalid authorization format',
      );
    });

    it('should parse Basic authorization correctly', () => {
      const authString = 'Basic/username:password';
      const expected: Authorization = {
        type: 'Basic',
        username: 'username',
        password: 'password',
      };
      expect(parseAuthorization(authString)).toEqual(expected);
    });

    it('should parse Bearer authorization correctly', () => {
      const authString = 'Bearer/someToken';
      const expected: Authorization = {
        type: 'Bearer',
        token: 'someToken',
      };
      expect(parseAuthorization(authString)).toEqual(expected);
    });

    it('should parse ApiKey authorization correctly', () => {
      const authString = 'ApiKey/key:value';
      const expected: Authorization = {
        type: 'ApiKey',
        key: 'key',
        value: 'value',
      };
      expect(parseAuthorization(authString)).toEqual(expected);
    });

    it('should throw an error for unsupported authorization types', () => {
      expect(() => parseAuthorization('Unsupported/credential')).toThrow(
        'Unsupported authorization type',
      );
    });

    it('should throw an error for Invalid authorization format', () => {
      expect(() => parseAuthorization('Unsupported credential')).toThrow(
        'Invalid authorization format',
      );
    });
  });

  describe('parsedArgs', () => {
    it('should parse command line arguments correctly', async () => {
      const argv = [
        '--apiPath',
        '/api/path',
        '--services',
        'service1,service2',
        '--tags',
        'tag1,tag2',
        '--authorization',
        'Bearer/token123',
      ];
      const result = await parsedArgs(argv);
      expect(result.apiPath).toBe('/api/path');
      expect(result.services).toEqual(['service1', 'service2']);
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.authorization).toEqual({
        type: 'Bearer',
        token: 'token123',
      });
    });

    it('should throw an error if apiPath is missing', async () => {
      const argv = ['--services', 'service1,service2'];
      await expect(parsedArgs(argv)).rejects.toThrow('apiPath is required');
    });

    it('should not include authorization if it is not provided', async () => {
      const argv = ['--apiPath', '/api/path'];
      const result = await parsedArgs(argv);
      expect(result.apiPath).toBe('/api/path');
      expect(result.authorization).toBeUndefined();
    });
  });
});
