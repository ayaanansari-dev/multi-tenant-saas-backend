import bcrypt from 'bcrypt';
import { env } from '../config/env';

const SALT_ROUNDS = parseInt(env.API_KEY_SALT_ROUNDS);

export const hashValue = async (value: string): Promise<string> => {
  return bcrypt.hash(value, SALT_ROUNDS);
};

export const compareHash = async (plain: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(plain, hashed);
};

export const hashChain = (data: string, previousHash: string | null): string => {
  const crypto = require('crypto');
  const input = previousHash ? `${previousHash}:${data}` : data;
  return crypto.createHash('sha256').update(input).digest('hex');
};