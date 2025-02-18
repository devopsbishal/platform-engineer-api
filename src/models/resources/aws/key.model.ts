import { Schema, model } from 'mongoose';

import { USER_STATUS, USER_STATUS_DB_ENUM } from '../../../constants/enum';

import type { EC2KeyPairDBDoc } from '../../../schemas/resources/aws/key.schema';
import type { Model } from 'mongoose';

const keyPairSchema = new Schema<EC2KeyPairDBDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'user',
    },
    privateKey: {
      type: String,
      required: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: USER_STATUS.ACTIVE,
      enum: USER_STATUS_DB_ENUM,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const EC2KeyPairModel: Model<EC2KeyPairDBDoc> = model('ec2KeyPair', keyPairSchema);
