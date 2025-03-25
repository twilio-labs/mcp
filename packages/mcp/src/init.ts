import { logger } from '@twilio-alpha/openapi-mcp-server';
import inquirer from 'inquirer';

import { auth } from '@app/utils';

export default async function init() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'accountSid',
      message: 'Enter your Twilio account SID:',
    },
    {
      type: 'input',
      name: 'apiKey',
      message: 'Enter your Twilio API key:',
    },
    {
      type: 'input',
      name: 'apiSecret',
      message: 'Enter your Twilio API secret:',
    },
  ]);

  if (!answers.accountSid || !answers.apiKey || !answers.apiSecret) {
    logger.error('Error: All fields are required');
    process.exit(1);
  }

  await auth.setCredentials(
    answers.accountSid,
    answers.apiKey,
    answers.apiSecret,
  );

  logger.info('Credentials set');
}
