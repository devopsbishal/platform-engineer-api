import type { EC2Instance } from '../schemas/resources/aws/ec2.schema';

export interface EC2OpenAiPayload extends EC2Instance {
  region: string;
  publicKey: string;
}
