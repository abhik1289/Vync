import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../service/jwt.service.js";
import { AppError } from "../utils/AppError.js";

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Verifies the `Authorization: Bearer <token>` header and attaches the
 * authenticated user id to the request.
 */
export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    return next(new AppError(401, "Authentication required", "NO_TOKEN"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    return next();
  } catch (error) {
    return next(error);
  }
}
