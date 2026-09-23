import express, { NextFunction, Request, Response } from "express";
import { reportUserSchema, type ReportRow } from "@ciphersprint/shared";
import User from "../models/User";
import Report from "../models/Report";
import Message from "../models/Message";
import requireAuth from "../middleware/requireAuth";
import { validateBody } from "../middleware/validate";
import asyncHandler from "../utils/asyncHandler";
import { rateLimit } from "../utils/rateLimit";
import { isAdminUsername } from "./auth";

const router = express.Router();

// Reports are rate-limited so one person cannot bury the queue.
router.post(
  "/reports",
  requireAuth,
  rateLimit({ key: "report", max: 20, windowMs: 60 * 60 * 1000, message: "You've sent a lot of reports. Try again later." }),
  validateBody(reportUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { username, reason, note, context } = req.body;
    const [reporter, target] = await Promise.all([
      User.findById(req.userId).select("username").lean(),
      User.findOne({ username }).select("_id username").lean(),
    ]);
    if (!reporter || !target) return res.status(404).json({ error: "User not found" });
    if (String(target._id) === String(req.userId)) return res.status(400).json({ error: "You can't report yourself." });

    // For a message, keep the text as it was (it may be edited or deleted later)
    // and make sure it really was theirs.
    let excerpt: string | null = context.excerpt ?? null;
    if (context.kind === "message" && context.ref) {
      const msg = await Message.findById(context.ref).select("text senderId").lean().catch(() => null);
      if (!msg || String(msg.senderId) !== String(target._id)) {
        return res.status(400).json({ error: "That message isn't theirs." });
      }
      excerpt = msg.text.slice(0, 500);
    }

    await Report.create({
      reporter: req.userId,
      reporterUsername: reporter.username,
      target: target._id,
      targetUsername: target.username,
      reason,
      note,
      context: { kind: context.kind, ref: context.ref ?? null, excerpt },
    });
    res.status(201).json({ ok: true });
  })
);

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = await User.findById(req.userId).select("username").lean();
  if (!user || !isAdminUsername(user.username)) return res.status(403).json({ error: "Admins only." });
  next();
}

router.get(
  "/admin/reports",
  requireAuth,
  asyncHandler(requireAdmin),
  asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status === "resolved" ? "resolved" : "open";
    const rows = await Report.find({ status }).sort({ createdAt: -1 }).limit(200).lean();
    const reports: ReportRow[] = rows.map((r) => ({
      id: String(r._id),
      reporter: r.reporterUsername,
      target: r.targetUsername,
      reason: r.reason,
      note: r.note,
      context: { kind: r.context.kind, ref: r.context.ref ?? null, excerpt: r.context.excerpt ?? null },
      status: r.status,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
    res.json({ reports });
  })
);

router.patch(
  "/admin/reports/:id",
  requireAuth,
  asyncHandler(requireAdmin),
  asyncHandler(async (req: Request, res: Response) => {
    const status = req.body?.status === "open" ? "open" : "resolved";
    const updated = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean().catch(() => null);
    if (!updated) return res.status(404).json({ error: "Report not found" });
    res.json({ ok: true, status });
  })
);

export default router;
