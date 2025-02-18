import EC2Service from '../../../services/resources/aws/ec2.service';
import { getValue } from '../../../utils/object';

import type { CustomRequest } from '../../../interfaces/auth.interface';
import type { NextFunction, Response } from 'express';

const createEC2Instance = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const ec2 = await EC2Service.createEC2Instance(req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'EC2 instance created successfully',
      ec2: ec2,
    });
  } catch (error) {
    next(error);
  }
};

const deleteEC2InstanceWithSameResourceId = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { resourceId } = req.params;
  try {
    await EC2Service.deleteEC2WithSameResourceId(resourceId);
    res.status(200).json({
      success: true,
      message: 'EC2 instances deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteSpecificEC2Instance = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { instanceId } = req.params;
  try {
    const response = await EC2Service.deleteSpecificEC2Instance(instanceId);
    res.status(200).json({
      success: true,
      message: 'EC2 instance deleted successfully',
      response,
    });
  } catch (error) {
    next(error);
  }
};

const getEC2IpAddress = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { resourceId } = req.params;
  try {
    const response = await EC2Service.getEC2IpAddress(resourceId);
    res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    next(error);
  }
};

const generateEc2InstanceTerraformConfigFile = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const terraformConfig = await EC2Service.generateEc2InstanceTerraformConfigFile(req.body);
    res.status(201).json({
      success: true,
      message: 'EC2 instance terraform config generated successfully',
      terraformConfig: terraformConfig,
    });
  } catch (error) {
    next(error);
  }
};

const getUserEc2InstanceList = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { page = '1', limit = '10' } = req.query;
  try {
    const ec2 = await EC2Service.getUserEc2InstanceList({ userId: getValue(req.user, '_id'), page: Number(page), limit: Number(limit) });
    res.status(200).json({
      instances: ec2,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

const getUserEc2InstanceDetails = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { instanceId } = req.params;
  try {
    const ec2 = await EC2Service.getUserEc2InstanceDetails({ userId: getValue(req.user, '_id'), instanceId: instanceId });
    res.status(200).json({
      instance: ec2,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

const createEC2InstanceUsingOpenAI = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const ec2 = await EC2Service.createEC2InstanceUsingOpenAI(req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'EC2 instance created successfully',
      ec2: ec2,
    });
  } catch (error) {
    next(error);
  }
};

const EC2Controller = {
  createEC2Instance,
  deleteEC2InstanceWithSameResourceId,
  deleteSpecificEC2Instance,
  getEC2IpAddress,
  generateEc2InstanceTerraformConfigFile,
  getUserEc2InstanceList,
  getUserEc2InstanceDetails,
  createEC2InstanceUsingOpenAI,
};

export default EC2Controller;
