import { Request, Response, NextFunction } from "express";
import { verifySession } from "../utils/tokens";

export default async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const userId = await verifySession(token);
    if (!userId) return res.status(401).json({ error: "Your session has ended. Log in again." });
    req.userId = userId;
    next();
  } catch (err) {
    next(err);
  }
}
