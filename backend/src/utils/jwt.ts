import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { IUser } from '../models';

interface TokenPayload {
  userId: string;
  phone: string;
  role: string;
}

export const generateAccessToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    phone: user.phone,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as string,
  };

  return jwt.sign(payload, config.jwt.secret, options);
};

export const generateRefreshToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    phone: user.phone,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as string,
  };

  return jwt.sign(payload, config.jwt.refreshSecret, options);
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  } catch {
    return null;
  }
};

export const generateTokens = (user: IUser) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};
