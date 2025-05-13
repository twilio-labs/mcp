import { Tool as MCPTool } from '@modelcontextprotocol/sdk/types.js';
import { OpenAPIV3 } from 'openapi-types';

import { API, HttpMethod } from '@app/types';

import { OpenAPISpec } from './readSpecs';

export type ToolFilters = {
  services?: string[];
  tags?: string[];
  callback?: (spec: OpenAPISpec) => boolean;
};

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

export default function loadTools(specs: OpenAPISpec[], filters?: ToolFilters) {
  const tools: Map<string, Tool> = new Map();
  const apis: Map<string, API> = new Map();
  const services = filters?.services ?? [];

  specs
    .filter((spec) => spec.document.paths)
    .filter((spec) => {
      if (services.length === 0) {
        return true;
      }

      return services.some((service) => spec.service === service);
    })
    .filter((spec) => {
      if (filters?.callback) {
        return filters.callback(spec);
      }
      return true;
    })
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

            const tags = filters?.tags ?? [];
            if (tags.length === 0) {
              return true;
            }
            const operation = op as OpenAPIV3.OperationObject;
            return (operation.tags ?? []).some((tag) => tags.includes(tag));
          })
          .forEach(([method, op]) => {
            const operation = op as OpenAPIV3.OperationObject;

            const name = `${spec.name}--${operation.operationId}`;
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

            tools.set(name, tool);
            apis.set(name, api);
          });
      });
    });

  return { tools, apis };
}
