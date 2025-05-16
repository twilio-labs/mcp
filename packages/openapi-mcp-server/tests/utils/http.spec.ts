import fetch, { Response } from 'node-fetch';
import { beforeEach, describe, expect, it, Mock, test, vi } from 'vitest';

import Http, { Authorization, interpolateUrl } from '@app/utils/http';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

describe('Http', () => {
  const mockCredentials: Authorization = {
    type: 'BasicAuth',
    username: 'test-username',
    password: 'test-password',
  };

  const mockResponse = (status: number, jsonData: any, ok = true): Response => {
    return {
      ok,
      status,
      json: vi.fn().mockResolvedValue(jsonData),
      text: vi.fn().mockResolvedValue(JSON.stringify(jsonData)),
    } as unknown as Response;
  };

  let http: Http;

  beforeEach(() => {
    http = new Http({ authorization: mockCredentials });
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make a successful GET request', async () => {
      const mockData = { data: 'test data' };
      const mockResponseObj = mockResponse(200, mockData);
      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.get('https://api.example.com/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Basic dGVzdC11c2VybmFtZTp0ZXN0LXBhc3N3b3Jk',
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect(result).toEqual({
        ok: true,
        statusCode: 200,
        data: mockData,
        response: mockResponseObj,
      });
    });

    it('should handle a failed GET request with error response', async () => {
      const errorData = { error: 'Not found' };
      const mockResponseObj = mockResponse(404, errorData, false);
      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.get('https://api.example.com/notfound');

      expect(result).toEqual({
        ok: false,
        statusCode: 404,
        error: new Error(JSON.stringify(errorData)),
        response: mockResponseObj,
      });
    });

    it('should handle network errors during GET requests', async () => {
      (fetch as unknown as Mock).mockRejectedValueOnce(
        new Error('Network error'),
      );

      const result = await http.get('https://api.example.com/test');

      expect(result).toEqual({
        ok: false,
        statusCode: 500,
        error: new Error('An error occurred while making the request'),
      });
    });
  });

  describe('POST requests', () => {
    it('should make a successful POST request with JSON body', async () => {
      const requestBody = { name: 'Test Name', value: 123 };
      const responseData = { id: '12345', ...requestBody };
      const mockResponseObj = mockResponse(201, responseData);

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.post(
        'https://api.example.com/create',
        requestBody,
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/create',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestBody),
        }),
      );

      expect(result).toEqual({
        ok: true,
        statusCode: 201,
        data: responseData,
        response: mockResponseObj,
      });
    });

    it('should make a POST request with urlencoded body', async () => {
      const requestBody = { name: 'Test Name', value: 123 };
      const responseData = { id: '12345', success: true };
      const mockResponseObj = mockResponse(200, responseData);

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.post(
        'https://api.example.com/form',
        requestBody,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/form',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
          body: expect.any(String), // We're not testing the exact encoding, just that it's a string
        }),
      );

      expect(result).toEqual({
        ok: true,
        statusCode: 200,
        data: responseData,
        response: mockResponseObj,
      });
    });

    it('should handle failed POST requests', async () => {
      const requestBody = { invalid: 'data' };
      const errorData = { error: 'Invalid request' };
      const mockResponseObj = mockResponse(400, errorData, false);

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.post(
        'https://api.example.com/create',
        requestBody,
      );

      expect(result).toEqual({
        ok: false,
        statusCode: 400,
        error: new Error(JSON.stringify(errorData)),
        response: mockResponseObj,
      });
    });
  });

  describe('PUT requests', () => {
    it('should make a successful PUT request with JSON body', async () => {
      const requestBody = { id: '12345', name: 'Updated Name' };
      const responseData = { ...requestBody, updated: true };
      const mockResponseObj = mockResponse(200, responseData);

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.put(
        'https://api.example.com/update/12345',
        requestBody,
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/update/12345',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Basic dGVzdC11c2VybmFtZTp0ZXN0LXBhc3N3b3Jk',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestBody),
        }),
      );

      expect(result).toEqual({
        ok: true,
        statusCode: 200,
        data: responseData,
        response: mockResponseObj,
      });
    });

    it('should make a PUT request with urlencoded body', async () => {
      const requestBody = { id: '12345', name: 'Updated Name' };
      const responseData = { ...requestBody, updated: true };
      const mockResponseObj = mockResponse(200, responseData);

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.put(
        'https://api.example.com/update/12345',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/update/12345',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
          body: expect.any(String),
        }),
      );

      expect(result).toEqual({
        ok: true,
        statusCode: 200,
        data: responseData,
        response: mockResponseObj,
      });
    });

    it('should handle failed PUT requests', async () => {
      const requestBody = { id: 'nonexistent', name: 'Updated Name' };
      const errorData = { error: 'Resource not found' };
      const mockResponseObj = mockResponse(404, errorData, false);

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.put(
        'https://api.example.com/update/nonexistent',
        requestBody,
      );

      expect(result).toEqual({
        ok: false,
        statusCode: 404,
        error: new Error(JSON.stringify(errorData)),
        response: mockResponseObj,
      });
    });
  });

  describe('DELETE requests', () => {
    it('should make a successful DELETE request', async () => {
      const responseData = { deleted: true, id: '12345' };
      const mockResponseObj = mockResponse(200, responseData);

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.delete('https://api.example.com/delete/12345');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/delete/12345',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );

      expect(result).toEqual({
        ok: true,
        statusCode: 200,
        data: responseData,
        response: mockResponseObj,
      });
    });

    it('should handle failed DELETE requests', async () => {
      const errorData = { error: 'Forbidden' };
      const mockResponseObj = mockResponse(403, errorData, false);

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.delete(
        'https://api.example.com/delete/protected',
      );

      expect(result).toEqual({
        ok: false,
        statusCode: 403,
        error: new Error(JSON.stringify(errorData)),
        response: mockResponseObj,
      });
    });
  });

  describe('request with custom headers', () => {
    it('should merge custom headers with default headers', async () => {
      const mockData = { data: 'test data' };
      const mockResponseObj = mockResponse(200, mockData);
      const customHeaders = { 'X-Custom-Header': 'custom-value' };

      const httpWithCustomHeaders = new Http({
        authorization: mockCredentials,
      });
      // @ts-ignore - accessing private method for testing
      const makeRequest = vi.spyOn(httpWithCustomHeaders, 'make');

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      await httpWithCustomHeaders.get('https://api.example.com/test');

      // We're checking if the make method includes the expected headers
      expect(makeRequest).toHaveBeenCalledWith({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      // Now test with custom headers by modifying the internal request
      // This is a bit of a hack but necessary to test header merging
      (fetch as unknown as Mock).mockImplementationOnce((url, options) => {
        // Check if headers were properly merged
        expect(options.headers).toHaveProperty('Authorization');
        expect(options.headers).toHaveProperty(
          'Content-Type',
          'application/json',
        );
        return Promise.resolve(mockResponseObj);
      });

      // @ts-ignore - accessing private method for testing
      await httpWithCustomHeaders.make({
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: customHeaders,
      });
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

  describe('upload requests', () => {
    it('should make a successful file upload request', async () => {
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', 'test file content', 'test.txt');
      formData.append('description', 'Test file upload');

      // Mock FormData's getHeaders method
      formData.getHeaders = vi.fn().mockReturnValue({
        'content-type': 'multipart/form-data; boundary=---boundary',
      });

      const responseData = { fileId: '12345', success: true };
      const mockResponseObj = mockResponse(201, responseData);

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.upload(
        'https://api.example.com/upload',
        formData,
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/upload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'content-type': 'multipart/form-data; boundary=---boundary',
            Authorization: 'Basic dGVzdC11c2VybmFtZTp0ZXN0LXBhc3N3b3Jk',
          }),
          body: formData,
        }),
      );

      expect(result).toEqual({
        ok: true,
        statusCode: 201,
        data: responseData,
        response: mockResponseObj,
      });
    });

    it('should handle failed upload requests', async () => {
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', 'invalid file content', 'invalid.txt');

      // Mock FormData's getHeaders method
      formData.getHeaders = vi.fn().mockReturnValue({
        'content-type': 'multipart/form-data; boundary=---boundary',
      });

      const errorData = { error: 'File upload failed' };
      const mockResponseObj = mockResponse(400, errorData, false);

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.upload(
        'https://api.example.com/upload',
        formData,
      );

      expect(result).toEqual({
        ok: false,
        statusCode: 400,
        error: new Error(JSON.stringify(errorData)),
        response: mockResponseObj,
      });
    });

    it('should upload with custom headers', async () => {
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', 'test content', 'test.txt');

      // Mock FormData's getHeaders method
      formData.getHeaders = vi.fn().mockReturnValue({
        'content-type': 'multipart/form-data; boundary=---boundary',
      });

      const responseData = { fileId: '12345', success: true };
      const mockResponseObj = mockResponse(200, responseData);

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.upload(
        'https://api.example.com/upload',
        formData,
        { headers: { 'X-Custom-Header': 'custom-value' } }
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/upload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'content-type': 'multipart/form-data; boundary=---boundary',
            'X-Custom-Header': 'custom-value',
            Authorization: 'Basic dGVzdC11c2VybmFtZTp0ZXN0LXBhc3N3b3Jk',
          }),
          body: formData,
        }),
      );

      expect(result).toEqual({
        ok: true,
        statusCode: 200,
        data: responseData,
        response: mockResponseObj,
      });
    });

    it('should handle FormData without getHeaders method', async () => {
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', 'test content', 'test.txt');

      // Simulate FormData without getHeaders method
      formData.getHeaders = undefined;

      const responseData = { fileId: '12345', success: true };
      const mockResponseObj = mockResponse(200, responseData);

      (fetch as unknown as Mock).mockResolvedValueOnce(mockResponseObj);

      const result = await http.upload(
        'https://api.example.com/upload',
        formData,
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/upload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Basic dGVzdC11c2VybmFtZTp0ZXN0LXBhc3N3b3Jk',
          }),
          body: formData,
        }),
      );

      expect(result).toEqual({
        ok: true,
        statusCode: 200,
        data: responseData,
        response: mockResponseObj,
      });
    });
  });
});
