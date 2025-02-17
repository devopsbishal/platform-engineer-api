import express from 'express';

import connectToDb from './configs/db.config';
import { startApp } from './server';
import logger from './utils/logger';
import redisClient from './utils/redisClient';

import type { Express } from 'express';

const initialize = async (): Promise<void> => {
  const app: Express = express();

  try {
    // Attempt to connect to the MongoDB cluster
    await connectToDb({
      dbUri: process.env.DB_URI || '',
      environment: process.env.ENVIRONMENT || '',
    });

    // Connect to Redis
    await redisClient.connect();

    // Start the API server
    startApp(app);
  } catch (error) {
    logger.error(`Failed to connect to either mongodb or redis database so the server will not start: ${error}`);
    process.exit(1);
  }
};

initialize();
