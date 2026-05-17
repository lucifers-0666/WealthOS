const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[${req.method}] ${req.path} → ${status}: ${message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    logger.error(err.stack);
  }

  res.status(status).json({
    error: true,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

function notFound(req, res) {
  res.status(404).json({ error: true, message: `Route not found: ${req.method} ${req.path}` });
}

module.exports = { errorHandler, notFound };
