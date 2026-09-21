import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Like requireAuth, but never rejects the request -- sets req.userId when a
// valid token is present, otherwise leaves it undefined and lets the route
// decide what an anonymous caller can see.
export default function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    req.userId = payload.userId;
  } catch {
    // Invalid/expired token on an optional route: treat as anonymous.
  }
  next();
}
