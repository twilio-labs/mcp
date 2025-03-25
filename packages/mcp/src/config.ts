/* eslint-disable no-console */
import fs from 'fs';
import os from 'os';
import path from 'path';

import chalk from 'chalk';
import inquirer from 'inquirer';

import { auth, isValidTwilioSid } from '@app/utils';

interface Credentials {
  accountSid: string;
  apiKey: string;
  apiSecret: string;
}

interface MCPConfig {
  mcpServers: {
    [key: string]: {
      command: string;
      args: string[];
    };
  };
}

interface OpenAPIConfig {
  tags?: string;
  services?: string;
}

const CONFIG_PATHS = {
  CURSOR: path.join(os.homedir(), '.cursor', 'mcp.json'),
  CLAUDE: path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'Claude',
    'claude_desktop_config.json',
  ),
} as const;

const MCP_SERVER_NAME = 'twilio';
const DEFAULT_SERVICE = 'twilio_api_v2010';

async function readConfigFile(configPath: string): Promise<MCPConfig> {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    console.error(
      chalk.red('✗'),
      `Error reading configuration file: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
  return { mcpServers: {} };
}

async function configureCursor(executableArgs: string[]) {
  console.info(chalk.green('👀'), 'Checking for Cursor configuration...');

  const cursorConfig = await readConfigFile(CONFIG_PATHS.CURSOR);

  if (MCP_SERVER_NAME in cursorConfig.mcpServers) {
    console.info(
      chalk.yellow('→'),
      "Twilio MCP server already configured; we'll update it with the new configuration.",
    );
  }

  cursorConfig.mcpServers[MCP_SERVER_NAME] = {
    command: 'npx',
    args: executableArgs,
  };

  try {
    fs.writeFileSync(
      CONFIG_PATHS.CURSOR,
      JSON.stringify(cursorConfig, null, 2),
    );
    console.info(chalk.green('✔'), 'Cursor configuration set!');
  } catch (error) {
    console.error(
      chalk.red('✗'),
      `Failed to write Cursor configuration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
    process.exit(1);
  }
}

async function configureClaudeDesktop(executableArgs: string[]) {
  console.info(
    chalk.green('👀'),
    'Checking for Claude Desktop configuration...',
  );

  const existingConfig = await readConfigFile(CONFIG_PATHS.CLAUDE);

  if (MCP_SERVER_NAME in existingConfig.mcpServers) {
    console.info(
      chalk.yellow('→'),
      "Twilio MCP server already configured; we'll update it with the new configuration.",
    );
  }

  existingConfig.mcpServers[MCP_SERVER_NAME] = {
    command: 'npx',
    args: executableArgs,
  };

  try {
    fs.writeFileSync(
      CONFIG_PATHS.CLAUDE,
      JSON.stringify(existingConfig, null, 2),
    );
    console.info(chalk.green('✔'), 'Claude Desktop configuration set!');
  } catch (error) {
    console.error(
      chalk.red('✗'),
      `Failed to write Claude Desktop configuration: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
    process.exit(1);
  }
}

async function promptForOverwrite(currentSid: string): Promise<boolean> {
  const { overwrite } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'overwrite',
      message: `Credentials already set for account \`${currentSid}\`. Overwrite?`,
      default: false,
    },
  ]);
  return overwrite;
}

async function promptForCredentials(): Promise<Credentials> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'accountSid',
      message: 'Enter your Twilio account SID:',
      validate: (input) =>
        isValidTwilioSid(input, 'AC') || 'Invalid Account SID format',
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your Twilio API Key SID:',
      validate: (input) =>
        isValidTwilioSid(input, 'SK') || 'Invalid API Key SID format',
    },
    {
      type: 'password',
      name: 'apiSecret',
      message: 'Enter your Twilio API Key Secret:',
      validate: (input) => input.length > 0 || 'API Secret is required',
    },
  ]);

  return answers;
}

async function promptForOpenAPIConfig(): Promise<OpenAPIConfig> {
  const tagsAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'tags',
      message: 'Do you want to use specific Twilio OpenAPI tags?',
      default: false,
    },
  ]);

  if (tagsAnswers.tags) {
    const { tags } = await inquirer.prompt([
      {
        type: 'input',
        name: 'tags',
        message:
          'Enter the Twilio OpenAPI tags you want to use (comma-separated):',
        validate: (input) => {
          if (!input.trim()) {
            return 'Tags cannot be empty';
          }

          const tagList = input.split(',').map((tag) => tag.trim());

          return tagList.every((tag) => tag.length > 0) || 'Invalid tag format';
        },
      },
    ]);
    return { tags };
  }

  const servicesAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'services',
      message: 'Do you want to use specific Twilio OpenAPI services?',
      default: false,
    },
  ]);

  if (servicesAnswers.services) {
    const { services } = await inquirer.prompt([
      {
        type: 'input',
        name: 'services',
        message:
          'Enter the Twilio OpenAPI services you want to use (comma-separated):',
        validate: (input) => {
          if (!input.trim()) {
            return 'Services cannot be empty';
          }

          const serviceList = input.split(',').map((service) => service.trim());

          return (
            serviceList.every((service) => service.length > 0) ||
            'Invalid service format'
          );
        },
      },
    ]);
    return { services };
  }

  console.log(
    chalk.yellow('→'),
    `No services selected; the default service will be used, \`${DEFAULT_SERVICE}\`.`,
  );
  return {};
}

async function configureClient(executableArgs: string[]) {
  const { clientConfig } = await inquirer.prompt([
    {
      type: 'list',
      name: 'clientConfig',
      message: 'Which MCP client you want to configure?',
      choices: [
        {
          name: 'None / Manual Configuration',
          value: 'manual',
        },
        {
          name: 'Cursor',
          value: 'cursor',
        },
        {
          name: 'Claude Desktop',
          value: 'claude-desktop',
        },
      ],
    },
  ]);

  switch (clientConfig) {
    case 'cursor':
      await configureCursor(executableArgs);
      break;
    case 'claude-desktop':
      await configureClaudeDesktop(executableArgs);
      break;
    case 'manual':
    default:
      console.info(
        chalk.green('👀'),
        'Use the following `npx` command for the configuration in your MCP client:',
      );
      console.info(`npx ${executableArgs.join(' ')}`);
  }
}

export default async function config() {
  let currentCredentials = await auth.getCredentials();

  if (currentCredentials) {
    const shouldOverwrite = await promptForOverwrite(
      currentCredentials.accountSid,
    );
    if (!shouldOverwrite) {
      console.info(chalk.green('✔'), 'Keeping existing credentials');
    }
  }

  if (
    !currentCredentials ||
    (currentCredentials &&
      (await promptForOverwrite(currentCredentials.accountSid)))
  ) {
    const authAnswers = await promptForCredentials();
    await auth.setCredentials(
      authAnswers.accountSid,
      authAnswers.apiKey,
      authAnswers.apiSecret,
    );
    currentCredentials = await auth.getCredentials();
  }

  const openAPIConfig = await promptForOpenAPIConfig();
  const executableArgs = ['-y', '@twilio-alpha/mcp'];

  if (openAPIConfig.tags) {
    executableArgs.push('--tags', openAPIConfig.tags);
  }

  if (openAPIConfig.services) {
    executableArgs.push('--services', openAPIConfig.services);
  }

  await configureClient(executableArgs);
  console.info(chalk.green('✔'), 'All set!');
}
