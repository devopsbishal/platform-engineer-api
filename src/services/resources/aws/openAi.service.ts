import logger from '../../../utils/logger';
import { openAiClient } from '../../../utils/openai';

import OpenAiPromptService from './openAiPrompt.service';

import type { EC2OpenAiPayload } from '../../../interfaces/openAI.interface';

const cache = new Map(); // Simple in-memory cache

const generateEc2InstanceTerraformConfigFile = async (payload: EC2OpenAiPayload) => {
  try {
    // Generate a structured prompt
    const cacheKey = JSON.stringify(payload); // Unique key based on input

    if (cache.has(cacheKey)) {
      logger.info('Returning cached Terraform config...');
      return cache.get(cacheKey);
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

    cache.set(cacheKey, terraformConfig); // Store in cache
    // You can return or store the terraformConfig as needed
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
