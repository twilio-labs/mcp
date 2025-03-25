#!/usr/bin/env node
import { logger } from '@twilio-alpha/openapi-mcp-server';

import config from '@app/config';
import main from '@app/main';

const command = process.argv[2];

if (command === 'config') {
  config().catch((error) => {
    logger.error(`Fatal error in config(): ${error}`);
    process.exit(1);
  });
} else {
  main().catch((error) => {
    logger.error(`Fatal error in main(): ${error}`);
    process.exit(1);
  });
}
