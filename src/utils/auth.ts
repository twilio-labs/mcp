import keytar from 'keytar';

type Credentials = {
  accountSid: string;
  apiKey: string;
  apiSecret: string;
};

const setCredentials = async (
  accountSid: string,
  apiKey: string,
  apiSecret: string,
) => {
  const accounts = await keytar.findCredentials('twilio-mcp-server');

  if (accounts.length) {
    for (const account of accounts) {
      await keytar.deletePassword('twilio-mcp-server', account.account);
    }
  }

  await keytar.setPassword(
    'twilio-mcp-server',
    accountSid,
    `${apiKey}:${apiSecret}`,
  );
};

const getCredentials = async (): Promise<Credentials | null> => {
  const credentials = await keytar.findCredentials('twilio-mcp-server');

  if (!credentials.length) {
    return null;
  }

  const [apiKey, apiSecret] = credentials[0].password.split(':');
  return { accountSid: credentials[0].account, apiKey, apiSecret };
};

export default {
  setCredentials,
  getCredentials,
};
