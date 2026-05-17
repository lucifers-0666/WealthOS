/**
 * Winston logger — structured JSON in production, pretty in dev.
 */

const { createLogger, format, transports } = require('winston') || (() => {
  // Fallback minimal logger if winston is not installed
  const log = (level, msg) => console[level === 'error' ? 'error' : 'log'](`[${level.toUpperCase()}] ${msg}`);
  return {
    createLogger: () => ({
      info: (m) => log('info', m),
      warn: (m) => log('warn', m),
      error: (m) => log('error', m),
      debug: (m) => log('debug', m),
    }),
    format: { combine: () => {}, timestamp: () => {}, printf: () => {}, colorize: () => {}, json: () => {} },
    transports: { Console: class {} },
  };
})();

const isProd = process.env.NODE_ENV === 'production';

let logger;
try {
  const winston = require('winston');
  logger = winston.createLogger({
    level: isProd ? 'info' : 'debug',
    format: isProd
      ? winston.format.combine(winston.format.timestamp(), winston.format.json())
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
        ),
    transports: [new winston.transports.Console()],
  });
} catch {
  logger = {
    info: (m) => console.log('[INFO]', m),
    warn: (m) => console.warn('[WARN]', m),
    error: (m) => console.error('[ERROR]', m),
    debug: (m) => console.log('[DEBUG]', m),
  };
}

module.exports = logger;
