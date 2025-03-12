import { Tool as MCPTool } from '@modelcontextprotocol/sdk/types.js';
import { nanoid } from 'nanoid';
import { OpenAPIV3 } from 'openapi-types';

import { API, HttpMethod } from '@app/types.js';
import { Service } from '@app/utils/args';

import { OpenAPISpec } from './specs.js';

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

export default function loadTools(specs: OpenAPISpec[], services: Service[]) {
  const tools: Map<string, Tool> = new Map();
  const apis: Map<string, API> = new Map();

  specs
    .filter((spec) => {
      return services.some(
        (service) =>
          service.name === spec.service.name &&
          service.version === spec.service.version,
      );
    })
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
          .forEach(([method, op]) => {
            const operation = op as OpenAPIV3.OperationObject;
            if (!operation) {
              return;
            }

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
              urlencoded: false,
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
              api.urlencoded = true;
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
