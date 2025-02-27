import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { nanoid } from 'nanoid';
import { OpenAPI, OpenAPIV3 } from 'openapi-types';

import { API, HttpMethod } from '@app/types.js';

import { OpenAPISpec } from './specs.js';

const SUPPORTED_METHODS = ['get', 'delete', 'post', 'put'];

const trimSlashes = (str: string) => {
  return str.replace(/^\/+|\/+$/g, '');
};

export default function loadTools(specs: OpenAPISpec[]) {
  const tools: Map<string, Tool> = new Map();
  const apis: Map<string, API> = new Map();
  let length = 0;

  specs
    .filter((spec) => spec.document.paths)
    .forEach((spec) => {
      return Object.entries(spec.document.paths as OpenAPI.Operation).forEach(
        ([path, items]) => {
          const baseURL = items.servers?.[0]?.url ?? '';

          return Object.entries(items)
            .filter(([method]) => SUPPORTED_METHODS.includes(method.toString()))
            .forEach(([method, op]) => {
              const operation = op as OpenAPI.Operation;
              if (!operation) {
                return;
              }

              const id = nanoid(8);
              const name = `${operation.operationId}---${id}`;

              const tool: Tool = {
                name,
                description:
                  operation.description ||
                  `Make a ${method.toUpperCase()} request to ${path}`,
                inputSchema: {
                  type: 'object',
                  properties: {},
                },
              };
              const api: API = {
                method: method.toUpperCase() as HttpMethod,
                path: `${trimSlashes(baseURL)}/${trimSlashes(path)}`,
                urlencoded: false,
              };

              if (operation.parameters) {
                operation.parameters
                  .filter((param) => 'name' in param && 'in' in param)
                  .forEach((param) => {
                    // @ts-ignore
                    tool.inputSchema.properties[param.name] = {
                      type: param.schema.type || 'string',
                      description:
                        param.description || `${param.name} parameter`,
                    };

                    if (param.required) {
                      tool.inputSchema.required =
                        tool.inputSchema.required || [];
                      // @ts-ignore
                      tool.inputSchema.required.push(param.name);
                    }
                  });
              }

              length += tool.name.length + (tool.description?.length ?? 0);
              const requestBody =
                // @ts-ignore
                operation.requestBody as OpenAPIV3.RequestBodyObject;
              if (requestBody?.content?.['application/x-www-form-urlencoded']) {
                api.urlencoded = true;
              }

              tools.set(id, tool);
              apis.set(id, api);
            });
        },
      );
    });

  return { tools, apis };
}
