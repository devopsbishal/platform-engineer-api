import type { EC2OpenAiPayload } from '../../../interfaces/openAI.interface';

const sampleEc2TerraformConfig = `
resource "aws_key_pair" "ssh_key" {
  key_name   = "{{INSTANCE_NAME}}-key"
  public_key = "{{PUBLIC_KEY}}"
}

resource "aws_security_group" "ec2_sg" {
  name        = "{{INSTANCE_NAME}}-sg"
  description = "Allow SSH, HTTP, and HTTPS traffic"

  vpc_id = "{{VPC_ID}}" 

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

const generatePromptForCreatingEc2Instance = (payload: EC2OpenAiPayload) => {
  const { numberOfInstance, instanceType, amiId, tags, instanceName, publicKey } = payload;

  const prompt = ` 
  ---
  You are an expert in Terraform. Use the following sample Terraform configuration as a reference and generate a new configuration.

  ### Sample Config:
  ${sampleEc2TerraformConfig}

  ---
  Now generate a valid Terraform configuration file using above reference to create ${numberOfInstance} EC2 instance(s) in AWS.  
    - Use the instance type '${instanceType}'.  
    - Use the AMI '${amiId}'.  
    - Use 'for_each' instead of 'count' to create multiple instances.  
    - Generate instance names dynamically using the tag 'Name' in the format '${instanceName}-1', '${instanceName}-2', '${instanceName}-3', etc.  
    - Ensure that each instance has the following tags: ${JSON.stringify(tags, null, 2)}.  
    - Include a resource to create an SSH key pair named '${instanceName}-key' and use this value '${publicKey.trim()}' for public_key.  
    - Use this SSH key pair in the EC2 instance configuration.  
    - Use 'aws_vpc_security_group_ingress_rule' and 'aws_vpc_security_group_egress_rule' to manage security group rules instead of defining them inside 'aws_security_group'.  
    - Attach this security group to all EC2 instances.  
    - Return only the Terraform configuration content, without any explanations or HCL code fences.  
    - Do not include the provider section.
  `;

  return prompt;
};

const systemPrompt =
  'You are an expert in Terraform. Your task is to generate only valid, executable Terraform configuration files without any explanation.';

const OpenAiPromptService = {
  generatePromptForCreatingEc2Instance,
  systemPrompt,
};

export default OpenAiPromptService;
