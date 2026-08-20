import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";

/** Central error handler: maps AppError (and unknown errors) to JSON responses. */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
  }

  console.error("[error]", error);
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong. Please try again later.",
    },
  });
}
