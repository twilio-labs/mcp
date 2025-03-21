import fs from 'fs';
import path from 'path';

import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';

import { Service } from '@app/utils/args';

export interface OpenAPISpec {
  service: Service;
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

      const relativePath = path.relative(baseDir, fullPath);
      const parts = relativePath.split(path.sep);
      const document = (await SwaggerParser.bundle(
        fullPath,
      )) as OpenAPIV3.Document;
      const match = parts[0].match(/^twilio_(.*?)_(v\d+)\.yaml$/);

      return [
        {
          service: {
            name: match?.[1] ?? parts[0],
            version: match?.[2] ?? parts[1],
          },
          path: fullPath,
          document,
        },
      ];
    }),
  );

  return specs.flat();
}
