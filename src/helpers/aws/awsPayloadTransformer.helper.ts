interface EC2Payload {
  instanceName: string;
}

export function transformEC2Payload(instanceName: string, numberOfInstance: number): EC2Payload[] {
  const transformedPayload = [];
  for (let i = 1; i <= numberOfInstance; i++) {
    transformedPayload.push({
      instanceName: `${instanceName}-${i}`,
    });
  }
  return transformedPayload;
}

const AwsPayloadTransformer = {
  transformEC2Payload,
};

export default AwsPayloadTransformer;
