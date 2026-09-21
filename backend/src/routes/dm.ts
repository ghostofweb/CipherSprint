import express, { Request, Response } from "express";
import User from "../models/User";
import Message from "../models/Message";
import requireAuth from "../middleware/requireAuth";
import asyncHandler from "../utils/asyncHandler";
import { areFriends, getOrCreateDirectConversation } from "../utils/chatAccess";

const router = express.Router();
router.use(requireAuth);

router.post(
  "/:username",
  asyncHandler(async (req: Request, res: Response) => {
    const target = await User.findOne({ username: req.params.username }).select("_id username avatarUrl").lean();
    if (!target) return res.status(404).json({ error: "User not found" });
    if (String(target._id) === String(req.userId)) {
      return res.status(400).json({ error: "You can't message yourself" });
    }

    const friends = await areFriends(req.userId as string, target._id);
    if (!friends) return res.status(403).json({ error: "You can only message friends" });

    const conversation = await getOrCreateDirectConversation(req.userId as string, target._id);
    res.json({ conversation, otherUser: { username: target.username, avatarUrl: target.avatarUrl } });
  })
);

router.get(
  "/:username/messages",
  asyncHandler(async (req: Request, res: Response) => {
    const target = await User.findOne({ username: req.params.username }).select("_id").lean();
    if (!target) return res.status(404).json({ error: "User not found" });

    const friends = await areFriends(req.userId as string, target._id);
    if (!friends) return res.status(403).json({ error: "You can only message friends" });

    const conversation = await getOrCreateDirectConversation(req.userId as string, target._id);
    const limit = Math.min(parseInt(String(req.query.limit), 10) || 50, 100);
    const query: Record<string, unknown> = { contextType: "dm", contextId: conversation._id };
    if (req.query.before) query.createdAt = { $lt: new Date(Number(req.query.before)) };

    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ conversation, messages: messages.reverse() });
  })
);

export default router;
