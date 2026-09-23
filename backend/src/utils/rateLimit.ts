import { Request, Response, NextFunction } from "express";

// A fixed-window limiter per client IP (and route key), in memory like the
// rest of the per-process state. Enough to stop password guessing and
// search scraping from one machine; a shared store is needed across servers.

interface Window {
  count: number;
  resetAt: number;
}

export function rateLimit({ key, max, windowMs, message }: { key: string; max: number; windowMs: number; message?: string }) {
  const hits = new Map<string, Window>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const id = `${key}:${req.ip}`;
    let w = hits.get(id);
    if (!w || w.resetAt <= now) {
      w = { count: 0, resetAt: now + windowMs };
      hits.set(id, w);
      if (hits.size > 50000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
    }
    w.count += 1;
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - w.count)));
    if (w.count > max) {
      const retry = Math.ceil((w.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retry));
      return res.status(429).json({ error: message ?? `Too many attempts. Try again in ${Math.ceil(retry / 60)} min.` });
    }
    next();
  };
}
