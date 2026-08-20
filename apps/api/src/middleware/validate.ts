import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";
import { AppError } from "../utils/AppError.js";

/**
 * Validates `req.body` against the provided Zod schema and attaches the
 * parsed result back onto the request body.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = (result.error as ZodError).issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(
        new AppError(400, "Invalid request body", "VALIDATION_ERROR", details),
      );
    }
    req.body = result.data;
    return next();
  };
}
