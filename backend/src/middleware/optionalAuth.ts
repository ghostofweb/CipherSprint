import { Request, Response, NextFunction } from "express";
import { verifySession } from "../utils/tokens";

// Like requireAuth, but never rejects the request -- sets req.userId when a
// valid token is present, otherwise leaves it undefined and lets the route
// decide what an anonymous caller can see.
export default async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const userId = await verifySession(token);
    if (userId) req.userId = userId;
  } catch {
    // Treat a lookup failure as anonymous on an optional route.
  }
  next();
}
