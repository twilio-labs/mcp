import fs from 'fs';
import path from 'path';

import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPI } from 'openapi-types';

export interface OpenAPISpec {
  service: string;
  version: string;
  path: string;
  document: OpenAPI.Document;
}

export default async function readSpecs(
  dir: string,
  baseDir: string = dir,
): Promise<OpenAPISpec[]> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const specs = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return readSpecs(fullPath, baseDir);
      }

      const relativePath = path.relative(baseDir, fullPath);
      const parts = relativePath.split(path.sep);
      const document = await SwaggerParser.bundle(fullPath);

      return [
        {
          service: parts[0],
          version: parts[1],
          path: fullPath,
          document,
        },
      ];
    }),
  );

  return specs.flat();
}
