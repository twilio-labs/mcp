import FormData from 'form-data';
import { Tool } from '@modelcontextprotocol/sdk/types';
import { Http } from '@twilio-alpha/openapi-mcp-server/build/utils';
import { HttpResponse } from '@twilio-alpha/openapi-mcp-server/build/utils/http';
import { API } from '@twilio-alpha/openapi-mcp-server';

export const name = 'TwilioServerlessV1--UploadServerlessAsset';

export const uploadAssetExecution = async (
  params: Record<string, any>,
  http: Http,
): Promise<HttpResponse<unknown>> => {
  const { serviceSid, assetSid, path, visibility, content, contentType } =
    params;

  try {
    const serviceUrl = `https://serverless-upload.twilio.com/v1/Services/${serviceSid}`;
    const uploadUrl = `${serviceUrl}/Assets/${assetSid}/Versions`;

    const form = new FormData();
    form.append('Path', path);
    form.append('Visibility', visibility);
    const buffer = Buffer.from(content, 'utf-8');
    form.append('Content', buffer, {
      filename: 'asset',
      contentType,
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

export const uploadAssetAPI: API = {
  method: 'POST',
  contentType: 'multipart/form-data',
  path: 'fake',
};

export const uploadAssetDefinition: Tool = {
  name,
  description:
    'Upload a JavaScript file as a Twilio Serverless Asset. This creates a new version of the asset that can be deployed.',
  inputSchema: {
    type: 'object',
    properties: {
      serviceSid: {
        type: 'string',
        description:
          'The SID of the Twilio Serverless Service where the asset will be uploaded',
      },
      assetSid: {
        type: 'string',
        description: 'The SID of the Asset to create a new version for',
      },
      path: {
        type: 'string',
        description: 'The HTTP path used to invoke the asset (e.g., "/thanos")',
      },
      visibility: {
        type: 'string',
        description:
          'The visibility of the asset, typically "public" or "private"',
      },
      content: {
        type: 'string',
        description: 'The content of the Asset',
      },
      contentType: {
        type: 'string',
        description:
          'The content type of the Asset being uploaded. This must match the actual content of the file.',
      },
    },
    required: [
      'serviceSid',
      'assetSid',
      'path',
      'visibility',
      'content',
      'contentType',
    ],
  },
};
