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

async function promptForCredentials(): Promise<Credentials> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'accountSid',
      message: 'Enter your Twilio account SID:',
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your Twilio API key:',
    },
    {
      type: 'password',
      name: 'apiSecret',
      message: 'Enter your Twilio API secret:',
    },
  ]);

  if (!isValidTwilioSid(answers.accountSid, 'AC')) {
    console.error(chalk.red('✗'), 'Invalid AccountSid');
    process.exit(1);
  }

  if (!isValidTwilioSid(answers.apiKey, 'SK')) {
    console.error(chalk.red('✗'), 'Invalid ApiKey');
    process.exit(1);
  }

  if (!answers.accountSid || !answers.apiKey || !answers.apiSecret) {
    console.error(chalk.red('✗'), 'All fields are required');
    process.exit(1);
  }

  return answers;
}

async function promptForOpenAPIConfig() {
  const tagsAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'tags',
      message: 'Do you want to use specific Twilio OpenAPI tags?',
      default: false,
    },
  ]);

  if (tagsAnswers.tags) {
    const tags = await inquirer.prompt([
      {
        type: 'input',
        name: 'tags',
        message: 'Enter the Twilio OpenAPI tags you want to use:',
      },
    ]);
    return { tags: tags.tags };
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
    const services = await inquirer.prompt([
      {
        type: 'input',
        name: 'services',
        message: 'Enter the Twilio OpenAPI services you want to use:',
      },
    ]);
    return { services: services.services };
  }

  console.log(
    chalk.red('→'),
    'No services selected; the default service will be used, `twilio_api_v2010`.',
  );
  return {};
}

async function configureClient(executableArgs: string[]) {
  const clientConfigAnswers = await inquirer.prompt([
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

  switch (clientConfigAnswers.clientConfig) {
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

async function configureCursor(executableArgs: string[]) {
  const cursorConfigPath = path.join(os.homedir(), '.cursor', 'mcp.json');
  console.info(chalk.green('👀'), 'Checking for Cursor configuration...');

  let cursorConfig: MCPConfig = { mcpServers: {} };
  
  if (fs.existsSync(cursorConfigPath)) {
    try {
      cursorConfig = JSON.parse(fs.readFileSync(cursorConfigPath, 'utf8'));
    } catch (error) {
      console.info(
        chalk.red('✗'),
        "No Cursor configuration found, so we'll create a new one for you.",
      );
    }
  } else {
    console.info(
      chalk.red('✗'),
      "No Cursor configuration found, so we'll create a new one for you.",
    );
  }

  if ('twilio' in cursorConfig.mcpServers) {
    console.info(
      chalk.red('→'),
      "Twilio MCP server already configured; we'll update it with the new configuration.",
    );
  }

  cursorConfig.mcpServers['twilio'] = {
    command: 'npx',
    args: executableArgs,
  };

  fs.writeFileSync(cursorConfigPath, JSON.stringify(cursorConfig, null, 2));
  console.info(chalk.green('✔'), 'Cursor configuration set!');
}

async function configureClaudeDesktop(executableArgs: string[]) {
  const claudeConfigPath = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'Claude',
    'claude_desktop_config.json',
  );

  console.info(chalk.green('👀'), 'Checking for Claude Desktop configuration...');

  let existingConfig: MCPConfig = { mcpServers: {} };
  
  if (fs.existsSync(claudeConfigPath)) {
    try {
      existingConfig = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
    } catch (error) {
      console.info(
        chalk.red('✗'),
        'No Claude Desktop configuration found. Please ensure you have the Claude Desktop app installed correctly.',
      );
    }
  } else {
    console.info(
      chalk.red('✗'),
      'No Claude Desktop configuration found. Please ensure you have the Claude Desktop app installed correctly.',
    );
  }

  if ('twilio' in existingConfig.mcpServers) {
    console.info(
      chalk.red('→'),
      "Twilio MCP server already configured; we'll update it with the new configuration.",
    );
  }

  existingConfig.mcpServers['twilio'] = {
    command: 'npx',
    args: executableArgs,
  };

  fs.writeFileSync(claudeConfigPath, JSON.stringify(existingConfig, null, 2));
  console.info(chalk.green('✔'), 'Claude Desktop configuration set!');
}

export default async function config() {
  let currentCredentials = await auth.getCredentials();
  let overwriteAnswers: { overwrite: boolean } | undefined;

  if (currentCredentials) {
    overwriteAnswers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Credentials already set for account \`${currentCredentials.accountSid}\`. Overwrite?`,
        default: false,
      },
    ]);

    if (!overwriteAnswers.overwrite) {
      console.info(chalk.green('✔'), 'Keeping existing credentials');
    }
  }

  if (!currentCredentials || overwriteAnswers?.overwrite) {
    const authAnswers = await promptForCredentials();
    await auth.setCredentials(
      authAnswers.accountSid,
      authAnswers.apiKey,
      authAnswers.apiSecret,
    );
    currentCredentials = await auth.getCredentials();
  }

  const openAPIConfig = await promptForOpenAPIConfig();
  const executableArgs = ['@twilio-alpha/mcp'];

  if (openAPIConfig.tags) {
    executableArgs.push('--tags', openAPIConfig.tags);
  }

  if (openAPIConfig.services) {
    executableArgs.push('--services', openAPIConfig.services);
  }

  await configureClient(executableArgs);
  console.info(chalk.green('✔'), 'All set!');
}
