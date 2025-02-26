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
    console.log(JSON.stringify(jsonRpc));
  },
};

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
  jsonRpcTransport,
);

export default logger;
