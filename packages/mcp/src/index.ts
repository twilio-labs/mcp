#!/usr/bin/env node
import { logger } from '@twilio-alpha/openapi-mcp-server';

import main from '@app/main';

main().catch((error) => {
  logger.error(`Fatal error in main(): ${error}`);
  process.exit(1);
});
