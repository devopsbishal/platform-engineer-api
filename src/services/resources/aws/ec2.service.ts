/* eslint-disable @typescript-eslint/no-explicit-any */
import { RESOURCE_STATUS, RESOURCE_TYPE } from '../../../constants/enum';
import { DynamicMessages } from '../../../constants/error';
import { transformEC2InstanceNumberToTerraformCompatible, transformResourceTags } from '../../../helpers/payloadTransformer.helper';
import {
  convertInstanceCountToString,
  getResourceFileWrittenPath,
  removeSpecificEC2FromTerraformResourceConfig,
} from '../../../helpers/resource.helper';
import { EC2Model } from '../../../models/resources/aws/ec2.model';
import BaseRepository from '../../../repositories/base.repository';
import EC2Repository from '../../../repositories/resources/aws/ec2.repository';
import ResourceRepository from '../../../repositories/resources/resource.repository';
import { generateSSHKeyPair } from '../../../utils/crypto';
import createError from '../../../utils/http.error';
import logger from '../../../utils/logger';
import { getValue } from '../../../utils/object';
import { generateResourceId } from '../../../utils/uuid';
import PaginationService from '../../pagination/pagination.service';
import ExecutionService from '../execution/execution.service';
import ResourceService from '../resource.service';
import TemplateService from '../template/template.service';

import AwsOpenAiService from './openAi.service';

import type { DbQueryOptions } from '../../../interfaces/query.interface';
import type { EC2DBDoc, EC2Instance } from '../../../schemas/resources/aws/ec2.schema';
import type { UserDbDoc } from '../../../schemas/user/user.schema';
import type { ClientSession } from 'mongoose';

const updateEC2InstanceStatus = async (data: { resourceId: string; status: string; options?: DbQueryOptions }) => {
  return EC2Repository.updateMany({ resourceId: data.resourceId }, { status: data.status }, data.options);
};

const markEC2InstanceAsDeleted = async (data: { resourceId: string; status: string; options?: DbQueryOptions }) => {
  return EC2Repository.updateMany({ resourceId: data.resourceId }, { status: data.status, isDeleted: true }, data.options);
};

const extractIpAddresses = (metaData: any): Array<{ privateIP: string; publicIP: string; resourceName: string }> => {
  const metaDataAsJavascriptObject = JSON.parse(metaData);
  const resourceList = getValue(metaDataAsJavascriptObject, 'values.root_module.child_modules', []) as unknown as any[];
  return resourceList
    .flatMap((resource) =>
      resource.resources.map((item: any) => ({
        privateIP: getValue(item, 'values.private_ip'),
        publicIP: getValue(item, 'values.public_ip'),
        resourceName: getValue(resource, 'address'),
      })),
    )
    .filter((item) => !!item.publicIP);
};

const updateIpAddressOfEC2Instances = async (data: { metaData: any; resourceId: string }) => {
  const { resourceId, metaData } = data;
  const ipAddressList = extractIpAddresses(metaData);

  const ipAddressUpdatePromiseList = ipAddressList.map((ipAddress) => {
    const updateEC2Data = {
      ipAddress: {
        publicIP: ipAddress.publicIP,
        privateIP: ipAddress.privateIP,
      },
    };
    const queryCondition = {
      resourceId: resourceId,
      terraformResourceName: ipAddress.resourceName,
    };
    return EC2Repository.update(queryCondition, updateEC2Data);
  });

  await Promise.all(ipAddressUpdatePromiseList);
};

const createEC2Instance = async (userData: UserDbDoc, ec2Data: EC2Instance) => {
  const session: ClientSession = await BaseRepository.getDbSession();
  session.startTransaction();
  try {
    const terraformWritePath = getResourceFileWrittenPath({
      userData: userData,
      resourceName: 'ec2-instances',
    });

    const terraformConfigFile = `${terraformWritePath}/terraform.tf`;
    const terraformEC2File = `${terraformWritePath}/ec2.tf`;
    const resourceTags = transformResourceTags(ec2Data.tags);
    const sshKey = generateSSHKeyPair();

    const terraformFilePromise = TemplateService.generateTerraformConfigFile({
      content: {
        BACKEND_KEY: terraformConfigFile,
      },
      fileWritePath: terraformConfigFile,
    });

    const resourceId = generateResourceId();

    const { instanceList, resourceList } = transformEC2InstanceNumberToTerraformCompatible({
      instanceData: {
        instance_type: ec2Data.instanceType,
        ami: ec2Data.amiId,
      },
      count: ec2Data.numberOfInstance,
    });

    // return;

    const ec2InstanceFilePromise = TemplateService.generateTerraformEC2File({
      content: {
        PUBLIC_KEY: sshKey.publicKey,
        KEY_PAIR_NAME: `ec2-keypair-${resourceId}`,
        EC2_TAG_KEY: `{
           ${resourceTags}
        }`,
        EC2_INSTANCE_NAME: ec2Data.instanceName,
        EC2_INSTANCE_TYPE: ec2Data.instanceType,
        EC2_AMI: ec2Data.amiId,
        EC2_NUMBER_OF_INSTANCE: convertInstanceCountToString(ec2Data.numberOfInstance),
        EC2_INSTANCE_LIST: instanceList,
      },
      fileWritePath: terraformEC2File,
    });

    const [terraformConfig, resourceConfig] = await Promise.all([terraformFilePromise, ec2InstanceFilePromise]);

    const ec2DBInsertData = resourceList.map((resource) => {
      const data = {
        ...ec2Data,
        resourceId: resourceId,
        userId: userData.id,
        sshKey: {
          privateKey: sshKey.privateKey,
          publicKey: sshKey.publicKey,
        },
        status: RESOURCE_STATUS.PENDING,
        terraformResourceName: resource.trim(),
      };

      return data as EC2DBDoc;
    });

    await EC2Repository.bulkSave(ec2DBInsertData, { session: session });

    await ResourceService.saveResourceDetails(
      {
        terraformConfig: terraformConfig,
        resourceConfig: resourceConfig,
        userId: userData.id,
        resourceType: RESOURCE_TYPE.EC2,
        status: RESOURCE_STATUS.PENDING,
        terraformStateFileS3Key: terraformConfigFile,
        resourceExecutionPath: terraformWritePath,
        resourceId: resourceId,
      },
      { session: session },
    );

    const callBack = (callBackData: { resourceId: string; resourceData: object }) => {
      const { resourceId, resourceData } = callBackData;
      ResourceRepository.update({ resourceId: resourceId }, resourceData);
      updateEC2InstanceStatus({ resourceId: resourceId, status: getValue(resourceData, 'status') });
      updateIpAddressOfEC2Instances({ resourceId: resourceId, metaData: getValue(resourceData, 'metaData') });
    };

    await ExecutionService.createResourceInCloud({ resourceId: resourceId, callBack: callBack, options: { session: session } });

    await session.commitTransaction();
    session.endSession();

    // return;
  } catch (error) {
    logger.error(error);
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const deleteEC2WithSameResourceId = async (resourceId: string) => {
  try {
    const callBack = (callBackData: { resourceId: string; resourceData: object }) => {
      const { resourceId, resourceData } = callBackData;
      ResourceRepository.update({ resourceId: resourceId }, resourceData);
      markEC2InstanceAsDeleted({ resourceId: resourceId, status: getValue(resourceData, 'status') });
    };

    const response = await ExecutionService.destroyResourceInCloud({ resourceId: resourceId, callBack: callBack });

    return response;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const deleteSpecificEC2Instance = async (ec2Id: string) => {
  try {
    const ec2Instance = await EC2Repository.findById(ec2Id);

    if (!ec2Instance) {
      throw createError(404, DynamicMessages.notFoundMessage(`EC2 instance with id: ${ec2Id}`));
    }

    const resource = await ResourceRepository.findOne({ resourceId: ec2Instance.resourceId });
    if (!resource) {
      throw createError(404, DynamicMessages.notFoundMessage(`Resource with resourceId: ${ec2Instance.resourceId}`));
    }

    const metaData = JSON.parse(resource.metaData);
    const ec2Data = getValue(metaData, 'values.root_module.child_modules', []) as unknown as Array<unknown>;

    const terraformEC2InstanceResourceIds = ec2Data.flatMap((item: any) => {
      return item.address;
    });

    const terraformResourceNameToDelete = terraformEC2InstanceResourceIds.find((tResource) => tResource === ec2Instance.terraformResourceName);

    const newResourceConfig = removeSpecificEC2FromTerraformResourceConfig({
      resourceConfig: resource.resourceConfig,
      resourceName: terraformResourceNameToDelete,
    });

    const callBack = (callBackData: { resourceId: string; resourceData: object }) => {
      const { resourceId, resourceData } = callBackData;
      const resourceStatus = getValue(resourceData, 'status');
      if (resourceStatus === RESOURCE_STATUS.RUNNING) {
        EC2Repository.update({ _id: ec2Instance._id }, { status: RESOURCE_STATUS.DELETED, isDeleted: true });
        ResourceRepository.update({ resourceId: resourceId }, { resourceConfig: newResourceConfig, ...resourceData });
      }
    };

    // execute the resource deletion command
    ExecutionService.destroySpecificResourceInCloud({
      resourceId: ec2Instance.resourceId,
      newResourceConfig: newResourceConfig,
      callBack: callBack,
    });

    return terraformEC2InstanceResourceIds;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const getEC2IpAddress = async (resourceId: string) => {
  const resource = await ResourceRepository.findOne({ resourceId: resourceId }, { select: ['metaData'] });
  if (!resource) {
    throw createError(404, DynamicMessages.notFoundMessage(`Resource with resourceId: ${resourceId}`));
  }
  const ipList = extractIpAddresses(resource?.metaData);

  return ipList;
};

const generateEc2InstanceTerraformConfigFile = async (ec2Data: EC2Instance) => {
  try {
    const sshKey = generateSSHKeyPair();

    const openAiEc2Payload = {
      ...ec2Data,
      region: 'us-east-1',
      publicKey: sshKey.publicKey,
    };
    const configData = await AwsOpenAiService.generateEc2InstanceTerraformConfigFile(openAiEc2Payload);
    return configData;
  } catch (error) {
    logger.error(`Error at generateEc2InstanceTerraformConfigFile(): ${error}`);
    throw error;
  }
};

const getUserEc2InstanceList = async (payload: { userId: string; page: number; limit: number }) => {
  const { userId, page, limit } = payload;
  const option = {
    condition: {
      userId: userId,
    },
    page: page,
    limit: limit,
    select: '-sshKey',
  };
  const instanceLists = await PaginationService.paginate(EC2Model, option);
  // const instanceLists = await EC2Repository.findAll({ userId: userId }, { select: ['-sshKey'] });
  return instanceLists;
};

const getUserEc2InstanceDetails = async (payload: { userId: string; instanceId: string }) => {
  const { userId, instanceId } = payload;
  const instanceDetails = await EC2Repository.findOne(
    {
      _id: instanceId,
      userId: userId,
    },
    { select: ['-sshKey'] },
  );
  return instanceDetails;
};

const EC2Service = {
  createEC2Instance,
  updateEC2InstanceStatus,
  deleteEC2WithSameResourceId,
  deleteSpecificEC2Instance,
  getEC2IpAddress,
  generateEc2InstanceTerraformConfigFile,
  getUserEc2InstanceList,
  getUserEc2InstanceDetails,
};

export default EC2Service;
