import { EC2KeyPairModel } from '../../../models/resources/aws/key.model';
import BaseRepository from '../../base.repository';

import type { DbQueryOptions, DbTransactionOptions } from '../../../interfaces/query.interface';
import type { EC2KeyPairDBDoc } from '../../../schemas/resources/aws/key.schema';
import type { ObjectId } from 'mongoose';

const create = async (data: Partial<EC2KeyPairDBDoc>, options?: DbTransactionOptions): Promise<EC2KeyPairDBDoc> => {
  return BaseRepository.create(EC2KeyPairModel, data, options);
};

const bulkSave = async (data: Partial<EC2KeyPairDBDoc[]>, options?: DbTransactionOptions): Promise<EC2KeyPairDBDoc[]> => {
  const filteredData = data.filter((item): item is EC2KeyPairDBDoc => item !== undefined);
  return BaseRepository.bulkInsert(EC2KeyPairModel, filteredData, options);
};

const update = async (condition: object, data: Partial<EC2KeyPairDBDoc>, options: DbTransactionOptions = {}): Promise<EC2KeyPairDBDoc | null> => {
  return BaseRepository.update(EC2KeyPairModel, condition, data, options);
};

const updateMany = async (condition: object, data: Partial<EC2KeyPairDBDoc>, options: DbTransactionOptions = {}): Promise<void> => {
  await BaseRepository.updateMany(EC2KeyPairModel, condition, data, options);
};

const destroy = async (condition: object = {}, options: DbTransactionOptions = {}): Promise<EC2KeyPairDBDoc | null> => {
  return BaseRepository.destroy(EC2KeyPairModel, condition, options);
};

const softDelete = async (condition: object = {}): Promise<EC2KeyPairDBDoc | null> => {
  return BaseRepository.softDelete(EC2KeyPairModel, condition);
};

const findOne = async (condition: object = {}, options: DbQueryOptions = {}): Promise<EC2KeyPairDBDoc | null> => {
  return BaseRepository.findOne(EC2KeyPairModel, condition, options);
};

const findById = async (id: ObjectId | string): Promise<EC2KeyPairDBDoc | null> => {
  return BaseRepository.findById(EC2KeyPairModel, id);
};

const findAll = async (condition: object = {}, options: DbQueryOptions = {}): Promise<EC2KeyPairDBDoc[] | null> => {
  return BaseRepository.findAll(EC2KeyPairModel, condition, options);
};

const AwsKeyPairRepository = {
  destroy,
  softDelete,
  findOne,
  findById,
  findAll,
  create,
  update,
  bulkSave,
  updateMany,
};

export default AwsKeyPairRepository;
