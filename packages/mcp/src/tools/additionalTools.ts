import { Tool } from '@modelcontextprotocol/sdk/types';
import { API, ToolFilters } from '@twilio-alpha/openapi-mcp-server';
import { uploadFunctionDefinition, uploadFunctionAPI } from './uploadFunction';
import { uploadAssetDefinition, uploadAssetAPI } from './uploadAsset';

type Additional = {
  tool: Tool;
  api: API;
};
export default function loadAdditionalTools(
  filters?: ToolFilters,
): Map<string, Additional> {
  const tools: Map<string, Additional> = new Map();

  const shouldIncludeServerless =
    !filters ||
    (filters.services &&
      filters.services.some((s) => s.includes('serverless'))) ||
    (filters.tags && filters.tags.some((t) => t.includes('Serverless')));

  if (shouldIncludeServerless) {
    tools.set(uploadFunctionDefinition.name, {
      tool: uploadFunctionDefinition,
      api: uploadFunctionAPI,
    });

    tools.set(uploadAssetDefinition.name, {
      tool: uploadAssetDefinition,
      api: uploadAssetAPI,
    });
  }

  return tools;
}
