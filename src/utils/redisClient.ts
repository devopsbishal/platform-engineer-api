import { createClient } from 'redis';

import logger from './logger';

const redisClient = createClient({
  url: 'redis://localhost:6379',
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

export default redisClient;
