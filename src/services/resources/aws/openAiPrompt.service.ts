import type { EC2OpenAiPayload } from '../../../interfaces/openAI.interface';

const sampleEc2TerraformConfig = `
resource "aws_key_pair" "ssh_key" {
  key_name   = "{{INSTANCE_NAME}}-key"
  public_key = "{{PUBLIC_KEY}}"
}

resource "aws_security_group" "ec2_sg" {
  name        = "{{INSTANCE_NAME}}-sg"
  description = "Allow SSH, HTTP, and HTTPS traffic"

  tags = {
    Name = "{{INSTANCE_NAME}}-sg"
  }
}

resource "aws_security_group_rule" "allow_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ec2_sg.id
}

resource "aws_security_group_rule" "allow_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ec2_sg.id
}

resource "aws_security_group_rule" "allow_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ec2_sg.id
}

resource "aws_instance" "ec2_instances" {
  for_each = toset([for i in range({{INSTANCE_COUNT}}) : "{{INSTANCE_NAME}}-${'i' + 1}"])

  ami           = "{{AMI_ID}}"
  instance_type = "{{INSTANCE_TYPE}}"
  key_name      = aws_key_pair.ssh_key.key_name
  security_groups = [aws_security_group.ec2_sg.name]

  tags = {
    Name  = each.key
    Env   = "{{ENV}}"
    Stack = "{{STACK}}"
  }
}
`;

const generateSystemPromptForCreatingEc2Instance = () => {
  return `
  You are an expert in Terraform. Always use the following Terraform configuration as a reference when generating EC2 Terraform configurations:
    ---
    ${sampleEc2TerraformConfig}
    ---
  When generating new configurations, only modify instance details based on user provided parameter, while keeping the structure consistent. Return only the Terraform configuration without explanations or additional formatting or HCL code fences. And you do not need to include the provider section.
  `;
};

const generatePromptForCreatingEc2Instance = (payload: EC2OpenAiPayload) => {
  const { numberOfInstance, instanceType, amiId, tags, instanceName, publicKey } = payload;

  const prompt = `
  Now generate a valid Terraform configuration file to create ${numberOfInstance} EC2 instance(s) in AWS.
    - Instance Type: '${instanceType}'.
    - AMI: '${amiId}'.
    - Instance Names: '${instanceName}-1', '${instanceName}-2', etc.
    - Tags: ${JSON.stringify(tags, null, 2)}.
    - Don't forget to add Name tag with value each.key
    - SSH Key Pair: '${instanceName}-key' (public key: '${publicKey.trim()}')
    `;
  return prompt;
};

const systemPrompt =
  'You are an expert in Terraform. Your task is to generate only valid, executable Terraform configuration files without any explanation.';

const OpenAiPromptService = {
  generatePromptForCreatingEc2Instance,
  generateSystemPromptForCreatingEc2Instance,
  systemPrompt,
};

export default OpenAiPromptService;
