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

type JsonSchema = {
  type: string;
  description: string;
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  [key: string]: any; // For other schema properties
};

const trimSlashes = (str: string) => {
  return str.replace(/^\/+|\/+$/g, '');
};

// Anthropic API requires property names to match ^[a-zA-Z0-9_.-]{1,64}$
const VALID_PROPERTY_KEY_PATTERN = /^[a-zA-Z0-9_.-]{1,64}$/;

export function sanitizePropertyKey(name: string): string {
  if (VALID_PROPERTY_KEY_PATTERN.test(name)) {
    return name;
  }
  return name
    .replace(/</g, '_before')
    .replace(/>/g, '_after')
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .slice(0, 64);
}

function toSchema(
  schema: OpenAPIV3.SchemaObject,
  description?: string,
): JsonSchema {
  const result: JsonSchema = {
    type: schema.type ?? 'string',
    description: description ?? schema.description ?? '',
  };

  // Handle array types
  if (schema.type === 'array' && schema.items) {
    result.items = toSchema(schema.items as OpenAPIV3.SchemaObject);
  }

  // Handle object types
  if (schema.type === 'object' && schema.properties) {
    result.properties = {};
    Object.entries(schema.properties).forEach(([key, value]) => {
      result.properties![key] = toSchema(value as OpenAPIV3.SchemaObject);
    });

    if (schema.required) {
      result.required = schema.required;
    }
  }

  return result;
}

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
                  const sanitized = sanitizePropertyKey(param.name);

                  tool.inputSchema.properties[sanitized] = toSchema(
                    schema,
                    param.description || `${param.name} parameter`,
                  );

                  if (sanitized !== param.name) {
                    if (!api.parameterNameMapping) {
                      api.parameterNameMapping = {};
                    }
                    api.parameterNameMapping[sanitized] = param.name;
                  }

                  if (param.required) {
                    tool.inputSchema.required.push(sanitized);
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

              if (schema.properties) {
                Object.entries(schema.properties).forEach(([key, value]) => {
                  const property = value as OpenAPIV3.SchemaObject;
                  const sanitized = sanitizePropertyKey(key);

                  tool.inputSchema.properties[sanitized] = toSchema(
                    property,
                    property.description ?? `${key} parameter`,
                  );

                  if (sanitized !== key) {
                    if (!api.parameterNameMapping) {
                      api.parameterNameMapping = {};
                    }
                    api.parameterNameMapping[sanitized] = key;
                  }
                });
              }

              if (schema.required) {
                tool.inputSchema.required.push(
                  ...schema.required.map((r) => sanitizePropertyKey(r)),
                );
              }
            }

            tools.set(name, tool);
            apis.set(name, api);
          });
      });
    });

  return { tools, apis };
}
