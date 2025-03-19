import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Check if a string is a valid Twilio SID
 * @param sid
 * @param prefix
 */
export const isValidTwilioSid = (sid: string, prefix: string): boolean =>
  new RegExp(`^${prefix}[A-Za-f0-9]{32}$`).test(sid);

/**
 * Interpolate URL with params
 * @param url
 * @param params
 */
export const interpolateUrl = (
  url: string,
  params?: Record<string, unknown>,
) => {
  if (!params) {
    return url;
  }

  if (Array.isArray(params)) {
    return url;
  }

  return url.replace(/{(.*?)}/g, (_, key) => {
    const value = params[key];
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value.toString();
    }

    return `{${key}}`;
  });
};

/**
 * Check if a tool requires an AccountSid
 * @param tool
 */
export const toolRequiresAccountSid = (tool: Tool) => {
  const requiresAccountSid =
    tool.inputSchema.properties?.AccountSid ||
    tool.inputSchema.properties?.accountSid;

  if (!requiresAccountSid) {
    return { requiresAccountSid: false, accountSidKey: '' };
  }

  if (tool.inputSchema.properties?.AccountSid) {
    return { requiresAccountSid: true, accountSidKey: 'AccountSid' };
  }

  return { requiresAccountSid: true, accountSidKey: 'accountSid' };
};
