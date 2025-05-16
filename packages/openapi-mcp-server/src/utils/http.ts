import fetch, { Response } from 'node-fetch';
import FormData from 'form-data';
import qs from 'qs';

import { HttpMethod } from '@app/types';

import logger from './logger';

type SuccessResponse<T> = {
  ok: true;
  statusCode: number;
  data: T;
  response?: Response;
};

type ErrorResponse = {
  ok: false;
  statusCode: number;
  error: Error;
  response?: Response;
};

export type HttpResponse<T> = SuccessResponse<T> | ErrorResponse;

type RequestOption = {
  headers?: Record<string, string>;
};
type HttpRequest = RequestOption & {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
};

export type Authorization = {
  type: 'BasicAuth';
  username: string;
  password: string;
};

export type Configuration = {
  authorization?: Authorization;
};

const arrayRepeatUrls = ['serverless.twilio.com'];

/**
 * Get the authorization header
 * @param authorization
 */
function getAuthorization(
  authorization?: Authorization,
): Record<string, string> {
  if (!authorization) {
    return {};
  }

  if (authorization.type === 'BasicAuth') {
    return {
      Authorization: `Basic ${Buffer.from(
        `${authorization.username}:${authorization.password}`,
      ).toString('base64')}`,
    };
  }

  throw new Error(`Unsupported authorization type: ${authorization.type}`);
}

/**
 * Interpolate URL with params
 * @param url
 * @param params
 */
export const interpolateUrl = (
  url: string,
  params?: Record<string, unknown>,
) => {
  if (!params) {
    return url;
  }

  if (Array.isArray(params)) {
    return url;
  }

  return url.replace(/{(.*?)}/g, (_, key) => {
    const value = params[key];
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value.toString();
    }

    return `{${key}}`;
  });
};

export default class Http {
  private readonly defaultRequest: RequestInit;

  private readonly logger;

  constructor(config: Configuration) {
    this.defaultRequest = {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthorization(config.authorization),
      },
    };

    this.logger = logger.child({ module: 'Http' });
  }

  /**
   * Makes a request to the downstream service
   */
  private async make<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    try {
      logger.debug(`request object: ${JSON.stringify(request)}`);

      const options: RequestInit = {
        ...this.defaultRequest,
        method: request.method,
      };
      if (request.headers) {
        // @ts-ignore
        options.headers = {
          ...this.defaultRequest?.headers,
          ...request.headers,
        };
      }

      // Handle FormData objects specially
      if (request.body && '__formData' in request.body) {
        // @ts-ignore
        if (options.headers['Content-Type']) {
          // @ts-ignore
          delete options.headers['Content-Type'];
        }
        // @ts-ignore
        // eslint-disable-next-line no-underscore-dangle
        options.body = request.body.__formData;
      } else if (['POST', 'PUT'].includes(request.method) && request.body) {
        const arrayRepeated = arrayRepeatUrls.some((x) =>
          request.url.includes(x),
        );
        options.body = Http.getBody(
          request.body,
          request.headers,
          arrayRepeated,
        );
      }

      logger.debug(
        `Making request to ${request.url} with options ${JSON.stringify(
          options,
        )}`,
      );
      const response = await fetch(request.url, options as any);

      if (!response.ok) {
        const errorMessage = await response.text();
        return {
          ok: false,
          statusCode: response.status,
          error: new Error(errorMessage),
          response,
        };
      }

      const data = (await response.json()) as T;
      const successResponse: SuccessResponse<T> = {
        ok: true,
        statusCode: response.status,
        data,
        response,
      };
      logger.debug('Request successful');

      return successResponse;
    } catch (error) {
      logger.error(`Failed to make request ${error}`);

      return {
        ok: false,
        statusCode: 500,
        error: new Error('An error occurred while making the request'),
      };
    }
  }

  /**
   * Makes a GET request
   * @param url the url to make the request to
   * @param options additional options for the request
   */
  public async get<T>(
    url: string,
    options?: RequestOption,
  ): Promise<HttpResponse<T>> {
    return this.make<T>({
      url,
      method: 'GET',
      ...options,
    });
  }

  /**
   * Makes a POST request
   * @param url the url to make the request to
   * @param body the body of the request
   * @param options additional options for the request
   */
  public async post<T>(
    url: string,
    body?: Record<string, unknown>,
    options?: RequestOption,
  ): Promise<HttpResponse<T>> {
    return this.make<T>({
      url,
      body,
      method: 'POST',
      ...options,
    });
  }

  /**
   * Makes a PUT request
   * @param url the url to make the request to
   * @param body the body of the request
   * @param options additional options for the request
   */
  public async put<T>(
    url: string,
    body?: Record<string, unknown>,
    options?: RequestOption,
  ): Promise<HttpResponse<T>> {
    return this.make<T>({
      url,
      body,
      method: 'PUT',
      ...options,
    });
  }

  /**
   * Makes a DELETE request
   * @param url the url to make the request to
   * @param options additional options for the request
   */
  public async delete<T>(
    url: string,
    options?: RequestOption,
  ): Promise<HttpResponse<T>> {
    return this.make<T>({
      url,
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * Makes a multipart form data upload request
   * @param url the url to make the request to
   * @param formData the FormData instance to upload
   * @param options additional options for the request
   */
  public async upload<T>(
    url: string,
    formData: FormData,
    options?: RequestOption,
  ): Promise<HttpResponse<T>> {
    const formHeaders = formData.getHeaders ? formData.getHeaders() : {};

    const headers = {
      ...(options?.headers || {}),
      ...formHeaders,
    };

    return this.make<T>({
      url,
      method: 'POST',
      headers,
      // Use a special symbol or property to indicate this is a FormData object
      // rather than a regular body that needs serialization
      body: { __formData: formData },
    });
  }

  /**
   * Returns the body of the request
   * @param body
   * @param headers
   * @private
   */
  private static getBody(
    body: Record<string, unknown>,
    headers?: Record<string, string>,
    arrayRepeat?: boolean,
  ): string {
    const contentType = headers?.['Content-Type'] as string;
    if (contentType === 'application/x-www-form-urlencoded') {
      if (arrayRepeat) {
        return qs.stringify(body, {
          arrayFormat: 'repeat',
          indices: false,
        });
      }

      const processedBody: Record<string, unknown> = {};
      Object.keys(body).forEach((key) => {
        const value = body[key];
        if (value !== null && typeof value === 'object') {
          processedBody[key] = JSON.stringify(value);
        } else {
          processedBody[key] = value;
        }
      });

      return qs.stringify(processedBody);
    }

    return JSON.stringify(body);
  }
}
