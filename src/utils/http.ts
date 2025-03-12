import fetch, { Response } from 'node-fetch';
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

type HttpResponse<T> = SuccessResponse<T> | ErrorResponse;

type RequestOption = {
  urlencoded?: boolean;
};
type HttpRequest = RequestOption & {
  method: HttpMethod;
  url: string;
  headers?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

export type Credentials = {
  apiKey: string;
  apiSecret: string;
};

type Configuration = {
  credentials: Credentials;
};

export default class Http {
  private readonly defaultRequest: RequestInit;

  private readonly logger;

  constructor(config: Configuration) {
    const credentials = Buffer.from(
      `${config.credentials.apiKey}:${config.credentials.apiSecret}`,
    ).toString('base64');
    this.defaultRequest = {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
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
      if (request.urlencoded) {
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        };
      }

      if (['POST', 'PUT'].includes(request.method) && request.body) {
        options.body = Http.getBody(request.body, request.urlencoded ?? false);
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
   */
  public async get<T>(url: string): Promise<HttpResponse<T>> {
    return this.make<T>({
      url,
      method: 'GET',
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

  private static getBody(
    body: Record<string, unknown>,
    urlencoded: boolean,
  ): string {
    if (urlencoded) {
      return qs.stringify(body);
    }

    return JSON.stringify(body);
  }
}
