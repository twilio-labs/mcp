#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import twilio from 'twilio';

const [accountSid, authToken, outboundPhoneNumber] = process.argv.slice(2);

const twilioClient = twilio(accountSid, authToken);

// Create server instance
const server = new Server(
  {
    name: 'twilio-server',
    version: '0.0.1 ',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'send-sms-message',
        description: 'Send an SMS message',
        inputSchema: {
          type: 'object',
          properties: {
            phoneNumber: {
              type: 'string',
              description: 'The phone number to send the message to',
            },
            message: {
              type: 'string',
              description: 'The message to send',
            },
          },
          required: ['phoneNumber', 'message'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'send-sms-message') {
    const { phoneNumber, message } = request.params.arguments as {
      phoneNumber: string;
      message: string;
    };

    await twilioClient.messages.create({
      body: message,
      from: outboundPhoneNumber,
      to: phoneNumber,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Sending SMS message to ${phoneNumber}: ${message}...`,
        },
      ],
    };
  }

  throw new Error('Tool not found');
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Twilio MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
