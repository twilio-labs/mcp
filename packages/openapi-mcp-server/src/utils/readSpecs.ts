import fs from 'fs';
import path from 'path';

import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';

export interface OpenAPISpec {
  service: string;
  name: string;
  path: string;
  document: OpenAPIV3.Document<OpenAPIV3.OperationObject>;
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

      // Check of yaml only
      if (!entry.name.endsWith('.yaml') && !entry.name.endsWith('.yml')) {
        return null;
      }

      const document = (await SwaggerParser.bundle(
        fullPath,
      )) as OpenAPIV3.Document;
      const service = path.basename(fullPath, path.extname(fullPath));
      const name = service
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');

      return [
        {
          service,
          name,
          path: fullPath,
          document,
        },
      ];
    }),
  );

  return specs.filter(Boolean).flat() as OpenAPISpec[];
}
