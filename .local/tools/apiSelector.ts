import { MCPTool } from '../../src/types';

type Input = {
  query: string;
};

class TwilioApiSelector implements MCPTool<Input, void> {
  [x: string]: unknown;

  name = '@twilio/ApiSelector';

  description =
    'ALWAYS use this tool when you need to select a Twilio API. This will determine what tools are required and makes them available to you.';

  inputSchema: {
    [x: string]: unknown;
    type: 'object';
    required: ['query'];
    properties?: {
      query: {
        type: 'string';
        description: 'The user provided query for using Twilio';
      };
    };
  };

  func: (input) => {};
}
