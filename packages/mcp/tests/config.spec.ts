import fs from 'fs';

import inquirer, { type Answers, type Question } from 'inquirer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isValidTwilioSid } from '@app/utils';

import config from '../src/config';

// Mock dependencies
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));
vi.mock('fs');
vi.mock('@app/utils');

interface ValidatedQuestion extends Question<Answers> {
  validate?: (input: string) => boolean | string;
  name: string;
}

// Helper to get around type issues with inquirer.prompt mocking
const mockInquirerPrompt = (
  impl: (questions: Question[] | Question) => any,
) => {
  return vi.mocked(inquirer.prompt).mockImplementation(impl);
};

describe('config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fs.existsSync to return true by default
    vi.mocked(fs.existsSync).mockReturnValue(true);
    // Mock fs.readFileSync to return empty config
    vi.mocked(fs.readFileSync).mockReturnValue('{"mcpServers":{}}');
    // Mock isValidTwilioSid to return true by default
    vi.mocked(isValidTwilioSid).mockReturnValue(true);
  });

  it('should prompt for client selection', async () => {
    // Mock the prompts sequence
    const mockPrompt = vi.mocked(inquirer.prompt);

    // Setup the mock to return the desired values
    mockPrompt.mockResolvedValueOnce({ clientConfig: 'cursor' } as any);
    mockPrompt.mockResolvedValueOnce({ tags: false } as any);
    mockPrompt.mockResolvedValueOnce({ services: false } as any);
    mockPrompt.mockResolvedValueOnce({
      accountSid: 'AC1234567890abcdef1234567890abcdef',
      apiKey: 'SK1234567890abcdef1234567890abcdef',
      apiSecret: 'secret123',
    } as any);

    // Start the config process
    await config();

    // Verify the prompt was called with correct arguments
    expect(inquirer.prompt).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'list',
        name: 'clientConfig',
        message: 'Which MCP client you want to configure?',
      }),
    ]);
  });

  it('should prompt for credentials after OpenAPI configuration', async () => {
    // Mock the prompts sequence
    const mockPrompt = vi.mocked(inquirer.prompt);

    // Setup the mock to return the desired values
    mockPrompt.mockResolvedValueOnce({ clientConfig: 'cursor' } as any);
    mockPrompt.mockResolvedValueOnce({ tags: false } as any);
    mockPrompt.mockResolvedValueOnce({ services: false } as any);
    mockPrompt.mockResolvedValueOnce({
      accountSid: 'AC1234567890abcdef1234567890abcdef',
      apiKey: 'SK1234567890abcdef1234567890abcdef',
      apiSecret: 'secret123',
    } as any);

    // Start the config process
    await config();

    // Get all calls to inquirer.prompt
    const promptCalls = mockPrompt.mock.calls;

    // Find the credentials prompt call (it should be the last one)
    const credentialsQuestions = promptCalls
      .map((call) => call[0])
      .find(
        (questions) =>
          Array.isArray(questions) &&
          questions.some((q) => q.name === 'accountSid'),
      );

    // Verify the credentials prompts
    expect(credentialsQuestions).toBeDefined();
    expect(credentialsQuestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'accountSid',
          type: 'input',
          message: 'Enter your Twilio account SID:',
          validate: expect.any(Function),
        }),
        expect.objectContaining({
          name: 'apiKey',
          type: 'password',
          message: 'Enter your Twilio API Key SID:',
          validate: expect.any(Function),
        }),
        expect.objectContaining({
          name: 'apiSecret',
          type: 'password',
          message: 'Enter your Twilio API Key Secret:',
          validate: expect.any(Function),
        }),
      ]),
    );
  });

  it('should validate account SID format', async () => {
    let validationFunction: ((input: string) => boolean | string) | undefined;

    // Setup inquirer.prompt to capture validation function
    mockInquirerPrompt((questions: Question[] | Question) => {
      if (Array.isArray(questions)) {
        const accountSidQuestion = questions.find(
          (q) => q.name === 'accountSid',
        ) as ValidatedQuestion;
        if (accountSidQuestion?.validate) {
          validationFunction = accountSidQuestion.validate;
        }
      }

      return {
        accountSid: 'AC1234567890abcdef1234567890abcdef',
        apiKey: 'SK1234567890abcdef1234567890abcdef',
        apiSecret: 'secret123',
      } as any;
    });

    // Start the config process
    await config();

    // Mock isValidTwilioSid to return false for invalid SID
    vi.mocked(isValidTwilioSid).mockReturnValue(false);

    // Test validation
    expect(validationFunction?.('AC123')).toBe('Invalid Account SID format');

    // Mock isValidTwilioSid to return true for valid SID
    vi.mocked(isValidTwilioSid).mockReturnValue(true);
    expect(validationFunction?.('AC1234567890abcdef1234567890abcdef')).toBe(
      true,
    );
  });

  it('should validate API Key format', async () => {
    let validationFunction: ((input: string) => boolean | string) | undefined;

    // Setup inquirer.prompt to capture validation function
    mockInquirerPrompt((questions: Question[] | Question) => {
      if (Array.isArray(questions)) {
        const apiKeyQuestion = questions.find(
          (q) => q.name === 'apiKey',
        ) as ValidatedQuestion;
        if (apiKeyQuestion?.validate) {
          validationFunction = apiKeyQuestion.validate;
        }
      }

      return {
        accountSid: 'AC1234567890abcdef1234567890abcdef',
        apiKey: 'SK1234567890abcdef1234567890abcdef',
        apiSecret: 'secret123',
      } as any;
    });

    // Start the config process
    await config();

    // Mock isValidTwilioSid to return false for invalid SID
    vi.mocked(isValidTwilioSid).mockReturnValue(false);

    // Test validation
    expect(validationFunction?.('SK123')).toBe('Invalid API Key SID format');

    // Mock isValidTwilioSid to return true for valid SID
    vi.mocked(isValidTwilioSid).mockReturnValue(true);
    expect(validationFunction?.('SK1234567890abcdef1234567890abcdef')).toBe(
      true,
    );
  });

  it('should validate API Secret is not empty', async () => {
    let validationFunction: ((input: string) => boolean | string) | undefined;

    // Setup inquirer.prompt to capture validation function
    mockInquirerPrompt((questions: Question[] | Question) => {
      if (Array.isArray(questions)) {
        const apiSecretQuestion = questions.find(
          (q) => q.name === 'apiSecret',
        ) as ValidatedQuestion;
        if (apiSecretQuestion?.validate) {
          validationFunction = apiSecretQuestion.validate;
        }
      }

      return {
        accountSid: 'AC1234567890abcdef1234567890abcdef',
        apiKey: 'SK1234567890abcdef1234567890abcdef',
        apiSecret: 'secret123',
      } as any;
    });

    // Start the config process
    await config();

    // Test validation
    expect(validationFunction?.('')).toBe('API Secret is required');
    expect(validationFunction?.('secret123')).toBe(true);
  });
});
