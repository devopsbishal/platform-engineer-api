import TemplateService from '../template/template.service';

const getTerraformConfigFile = async (payload: { terraformWritePath: string }) => {
  const { terraformWritePath } = payload;
  const terraformConfigFile = `${terraformWritePath}/terraform.tf`;

  const terraformConfig = await TemplateService.generateTerraformConfigFile({
    content: {
      BACKEND_KEY: terraformConfigFile,
    },
    fileWritePath: terraformConfigFile,
  });

  return { terraformConfig, terraformConfigFile };
};

const AwsSharedService = {
  getTerraformConfigFile,
};

export default AwsSharedService;
