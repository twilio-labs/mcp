import { randomUUID } from 'crypto';

import pino from 'pino';

const jsonRpcTransport = {
  write(obj: any) {
    const logData = typeof obj === 'string' ? JSON.parse(obj) : obj;

    const jsonRpc = {
      jsonrpc: '2.0',
      method: 'log',
      params: {
        level: logData.level,
        time: logData.time,
        message: logData.msg,
        module: logData.module || 'default',
        // Include any other properties from the original log
        ...Object.fromEntries(
          Object.entries(logData).filter(
            ([key]) => !['level', 'time', 'msg'].includes(key),
          ),
        ),
      },
      id: logData.id || randomUUID(),
    };

    // Output the formatted log
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(jsonRpc));
  },
};

const cliTransport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'HH:MM:ss Z',
    ignore: 'pid,hostname',
  },
});

const transport = process.stdout.isTTY ? cliTransport : jsonRpcTransport;

const logger = pino(
  {
    level: 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    base: null,
    formatters: {
      log(object) {
        return object;
      },
    },
  },
  transport,
);

export default logger;
