import EC2Service from '../../../services/resources/aws/ec2.service';

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

const deleteEC2Instance = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { resourceId } = req.params;
  try {
    await EC2Service.deleteEC2Instance(resourceId);
    res.status(200).json({
      success: true,
      message: 'EC2 instance deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteSpecificEC2Instance = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { resourceId } = req.params;
  try {
    const response = await EC2Service.deleteSpecificEC2Instance(resourceId);
    res.status(200).json({
      success: true,
      message: 'EC2 instance deleted successfully',
      response,
    });
  } catch (error) {
    next(error);
  }
};

const EC2Controller = {
  createEC2Instance,
  deleteEC2Instance,
  deleteSpecificEC2Instance,
};

export default EC2Controller;
