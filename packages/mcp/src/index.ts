#!/usr/bin/env node
import { logger } from '@twilio-alpha/openapi-mcp-server';

import init from '@app/init';
import main from '@app/main';

const command = process.argv[2];

if (command === 'init') {
  init().catch((error) => {
    logger.error(`Fatal error in init(): ${error}`);
    process.exit(1);
  });
} else {
  main().catch((error) => {
    logger.error(`Fatal error in main(): ${error}`);
    process.exit(1);
  });
}
