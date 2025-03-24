import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Check if a string is a valid Twilio SID
 * @param sid
 * @param prefix
 */
export const isValidTwilioSid = (sid: string, prefix: string): boolean =>
  new RegExp(`^${prefix}[A-Za-f0-9]{32}$`).test(sid);

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
