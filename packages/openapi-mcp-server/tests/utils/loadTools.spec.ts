import { OpenAPIV3 } from 'openapi-types';
import { describe, expect, it } from 'vitest';

import { HttpMethod } from '@app/types';
import { OpenAPISpec } from '@app/utils';
import loadTools from '@app/utils/loadTools';

describe('loadTools', () => {
  const createMockSpec = (
    name: string,
    paths: Record<string, any>,
    info: Partial<OpenAPIV3.InfoObject> = {},
  ): OpenAPISpec => ({
    name,
    service: name,
    path: `/path/to/${name}.yaml`,
    document: {
      openapi: '3.0.0',
      info: {
        title: `${name} API`,
        description: `${name} API description`,
        version: '1.0.0',
        ...info,
      },
      paths,
    } as OpenAPIV3.Document,
  });

  it('should filter specs by service name and version', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          get: {
            operationId: 'getResource',
            description: 'Get a resource',
          },
        },
      }),
      createMockSpec('service2', {
        '/resource': {
          get: {
            operationId: 'getResource',
            description: 'Get a resource',
          },
        },
      }),
    ];

    const filter = {
      services: ['service1'],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    expect(tools.size).toBe(1);
    expect(apis.size).toBe(1);

    // Check the tool is from service1
    for (const [, tool] of tools) {
      expect(tool.description).toContain('service1 API');
    }
  });

  it('should include all services when services filter is empty', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource1': {
          get: {
            operationId: 'getResource1',
            description: 'Get resource 1',
          },
        },
      }),
      createMockSpec('service2', {
        '/resource2': {
          get: {
            operationId: 'getResource2',
            description: 'Get resource 2',
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    expect(tools.size).toBe(2);
    expect(apis.size).toBe(2);
  });

  it('should filter operations by tags', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/tagged': {
          get: {
            operationId: 'getTagged',
            description: 'Tagged endpoint',
            tags: ['tag1', 'tag2'],
          },
        },
        '/untagged': {
          get: {
            operationId: 'getUntagged',
            description: 'Untagged endpoint',
          },
        },
        '/other-tagged': {
          get: {
            operationId: 'getOtherTagged',
            description: 'Other tagged endpoint',
            tags: ['tag3'],
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: ['tag1'],
    };

    const { tools, apis } = loadTools(specs, filter);

    expect(tools.size).toBe(1);
    expect(apis.size).toBe(1);

    // Check the tool has the right operationId
    for (const [, tool] of tools) {
      expect(tool.name).toContain('getTagged');
    }
  });

  it('should include all operations when tags filter is empty', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/tagged': {
          get: {
            operationId: 'getTagged',
            description: 'Tagged endpoint',
            tags: ['tag1'],
          },
        },
        '/untagged': {
          get: {
            operationId: 'getUntagged',
            description: 'Untagged endpoint',
            // No tags specified here
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    // Check if both the tagged and untagged operations are included
    const operationIds = new Set();
    for (const [, tool] of tools) {
      if (tool.name.includes('getTagged')) operationIds.add('getTagged');
      if (tool.name.includes('getUntagged')) operationIds.add('getUntagged');
    }

    expect(operationIds.size).toBe(2);
    expect(operationIds.has('getTagged')).toBe(true);
    expect(operationIds.has('getUntagged')).toBe(true);
    expect(tools.size).toBe(2);
    expect(apis.size).toBe(2);
  });

  it('should only include supported HTTP methods', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          get: {
            operationId: 'getResource',
            description: 'Get a resource',
          },
          post: {
            operationId: 'createResource',
            description: 'Create a resource',
          },
          put: {
            operationId: 'updateResource',
            description: 'Update a resource',
          },
          delete: {
            operationId: 'deleteResource',
            description: 'Delete a resource',
          },
          head: {
            operationId: 'headResource',
            description: 'Head request for a resource',
          },
          options: {
            operationId: 'optionsResource',
            description: 'Options for a resource',
          },
          patch: {
            operationId: 'patchResource',
            description: 'Patch a resource',
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    // Only get, post, put, delete should be included
    expect(tools.size).toBe(4);
    expect(apis.size).toBe(4);

    // Check HTTP methods in APIs
    const methods = new Set<string>();
    for (const [, api] of apis) {
      methods.add(api.method);
    }

    expect(methods.size).toBe(4);
    expect(methods.has('GET')).toBe(true);
    expect(methods.has('POST')).toBe(true);
    expect(methods.has('PUT')).toBe(true);
    expect(methods.has('DELETE')).toBe(true);
    expect(methods.has('HEAD' as HttpMethod)).toBe(false);
    expect(methods.has('OPTIONS' as HttpMethod)).toBe(false);
    expect(methods.has('PATCH' as HttpMethod)).toBe(false);
  });

  it('should use baseURL from server when available', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          servers: [
            {
              url: 'https://api.example.com/v1',
            },
          ],
          get: {
            operationId: 'getResource',
            description: 'Get a resource',
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    expect(tools.size).toBe(1);
    expect(apis.size).toBe(1);

    // Check the path has the baseURL
    for (const [, api] of apis) {
      expect(api.path).toBe('https://api.example.com/v1/resource');
    }
  });

  it('should trim slashes in path construction', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource/': {
          servers: [
            {
              url: '/api/v1/',
            },
          ],
          get: {
            operationId: 'getResource',
            description: 'Get a resource',
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    expect(tools.size).toBe(1);
    expect(apis.size).toBe(1);

    // Check slashes are handled correctly
    for (const [, api] of apis) {
      expect(api.path).toBe('api/v1/resource');
    }
  });

  it('should use empty string for baseURL when not available', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          get: {
            operationId: 'getResource',
            description: 'Get a resource',
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    expect(tools.size).toBe(1);
    expect(apis.size).toBe(1);

    // Check the path is just the path without a baseURL
    for (const [, api] of apis) {
      expect(api.path).toBe('/resource');
    }
  });

  it('should use operationId in tool name', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          get: {
            operationId: 'getResource',
            description: 'Get a resource',
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools } = loadTools(specs, filter);

    for (const [, tool] of tools) {
      expect(tool.name).toContain('--getResource');
    }
  });

  it('should use operation description in tool description', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          get: {
            operationId: 'getResource',
            description: 'Get a resource operation',
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools } = loadTools(specs, filter);

    for (const [, tool] of tools) {
      expect(tool.description).toBe(
        'service1 API: service1 API description. Get a resource operation',
      );
    }
  });

  it('should use method and path if no operation description is available', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          get: {
            operationId: 'getResource',
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools } = loadTools(specs, filter);

    for (const [, tool] of tools) {
      expect(tool.description).toBe(
        'service1 API: service1 API description. Make a GET request to /resource',
      );
    }
  });

  it('should handle parameters and add them to the input schema', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource/{id}': {
          get: {
            operationId: 'getResource',
            description: 'Get a resource',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: 'ID of the resource',
                schema: {
                  type: 'string',
                },
              },
              {
                name: 'filter',
                in: 'query',
                description: 'Filter the results',
                schema: {
                  type: 'string',
                },
              },
            ],
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools } = loadTools(specs, filter);

    expect(tools.size).toBe(1);

    for (const [, tool] of tools) {
      // Check properties
      expect(tool.inputSchema.properties).toHaveProperty('id');
      expect(tool.inputSchema.properties).toHaveProperty('filter');

      // Check property types
      expect(tool.inputSchema.properties.id.type).toBe('string');
      expect(tool.inputSchema.properties.filter.type).toBe('string');

      // Check descriptions
      expect(tool.inputSchema.properties.id.description).toBe(
        'ID of the resource',
      );
      expect(tool.inputSchema.properties.filter.description).toBe(
        'Filter the results',
      );

      // Check required fields
      expect(tool.inputSchema.required).toContain('id');
      expect(tool.inputSchema.required).not.toContain('filter');
    }
  });

  it('should use parameter name as description if none is provided', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          get: {
            operationId: 'getResource',
            parameters: [
              {
                name: 'filter',
                in: 'query',
                schema: {
                  type: 'string',
                },
              },
            ],
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools } = loadTools(specs, filter);

    for (const [, tool] of tools) {
      expect(tool.inputSchema.properties.filter.description).toBe(
        'filter parameter',
      );
    }
  });

  it('should handle request body parameters for application/json', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          post: {
            operationId: 'createResource',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                      name: {
                        type: 'string',
                        description: 'Name of the resource',
                      },
                      description: {
                        type: 'string',
                        description: 'Description of the resource',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    expect(tools.size).toBe(1);
    expect(apis.size).toBe(1);

    for (const [, tool] of tools) {
      // Check properties from request body
      expect(tool.inputSchema.properties).toHaveProperty('name');
      expect(tool.inputSchema.properties).toHaveProperty('description');

      // Check property types
      expect(tool.inputSchema.properties.name.type).toBe('string');
      expect(tool.inputSchema.properties.description.type).toBe('string');

      // Check descriptions
      expect(tool.inputSchema.properties.name.description).toBe(
        'Name of the resource',
      );
      expect(tool.inputSchema.properties.description.description).toBe(
        'Description of the resource',
      );

      // Check required fields from request body
      expect(tool.inputSchema.required).toContain('name');
      expect(tool.inputSchema.required).not.toContain('description');
    }

    // Check API doesn't use urlencoded for application/json
    for (const [, api] of apis) {
      expect(api.contentType).toBe('application/json');
    }
  });

  it('should handle request body parameters for application/x-www-form-urlencoded', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          post: {
            operationId: 'createResource',
            requestBody: {
              content: {
                'application/x-www-form-urlencoded': {
                  schema: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                      name: {
                        type: 'string',
                        description: 'Name of the resource',
                      },
                      description: {
                        type: 'string',
                        description: 'Description of the resource',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    expect(tools.size).toBe(1);
    expect(apis.size).toBe(1);

    // Check API uses urlencoded for application/x-www-form-urlencoded
    for (const [, api] of apis) {
      expect(api.contentType).toBe('application/x-www-form-urlencoded');
    }
  });

  it('should use property key as description if none is provided', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          post: {
            operationId: 'createResource',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools } = loadTools(specs, filter);

    for (const [, tool] of tools) {
      expect(tool.inputSchema.properties.name.description).toBe(
        'name parameter',
      );
    }
  });

  it('should use string as default type if not specified', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          post: {
            operationId: 'createResource',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      param: {
                        description: 'A parameter without type',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools } = loadTools(specs, filter);

    for (const [, tool] of tools) {
      expect(tool.inputSchema.properties.param.type).toBe('string');
    }
  });

  it('should skip specs without paths', () => {
    const specs: OpenAPISpec[] = [
      {
        service: 'emptyService',
        path: '/path/to/empty_v1.yaml',
        document: {
          openapi: '3.0.0',
          info: {
            title: 'Empty API',
            version: '1.0.0',
          },
          // No paths property
        } as any,
      },
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    expect(tools.size).toBe(0);
    expect(apis.size).toBe(0);
  });

  it('should handle API with null items in paths', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': null,
        '/valid': {
          get: {
            operationId: 'getValid',
            description: 'Get valid',
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    expect(tools.size).toBe(1);
    expect(apis.size).toBe(1);
  });

  it('should handle API with null operations', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          get: null,
          post: {
            operationId: 'postResource',
            description: 'Post resource',
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    expect(tools.size).toBe(1);
    expect(apis.size).toBe(1);

    for (const [, tool] of tools) {
      expect(tool.name).toContain('postResource');
    }
  });

  it('should generate consistent IDs for tools and APIs', () => {
    const specs: OpenAPISpec[] = [
      createMockSpec('service1', {
        '/resource': {
          get: {
            operationId: 'getResource',
            description: 'Get a resource',
          },
        },
      }),
    ];

    const filter = {
      services: [],
      tags: [],
    };

    const { tools, apis } = loadTools(specs, filter);

    expect(tools.size).toBe(1);
    expect(apis.size).toBe(1);

    // The IDs in the Maps should be the same
    expect([...tools.keys()]).toEqual([...apis.keys()]);
  });
});
