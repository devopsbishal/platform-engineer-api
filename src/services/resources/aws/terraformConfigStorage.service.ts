import logger from '../../../utils/logger';
import redisClient from '../../../utils/redisClient';

const storeTerraformConfig = async (key: string, config: string) => {
  try {
    await redisClient.set(key, config, { EX: 86400 }); // Store the Terraform config in Redis for 1 hour
    logger.info('Terraform config stored successfully in Redis.');
  } catch (error) {
    logger.error(`Error storing Terraform config in Redis: ${error}`);
    throw error;
  }
};

const TerraformConfigStorageService = {
  storeTerraformConfig,
};

export default TerraformConfigStorageService;
