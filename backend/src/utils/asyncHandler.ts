import { Request, Response, NextFunction, RequestHandler } from "express";

// Forwards a rejected promise from an async route handler to Express's error
// middleware, since Express 4 doesn't do this automatically.
export default function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
