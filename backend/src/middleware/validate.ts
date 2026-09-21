import { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

// Parses req.body through the given schema, replacing it with the parsed
// (and coerced/defaulted) value on success, or responding 400 with a
// flattened field-level error report on failure.
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const flat = result.error.flatten();
      return res.status(400).json({
        error: Object.values(flat.fieldErrors)[0]?.[0] || flat.formErrors[0] || "Invalid request",
        fieldErrors: flat.fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}
