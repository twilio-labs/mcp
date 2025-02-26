import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { nanoid } from 'nanoid';
import { OpenAPI, OpenAPIV3 } from 'openapi-types';

import { API, HttpMethod } from '@app/types.js';
import logger from '@app/utils/logger.js';

import { OpenAPISpec } from './specs.js';

const SUPPORTED_METHODS = ['get', 'delete', 'post', 'put'];

export default function loadTools(specs: OpenAPISpec[]) {
  const tools: Map<string, Tool> = new Map();
  const apis: Map<string, API> = new Map();

  specs
    .filter((spec) => spec.document.paths)
    .forEach((spec) => {
      return Object.entries(spec.document.paths as OpenAPI.Operation).forEach(
        ([path, items]) => {
          return Object.entries(items)
            .filter(([method, _]) =>
              SUPPORTED_METHODS.includes(method.toString()),
            )
            .forEach(([method, op]) => {
              const operation = op as OpenAPI.Operation;
              if (!operation) {
                return;
              }

              const cleanPath = path.replace(/^\//, '');
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
                path,
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
