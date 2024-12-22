/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from 'jsonwebtoken';

import log from './logger';

import type { JwtPayload } from 'jsonwebtoken';
import type { ObjectId } from 'mongoose';

const generateAccessToken = (userId: ObjectId, secretKey: string, expiresIn = '1d'): string => {
  const token = jwt.sign({ id: userId }, secretKey, {
    expiresIn: expiresIn,
  });

  return token;
};

const generateRefreshToken = (userId: ObjectId, secretKey: string, expiresIn = '7d'): string => {
  const token = jwt.sign({ id: userId }, secretKey, {
    expiresIn: expiresIn,
  });

  return token;
};

const verifyAccessToken = (accessToken: string, secretKey: string): any => {
  try {
    const decoded = jwt.verify(accessToken, secretKey) as JwtPayload;
    return { payload: decoded, expired: false };
  } catch (error: any) {
    log.error(error);
    return { payload: null, expired: error.message.includes('jwt expired') };
  }
};

const verifyRefreshToken = (refreshToken: string, secretKey: string): any => {
  try {
    const decoded = jwt.verify(refreshToken, secretKey) as JwtPayload;
    return { refreshPayload: decoded, expired: false };
  } catch (error: any) {
    log.error(error);
    return {
      refreshPayload: null,
      expired: error.message.includes('jwt expired'),
    };
  }
};

const decodeJwtToken = (token: string) => {
  try {
    const decodedData = jwt.decode(token, { complete: true });
    return decodedData;
  } catch (error) {
    log.error(error);
    return null;
  }
};

const jwtGenerator = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeJwtToken,
};

export default jwtGenerator;
