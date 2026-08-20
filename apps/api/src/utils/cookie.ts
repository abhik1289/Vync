import { Response } from "express";
import { authConfig } from "../config/auth.config.js";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const REFRESH_TOKEN_COOKIE = "vync_refresh_token";

export function getRefreshTokenCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
} {
  const maxAgeMs = parseDurationToMs(authConfig.refreshTokenExpiresIn);
  return {
    httpOnly: true,
    secure: authConfig.nodeEnv === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: maxAgeMs,
  };
}

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
): void {
  res.cookie(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    getRefreshTokenCookieOptions(),
  );
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...getRefreshTokenCookieOptions(),
    maxAge: 0,
  });
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
