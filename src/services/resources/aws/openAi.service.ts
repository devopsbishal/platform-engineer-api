import { generateHash } from '../../../utils/crypto';
import logger from '../../../utils/logger';
import { openAiClient } from '../../../utils/openai';
import redisClient from '../../../utils/redisClient';

import OpenAiPromptService from './openAiPrompt.service';
import TerraformConfigStorageService from './terraformConfigStorage.service';

import type { EC2OpenAiPayload } from '../../../interfaces/openAI.interface';

const generateEc2InstanceTerraformConfigFile = async (payload: EC2OpenAiPayload) => {
  try {
    const cacheKey = generateHash(JSON.stringify(payload)); // Generate a unique hash key

    // Check if the key exists in Redis
    const cachedConfig = await redisClient.get(cacheKey);
    if (cachedConfig) {
      logger.info('Returning cached Terraform config from Redis...');
      return cachedConfig;
    }

    const userPrompt = OpenAiPromptService.generatePromptForCreatingEc2Instance(payload);
    const systemPrompt = OpenAiPromptService.systemPrompt;

    const response = await openAiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      // max_tokens: 500,
    });

    const terraformConfig = response.choices[0]?.message?.content?.trim();

    if (!terraformConfig) {
      throw new Error('No Terraform configuration was generated.');
    }

    logger.info('Terraform config generated successfully.');

    // Store the Terraform config in Redis
    await TerraformConfigStorageService.storeTerraformConfig(cacheKey, terraformConfig);

    return terraformConfig;
  } catch (error) {
    logger.error(`Error at generateEc2InstanceTerraformConfigFile(): ${error}`);
    throw error;
  }
};

const AwsOpenAiService = {
  generateEc2InstanceTerraformConfigFile,
};

export default AwsOpenAiService;
