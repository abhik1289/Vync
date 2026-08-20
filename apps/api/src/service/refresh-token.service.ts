import { generateRandomToken, hashToken } from "../utils/token.js";
import { authConfig } from "../config/auth.config.js";
import { UnauthorizedError } from "../utils/AppError.js";
import * as refreshTokenRepository from "../repository/refresh-token.repository.js";

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  const multiplier = unit ? multipliers[unit] : undefined;
  return value * (multiplier ?? 1000);
}

/** Creates a refresh token record and returns the raw (plaintext) token. */
export async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + parseDurationToMs(authConfig.refreshTokenExpiresIn),
  );

  await refreshTokenRepository.createRefreshToken({
    userId,
    tokenHash,
    expiresAt,
  });

  return rawToken;
}

/** Validates a raw refresh token, returning the user id and token id. */
export async function validateRefreshToken(
  rawToken: string,
): Promise<RefreshTokenPayload> {
  const tokenHash = hashToken(rawToken);
  const record = await refreshTokenRepository.findRefreshTokenByHash(tokenHash);

  if (!record || record.revokedAt) {
    throw new UnauthorizedError(
      "Invalid refresh token",
      "INVALID_REFRESH_TOKEN",
    );
  }
  if (record.expiresAt.getTime() <= Date.now()) {
    throw new UnauthorizedError(
      "Refresh token has expired",
      "REFRESH_TOKEN_EXPIRED",
    );
  }

  return { userId: record.userId, tokenId: record.id };
}

/** Revokes a single refresh token (used on logout). */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await refreshTokenRepository.revokeRefreshToken(tokenHash);
}

/** Revokes all refresh tokens belonging to a user. */
export async function revokeAllUserRefreshTokens(
  userId: string,
): Promise<void> {
  await refreshTokenRepository.revokeAllUserRefreshTokens(userId);
}
