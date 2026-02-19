import knex from 'knex';
import knexConfig from '../config/database';
import { logger } from '../utils/logger';

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

if (!config) {
  throw new Error(`No knex configuration found for environment: ${environment}`);
}

const db = knex(config);

// Test database connection
const testConnection = async (): Promise<void> => {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

// Handle shutdown
process.on('SIGINT', async () => {
  logger.info('Closing database connection...');
  await db.destroy();
  process.exit(0);
});

export { db, testConnection };