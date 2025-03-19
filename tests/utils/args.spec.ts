import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import parsedArgs from '@app/utils/args';
import { isValidTwilioSid } from '@app/utils/general';

vi.mock('@app/utils/general', () => ({
  isValidTwilioSid: vi.fn(),
}));

const originalExit = process.exit;

describe('parsedArgs', () => {
  const validAccountSid = 'AC00000000000000000000000000000000';
  const validApiKey = 'SK00000000000000000000000000000000';
  const apiSecret = 'someApiSecret';

  beforeEach(() => {
    (isValidTwilioSid as Mock).mockImplementation(() => true);

    process.exit = vi.fn() as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.exit = originalExit;
  });

  it('should use default service when no services or tags are provided', async () => {
    const args = [
      'node',
      'script.js',
      `--accountSid=${validAccountSid}`,
      `--apiKey=${validApiKey}`,
      `--apiSecret=${apiSecret}`,
    ];

    const result = await parsedArgs(args);

    expect(result).toEqual({
      services: [{ name: 'api', version: 'v2010' }],
      tags: [],
      accountSid: validAccountSid,
      apiKey: validApiKey,
      apiSecret,
    });
  });

  it('should parse services from command line arguments', async () => {
    const args = [
      'node',
      'script.js',
      `--accountSid=${validAccountSid}`,
      `--apiKey=${validApiKey}`,
      `--apiSecret=${apiSecret}`,
      '--services=service1_v1,service2_v2',
    ];

    const result = await parsedArgs(args);

    expect(result).toEqual({
      services: [
        { name: 'service1', version: 'v1' },
        { name: 'service2', version: 'v2' },
      ],
      tags: [],
      accountSid: validAccountSid,
      apiKey: validApiKey,
      apiSecret,
    });
  });

  it('should parse services using the -e alias', async () => {
    const args = [
      'node',
      'script.js',
      `--accountSid=${validAccountSid}`,
      `--apiKey=${validApiKey}`,
      `--apiSecret=${apiSecret}`,
      '-e',
      'service1_v1,service2_v2',
    ];

    const result = await parsedArgs(args);

    expect(result.services).toEqual([
      { name: 'service1', version: 'v1' },
      { name: 'service2', version: 'v2' },
    ]);
  });

  it('should sanitize and parse tags', async () => {
    const args = [
      'node',
      'script.js',
      `--accountSid=${validAccountSid}`,
      `--apiKey=${validApiKey}`,
      `--apiSecret=${apiSecret}`,
      '--tags=tag1, tag2,tag3, ,tag4',
    ];

    const result = await parsedArgs(args);

    expect(result.tags).toEqual(['tag1', 'tag2', 'tag3', 'tag4']);
  });

  it('should parse tags using the -t alias', async () => {
    const args = [
      'node',
      'script.js',
      `--accountSid=${validAccountSid}`,
      `--apiKey=${validApiKey}`,
      `--apiSecret=${apiSecret}`,
      '-t',
      'tag1,tag2',
    ];

    const result = await parsedArgs(args);

    expect(result.tags).toEqual(['tag1', 'tag2']);
  });

  it('should handle the "accountSid/apiKey:apiSecret" format', async () => {
    const args = [
      'node',
      'script.js',
      `${validAccountSid}/${validApiKey}:${apiSecret}`,
    ];

    const result = await parsedArgs(args);

    expect(result).toEqual({
      services: [{ name: 'api', version: 'v2010' }],
      tags: [],
      accountSid: validAccountSid,
      apiKey: validApiKey,
      apiSecret,
    });
  });

  it('should handle individual arguments taking precedence over combined format', async () => {
    const args = [
      'node',
      'script.js',
      `${validAccountSid}/${validApiKey}:${apiSecret}`,
      `--accountSid=AC11111111111111111111111111111111`,
      `--apiKey=SK11111111111111111111111111111111`,
      `--apiSecret=differentSecret`,
    ];

    const result = await parsedArgs(args);

    expect(result).toEqual({
      services: [{ name: 'api', version: 'v2010' }],
      tags: [],
      accountSid: 'AC11111111111111111111111111111111',
      apiKey: 'SK11111111111111111111111111111111',
      apiSecret: 'differentSecret',
    });
  });

  it('should filter out invalid service formats', async () => {
    const args = [
      'node',
      'script.js',
      `--accountSid=${validAccountSid}`,
      `--apiKey=${validApiKey}`,
      `--apiSecret=${apiSecret}`,
      '--services=service1_v1,invalid,service2_v2,no_underscore_version',
    ];

    const result = await parsedArgs(args);

    expect(result.services).toEqual([
      { name: 'service1', version: 'v1' },
      { name: 'service2', version: 'v2' },
    ]);
  });

  it('should call process.exit if accountSid is invalid', async () => {
    const invalidAccountSid = 'invalid-account-sid';
    const args = [
      'node',
      'script.js',
      `--accountSid=${invalidAccountSid}`,
      `--apiKey=${validApiKey}`,
      `--apiSecret=${apiSecret}`,
    ];

    (isValidTwilioSid as Mock).mockImplementation((sid, prefix) => {
      return !(sid === invalidAccountSid && prefix === 'AC');
    });

    try {
      await parsedArgs(args);
    } catch (error) {
      /* no-ops */
    }

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should call process.exit if apiKey is invalid', async () => {
    const invalidApiKey = 'invalid-api-key';
    const args = [
      'node',
      'script.js',
      `--accountSid=${validAccountSid}`,
      `--apiKey=${invalidApiKey}`,
      `--apiSecret=${apiSecret}`,
    ];

    (isValidTwilioSid as Mock).mockImplementation((sid, prefix) => {
      return !(sid === invalidApiKey && prefix === 'SK');
    });

    try {
      await parsedArgs(args);
    } catch (error) {
      /* no-ops */
    }

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle multiple aliases in one call', async () => {
    const args = [
      'node',
      'script.js',
      `-a=${validAccountSid}`,
      `-k=${validApiKey}`,
      `-s=${apiSecret}`,
      '-t',
      'tag1,tag2',
      '-e',
      'service1_v1',
    ];

    const result = await parsedArgs(args);

    expect(result).toEqual({
      services: [{ name: 'service1', version: 'v1' }],
      tags: ['tag1', 'tag2'],
      accountSid: validAccountSid,
      apiKey: validApiKey,
      apiSecret,
    });
  });

  it('should ignore empty strings in tags list', async () => {
    const args = [
      'node',
      'script.js',
      `--accountSid=${validAccountSid}`,
      `--apiKey=${validApiKey}`,
      `--apiSecret=${apiSecret}`,
      '--tags=,,tag1,,tag2,,',
    ];

    const result = await parsedArgs(args);

    expect(result.tags).toEqual(['tag1', 'tag2']);
  });

  it('should handle when combined credential format is invalid', async () => {
    const args = [
      'node',
      'script.js',
      'invalidformat',
      `--accountSid=${validAccountSid}`,
      `--apiKey=${validApiKey}`,
      `--apiSecret=${apiSecret}`,
    ];

    const result = await parsedArgs(args);

    expect(result).toEqual({
      services: [{ name: 'api', version: 'v2010' }],
      tags: [],
      accountSid: validAccountSid,
      apiKey: validApiKey,
      apiSecret,
    });
  });
});
