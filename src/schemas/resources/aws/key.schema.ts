import type { Schema, Document } from 'mongoose';

export interface EC2KeyPairDBDoc extends Document {
  userId: Schema.Types.ObjectId;
  privateKey: string;
  publicKey: string;
  status: string;
  isDeleted: boolean;
}
