const { validateEnv, config } = require('./config/env'); // validates env first
validateEnv();

const app       = require('./app');
const connectDB = require('./config/db');
const logger    = require('./utils/logger');

const startServer = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info(`Server running in ${config.env} mode on port ${config.port}`);
    logger.info(`Swagger docs: http://localhost:${config.port}/api-docs`);
  });

  // Graceful shutdown on unhandled signals
  const shutdown = (signal) => {
    logger.warn(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Promise Rejection: ${reason}`);
    shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
    process.exit(1);
  });
};

startServer();
