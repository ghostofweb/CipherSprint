import express, { Request, Response } from "express";
import { mediaSignatureSchema } from "@ciphersprint/shared";
import GroupMember from "../models/GroupMember";
import requireAuth from "../middleware/requireAuth";
import { validateBody } from "../middleware/validate";
import asyncHandler from "../utils/asyncHandler";
import { cloudinary } from "../utils/cloudinary";

const router = express.Router();
router.use(requireAuth);

// The client asks to upload into one of two folder shapes; we validate it
// server-side rather than trusting an arbitrary folder string, so a user
// can only ever get a signature for their own avatar or a group they own.
router.post(
  "/signature",
  validateBody(mediaSignatureSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { folder } = req.body;

    const userMatch = folder.match(/^users\/([a-f0-9]{24})$/);
    const groupMatch = folder.match(/^groups\/([a-f0-9]{24})$/);

    if (userMatch) {
      if (userMatch[1] !== String(req.userId)) return res.status(403).json({ error: "Not authorized" });
    } else if (groupMatch) {
      const membership = await GroupMember.findOne({ groupId: groupMatch[1], userId: req.userId, role: "owner" });
      if (!membership) return res.status(403).json({ error: "Only the group owner can change its avatar" });
    } else {
      return res.status(400).json({ error: "Invalid folder" });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET as string);

    res.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
    });
  })
);

export default router;
