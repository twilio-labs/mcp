import FormData from 'form-data';
import { Tool } from '@modelcontextprotocol/sdk/types';
import { Http } from '@twilio-alpha/openapi-mcp-server/build/utils';
import { HttpResponse } from '@twilio-alpha/openapi-mcp-server/build/utils/http';
import { API } from '@twilio-alpha/openapi-mcp-server';

export const name = 'TwilioServerlessV1--UploadServerlessFunction';

export const uploadFunctionExecution = async (
  params: Record<string, any>,
  http: Http,
): Promise<HttpResponse<unknown>> => {
  const { serviceSid, functionSid, path, visibility, content } = params;

  try {
    const serviceUrl = `https://serverless-upload.twilio.com/v1/Services/${serviceSid}`;
    const uploadUrl = `${serviceUrl}/Functions/${functionSid}/Versions`;

    const form = new FormData();
    form.append('Path', path);
    form.append('Visibility', visibility);
    const buffer = Buffer.from(content, 'utf-8');
    form.append('Content', buffer, {
      filename: 'function.js',
      contentType: 'application/javascript',
    });

    return await http.upload<{ sid: string }>(uploadUrl, form);
  } catch (error) {
    return {
      ok: false,
      statusCode: 500,
      // @ts-ignore
      error,
    };
  }
};

export const uploadFunctionAPI: API = {
  method: 'POST',
  contentType: 'multipart/form-data',
  path: 'fake',
};

export const uploadFunctionDefinition: Tool = {
  name,
  description:
    'Upload a JavaScript file as a Twilio Serverless Function. This creates a new version of the function that can be deployed.',
  inputSchema: {
    type: 'object',
    properties: {
      serviceSid: {
        type: 'string',
        description:
          'The SID of the Twilio Serverless Service where the function will be uploaded',
      },
      functionSid: {
        type: 'string',
        description: 'The SID of the Function to create a new version for',
      },
      path: {
        type: 'string',
        description:
          'The HTTP path used to invoke the function (e.g., "/thanos")',
      },
      visibility: {
        type: 'string',
        description:
          'The visibility of the function, typically "public" or "private"',
      },
      content: {
        type: 'string',
        description: 'The JavaScript code content for the function',
      },
    },
    required: ['serviceSid', 'functionSid', 'path', 'visibility', 'content'],
  },
};
