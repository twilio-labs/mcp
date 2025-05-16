import FormData from 'form-data';
import { describe, expect, it, beforeEach, vi, Mock } from 'vitest';
import { Http } from '@twilio-alpha/openapi-mcp-server/build/utils';
import {
  uploadFunctionExecution,
  uploadFunctionDefinition,
  uploadFunctionAPI,
  name,
} from '../../src/tools/uploadFunction';

// Mock FormData
vi.mock('form-data', () => {
  const MockFormData = vi.fn();
  MockFormData.prototype.append = vi.fn();
  return { default: MockFormData };
});

describe('uploadFunction', () => {
  let mockHttp: Http;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock Http
    mockHttp = {
      upload: vi.fn().mockResolvedValue({
        ok: true,
        statusCode: 200,
        data: { sid: 'FN12345678901234567890123456789012' },
      }),
    } as unknown as Http;
  });

  describe('uploadFunctionExecution', () => {
    it('should correctly format and upload the function content', async () => {
      const params = {
        serviceSid: 'ZS12345678901234567890123456789012',
        functionSid: 'FN12345678901234567890123456789012',
        path: '/hello-world',
        visibility: 'public',
        content:
          'exports.handler = function(context, event, callback) { callback(null, "Hello World"); };',
      };

      await uploadFunctionExecution(params, mockHttp);

      // Check FormData was constructed
      expect(FormData).toHaveBeenCalledTimes(1);

      // Check form.append was called correctly
      const formInstance = (FormData as unknown as Mock).mock.instances[0];
      expect(formInstance.append).toHaveBeenCalledWith('Path', params.path);
      expect(formInstance.append).toHaveBeenCalledWith(
        'Visibility',
        params.visibility,
      );

      // Third call should have been for the content buffer
      expect(formInstance.append).toHaveBeenCalledTimes(3);

      // Check that upload was called with the correct URL
      expect(mockHttp.upload).toHaveBeenCalledTimes(1);
      expect(mockHttp.upload).toHaveBeenCalledWith(
        `https://serverless-upload.twilio.com/v1/Services/${params.serviceSid}/Functions/${params.functionSid}/Versions`,
        expect.any(FormData),
      );
    });

    it('should handle errors during upload', async () => {
      const params = {
        serviceSid: 'ZS12345678901234567890123456789012',
        functionSid: 'FN12345678901234567890123456789012',
        path: '/hello-world',
        visibility: 'public',
        content:
          'exports.handler = function(context, event, callback) { callback(null, "Hello World"); };',
      };

      const error = new Error('Upload failed');
      (mockHttp.upload as Mock).mockRejectedValue(error);

      const result = await uploadFunctionExecution(params, mockHttp);

      expect(result).toEqual({
        ok: false,
        statusCode: 500,
        error,
      });
    });
  });

  describe('uploadFunctionDefinition', () => {
    it('should have correct name', () => {
      expect(name).toBe('TwilioServerlessV1--UploadServerlessFunction');
      expect(uploadFunctionDefinition.name).toBe(name);
    });

    it('should have a description', () => {
      expect(uploadFunctionDefinition.description).toBeTruthy();
    });

    it('should have a valid inputSchema', () => {
      const schema = uploadFunctionDefinition.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toHaveProperty('serviceSid');
      expect(schema.properties).toHaveProperty('functionSid');
      expect(schema.properties).toHaveProperty('path');
      expect(schema.properties).toHaveProperty('visibility');
      expect(schema.properties).toHaveProperty('content');

      // Check required fields
      expect(schema.required).toContain('serviceSid');
      expect(schema.required).toContain('functionSid');
      expect(schema.required).toContain('path');
      expect(schema.required).toContain('visibility');
      expect(schema.required).toContain('content');
    });
  });

  describe('uploadFunctionAPI', () => {
    it('should have correct API configuration', () => {
      expect(uploadFunctionAPI.method).toBe('POST');
      expect(uploadFunctionAPI.contentType).toBe('multipart/form-data');
      expect(uploadFunctionAPI.path).toBe('fake');
    });
  });
});
