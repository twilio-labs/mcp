import { Tool as MCPTool } from '@modelcontextprotocol/sdk/types.js';
import { nanoid } from 'nanoid';
import { OpenAPIV3 } from 'openapi-types';

import { API, Filter, HttpMethod } from '@app/types.js';

import { OpenAPISpec } from './readSpecs';

const SUPPORTED_METHODS = ['get', 'delete', 'post', 'put'];

type Tool = MCPTool & {
  inputSchema: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description: string;
      }
    >;
    required: string[];
  };
};

const trimSlashes = (str: string) => {
  return str.replace(/^\/+|\/+$/g, '');
};

export default function loadTools(specs: OpenAPISpec[], filter: Filter) {
  const tools: Map<string, Tool> = new Map();
  const apis: Map<string, API> = new Map();
  const { tags } = filter;

  specs
    .filter((spec) => spec.document.paths)
    .forEach((spec) => {
      const { title } = spec.document.info;
      const description =
        spec.document.info.description?.replace(/\.$/, '') ?? '';

      return Object.entries(spec.document.paths).forEach(([path, items]) => {
        if (!items) {
          return;
        }

        const baseURL = items?.servers?.[0]?.url ?? '';

        // eslint-disable-next-line consistent-return
        return Object.entries(items)
          .filter(([method]) => SUPPORTED_METHODS.includes(method.toString()))
          .filter(([, op]) => {
            if (!op) {
              return false;
            }

            if (tags.length === 0) {
              return true;
            }
            const operation = op as OpenAPIV3.OperationObject;
            return (operation.tags ?? []).some((tag) => tags.includes(tag));
          })
          .forEach(([method, op]) => {
            const operation = op as OpenAPIV3.OperationObject;

            const id = nanoid(8);
            const name = `${operation.operationId}---${id}`;
            const toolDescription =
              operation.description ||
              `Make a ${method.toUpperCase()} request to ${path}`;

            const tool: Tool = {
              name,
              description: `${title}: ${description}. ${toolDescription}`,
              inputSchema: {
                type: 'object',
                properties: {},
                required: [],
              },
            };
            const api: API = {
              method: method.toUpperCase() as HttpMethod,
              path: `${trimSlashes(baseURL)}/${trimSlashes(path)}`,
              contentType: 'application/json',
            };

            if (operation.parameters) {
              operation.parameters
                .filter((param) => 'name' in param && 'in' in param)
                .forEach((param) => {
                  const schema = param.schema as OpenAPIV3.SchemaObject;

                  tool.inputSchema.properties[param.name] = {
                    type: schema.type ?? 'string',
                    description: param.description || `${param.name} parameter`,
                  };

                  if (param.required) {
                    tool.inputSchema.required.push(param.name);
                  }
                });
            }

            const requestBody =
              // @ts-ignore
              operation.requestBody as OpenAPIV3.RequestBodyObject;
            if (requestBody?.content?.['application/x-www-form-urlencoded']) {
              api.contentType = 'application/x-www-form-urlencoded';
            }
            const content =
              requestBody?.content?.['application/x-www-form-urlencoded'] ??
              requestBody?.content?.['application/json'];

            if (content?.schema) {
              const schema = content.schema as OpenAPIV3.SchemaObject;

              if (schema.required) {
                tool.inputSchema.required.push(...schema.required);
              }

              if (schema.properties) {
                Object.entries(schema.properties).forEach(([key, value]) => {
                  const property = value as OpenAPIV3.SchemaObject;
                  tool.inputSchema.properties[key] = {
                    type: property.type ?? 'string',
                    description: property.description ?? `${key} parameter`,
                  };
                });
              }
            }

            tools.set(id, tool);
            apis.set(id, api);
          });
      });
    });

  return { tools, apis };
}
