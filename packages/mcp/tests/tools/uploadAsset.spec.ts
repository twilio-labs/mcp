import FormData from 'form-data';
import { describe, expect, it, beforeEach, vi, Mock } from 'vitest';
import { Http } from '@twilio-alpha/openapi-mcp-server/build/utils';
import {
  uploadAssetExecution,
  uploadAssetDefinition,
  uploadAssetAPI,
  name,
} from '../../src/tools/uploadAsset';

// Mock FormData
vi.mock('form-data', () => {
  const MockFormData = vi.fn();
  MockFormData.prototype.append = vi.fn();
  return { default: MockFormData };
});

describe('uploadAsset', () => {
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

  describe('uploadAssetExecution', () => {
    it('should correctly format and upload the asset content', async () => {
      const params = {
        serviceSid: 'ZS12345678901234567890123456789012',
        assetSid: 'FN12345678901234567890123456789012',
        path: '/styles.css',
        visibility: 'public',
        content: 'body { font-family: sans-serif; }',
        contentType: 'text/css',
      };

      await uploadAssetExecution(params, mockHttp);

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
        `https://serverless-upload.twilio.com/v1/Services/${params.serviceSid}/Assets/${params.assetSid}/Versions`,
        expect.any(FormData),
      );
    });

    it('should handle errors during upload', async () => {
      const params = {
        serviceSid: 'ZS12345678901234567890123456789012',
        assetSid: 'FN12345678901234567890123456789012',
        path: '/styles.css',
        visibility: 'public',
        content: 'body { font-family: sans-serif; }',
        contentType: 'text/css',
      };

      const error = new Error('Upload failed');
      (mockHttp.upload as Mock).mockRejectedValue(error);

      const result = await uploadAssetExecution(params, mockHttp);

      expect(result).toEqual({
        ok: false,
        statusCode: 500,
        error,
      });
    });

    it('should use the provided content type in the form data', async () => {
      const params = {
        serviceSid: 'ZS12345678901234567890123456789012',
        assetSid: 'FN12345678901234567890123456789012',
        path: '/data.json',
        visibility: 'public',
        content: '{"key": "value"}',
        contentType: 'application/json',
      };

      await uploadAssetExecution(params, mockHttp);

      // Check the content was added with the correct content type
      const formInstance = (FormData as unknown as Mock).mock.instances[0];
      const contentAppendCall = formInstance.append.mock.calls[2];

      expect(contentAppendCall[0]).toBe('Content');
      expect(contentAppendCall[2]).toEqual({
        filename: 'asset',
        contentType: 'application/json',
      });
    });
  });

  describe('uploadAssetDefinition', () => {
    it('should have correct name', () => {
      expect(name).toBe('TwilioServerlessV1--UploadServerlessAsset');
      expect(uploadAssetDefinition.name).toBe(name);
    });

    it('should have a description', () => {
      expect(uploadAssetDefinition.description).toBeTruthy();
    });

    it('should have a valid inputSchema', () => {
      const schema = uploadAssetDefinition.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toHaveProperty('serviceSid');
      expect(schema.properties).toHaveProperty('assetSid');
      expect(schema.properties).toHaveProperty('path');
      expect(schema.properties).toHaveProperty('visibility');
      expect(schema.properties).toHaveProperty('content');
      expect(schema.properties).toHaveProperty('contentType');

      // Check required fields
      expect(schema.required).toContain('serviceSid');
      expect(schema.required).toContain('assetSid');
      expect(schema.required).toContain('path');
      expect(schema.required).toContain('visibility');
      expect(schema.required).toContain('content');
    });
  });

  describe('uploadAssetAPI', () => {
    it('should have correct API configuration', () => {
      expect(uploadAssetAPI.method).toBe('POST');
      expect(uploadAssetAPI.contentType).toBe('multipart/form-data');
      expect(uploadAssetAPI.path).toBe('fake');
    });
  });
});
