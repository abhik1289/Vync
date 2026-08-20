import jwt, { type SignOptions, type VerifyOptions } from "jsonwebtoken";
import { authConfig } from "../config/auth.config.js";
import { UnauthorizedError } from "../utils/AppError.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

type JwtExpiresIn = NonNullable<SignOptions["expiresIn"]>;

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: authConfig.accessTokenExpiresIn as JwtExpiresIn,
  };
  return jwt.sign(payload, authConfig.accessTokenSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, authConfig.accessTokenSecret, {
      algorithms: ["HS256"],
    } as VerifyOptions);
    return decoded as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError(
      "Invalid or expired access token",
      "INVALID_ACCESS_TOKEN",
    );
  }
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    expiresIn: authConfig.refreshTokenExpiresIn as JwtExpiresIn,
  };
  return jwt.sign(payload, authConfig.refreshTokenSecret, options);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, authConfig.refreshTokenSecret, {
      algorithms: ["HS256"],
    } as VerifyOptions);
    return decoded as RefreshTokenPayload;
  } catch {
    throw new UnauthorizedError(
      "Invalid or expired refresh token",
      "INVALID_REFRESH_TOKEN",
    );
  }
}
