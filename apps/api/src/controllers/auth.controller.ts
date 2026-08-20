import type { NextFunction, Request, Response } from "express";
import {
  register,
  login,
  refreshTokens,
  logout,
  logoutAll,
  getCurrentUser,
} from "../service/auth.service.js";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  REFRESH_TOKEN_COOKIE,
} from "../utils/cookie.js";
import type { AuthRequest } from "../middleware/authenticate.js";

function sendAuthResponse(
  res: Response,
  result: { user: unknown; accessToken: string; refreshToken: string },
) {
  setRefreshTokenCookie(res, result.refreshToken);
  return res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
}

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await register(req.body);
    return sendAuthResponse(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await login(req.body);
    return sendAuthResponse(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const refreshToken =
      (req.body?.refreshToken as string | undefined) ??
      (req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined);

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: "NO_REFRESH_TOKEN",
          message: "Refresh token is required",
        },
      });
    }

    const result = await refreshTokens(refreshToken);
    setRefreshTokenCookie(res, result.refreshToken);
    return res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function logoutHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;
    await logout(refreshToken);
    clearRefreshTokenCookie(res);
    return res.status(200).json({ success: true, data: null });
  } catch (error) {
    return next(error);
  }
}

export async function logoutAllHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (req.userId) {
      await logoutAll(req.userId);
    }
    clearRefreshTokenCookie(res);
    return res.status(200).json({ success: true, data: null });
  } catch (error) {
    return next(error);
  }
}

export async function meHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }
    const user = await getCurrentUser(req.userId);
    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    return next(error);
  }
}
