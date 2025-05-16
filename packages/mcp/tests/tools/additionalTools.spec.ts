import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import loadAdditionalTools from '../../src/tools/additionalTools';
import { uploadFunctionDefinition } from '../../src/tools/uploadFunction';
import { uploadAssetDefinition } from '../../src/tools/uploadAsset';

describe('additionalTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should include serverless tools when no filters are provided', () => {
    const tools = loadAdditionalTools();

    expect(tools.size).toBe(2);
    expect(tools.has(uploadFunctionDefinition.name)).toBe(true);
    expect(tools.has(uploadAssetDefinition.name)).toBe(true);
  });

  it('should include serverless tools when services filter includes "serverless"', () => {
    const tools = loadAdditionalTools({
      services: ['twilio_api_v2010', 'twilio_serverless_v1'],
      tags: [],
    });

    expect(tools.size).toBe(2);
    expect(tools.has(uploadFunctionDefinition.name)).toBe(true);
    expect(tools.has(uploadAssetDefinition.name)).toBe(true);
  });

  it('should include serverless tools when tags filter includes "Serverless"', () => {
    const tools = loadAdditionalTools({
      services: [],
      tags: ['Messaging', 'Serverless'],
    });

    expect(tools.size).toBe(2);
    expect(tools.has(uploadFunctionDefinition.name)).toBe(true);
    expect(tools.has(uploadAssetDefinition.name)).toBe(true);
  });

  it('should not include serverless tools when filters do not include serverless', () => {
    const tools = loadAdditionalTools({
      services: ['twilio_api_v2010'],
      tags: ['Voice', 'Messaging'],
    });

    expect(tools.size).toBe(0);
  });

  it('should return tool definitions with both tool and API properties', () => {
    const tools = loadAdditionalTools();

    const uploadFunctionTool = tools.get(uploadFunctionDefinition.name);
    const uploadAssetTool = tools.get(uploadAssetDefinition.name);

    expect(uploadFunctionTool).toBeDefined();
    expect(uploadFunctionTool?.tool).toBe(uploadFunctionDefinition);
    expect(uploadFunctionTool?.api).toBeDefined();

    expect(uploadAssetTool).toBeDefined();
    expect(uploadAssetTool?.tool).toBe(uploadAssetDefinition);
    expect(uploadAssetTool?.api).toBeDefined();
  });
});
