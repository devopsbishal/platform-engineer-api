import express from 'express';

import connectToDb from './configs/db.config';
import { startApp } from './server';
import logger from './utils/logger';

import type { Express } from 'express';

const initialize = async (): Promise<void> => {
  const app: Express = express();

  try {
    // Attempt to connect to the MongoDB cluster
    await connectToDb({
      dbUri: process.env.DB_URI || '',
      environment: process.env.ENVIRONMENT || '',
    });

    // Start the API server
    startApp(app);
  } catch (error) {
    logger.error(`Failed to connect to the database so the server will not start: ${error}`);
    process.exit(1);
  }
};

initialize();
