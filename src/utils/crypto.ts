import crypto from 'crypto';

import forge from 'node-forge';

interface SSHKeyPair {
  privateKey: string;
  publicKey: string;
}

export const generateOtp = (length = 6): string => {
  const num = crypto.randomInt(1000000);
  const verificationCode = num.toString().padStart(length, '0');
  return verificationCode;
};

export const generateRandomString = (length: number): string =>
  crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, length); // return required number of characters

export const generateSSHKeyPair = (bits = 2048): SSHKeyPair => {
  // Generate RSA key pair
  const keypair = forge.pki.rsa.generateKeyPair({ bits });

  const publicKey = `${Buffer.from(forge.ssh.publicKeyToOpenSSH(keypair.publicKey)).toString('utf-8')}`;
  const privateKey = forge.ssh.privateKeyToOpenSSH(keypair.privateKey);

  return { privateKey, publicKey };
};

export function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
