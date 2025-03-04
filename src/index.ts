#!/usr/bin/env node
import init from '@app/init';
import main from '@app/main';
import { args, logger } from '@app/utils';

const { command } = await args(process.argv);

if (command === 'start') {
  main().catch((error) => {
    logger.error(`Fatal error in main(): ${error}`);
    process.exit(1);
  });
} else if (command === 'init') {
  init().catch((error) => {
    logger.error(`Fatal error in init(): ${error}`);
    process.exit(1);
  });
} else {
  logger.error(`Unknown command: ${command}. Expected 'init' or 'start'.`);
  process.exit(1);
}
