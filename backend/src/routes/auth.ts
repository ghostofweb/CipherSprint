import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { signupSchema, loginSchema, googleCompleteSchema, usernameSchema } from "@ciphersprint/shared";
import User, { IUser } from "../models/User";
import PersonalBest from "../models/PersonalBest";
import requireAuth from "../middleware/requireAuth";
import { validateBody } from "../middleware/validate";
import asyncHandler from "../utils/asyncHandler";
import { summarize } from "../utils/aggregates";
import { generateUniquePublicId } from "../utils/ids";

const router = express.Router();
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;
const GOOGLE_ONBOARDING_PURPOSE = "google-onboarding";

function publicUser(user: IUser) {
  return {
    id: user._id,
    username: user.username,
    publicId: user.publicId,
    email: user.email,
    createdAt: user.createdAt,
    isPublic: user.isPublic,
    showPresence: user.showPresence !== false,
    avatarUrl: user.avatarUrl,
  };
}

function signToken(userId: unknown): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: "30d" });
}

async function isUsernameAvailable(username: string): Promise<boolean> {
  return usernameSchema.safeParse(username).success && !(await User.exists({ username }));
}

router.get(
  "/username-available",
  asyncHandler(async (req: Request, res: Response) => {
    const username = String(req.query.username || "").trim();
    if (!username) return res.status(400).json({ error: "username is required" });
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      return res.json({ available: false, reason: parsed.error.issues[0]?.message });
    }
    res.json({ available: !(await User.exists({ username })) });
  })
);

router.post(
  "/signup",
  validateBody(signupSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ error: "A user with that email or username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const publicId = await generateUniquePublicId();
    const user = await User.create({
      username,
      usernameLower: username.toLowerCase(),
      publicId,
      email,
      passwordHash,
    });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  })
);

router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!user.passwordHash) {
      return res.status(400).json({ error: "This account uses Google sign-in" });
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ token: signToken(user._id), user: publicUser(user) });
  })
);

router.post(
  "/google",
  asyncHandler(async (req: Request, res: Response) => {
    if (!googleClient) {
      return res.status(501).json({ error: "Google sign-in isn't configured on this server" });
    }
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: "idToken is required" });

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: "Invalid Google credential" });
    }

    const googleId = payload?.sub;
    const email = payload?.email;
    if (!googleId || !email) return res.status(400).json({ error: "Google account has no email" });

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        user.googleId = googleId;
        await user.save();
      }
    }

    if (user) {
      return res.json({ token: signToken(user._id), user: publicUser(user) });
    }

    // Brand-new account: don't create it yet -- let the client choose a
    // username first. The pending token carries just enough to finish
    // account creation, and nothing else, once they submit one.
    const pendingToken = jwt.sign(
      { googleId, email: email.toLowerCase(), purpose: GOOGLE_ONBOARDING_PURPOSE },
      process.env.JWT_SECRET as string,
      { expiresIn: "10m" }
    );
    res.json({ needsUsername: true, pendingToken });
  })
);

router.post(
  "/google/complete",
  validateBody(googleCompleteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { pendingToken, username } = req.body;

    let payload: { googleId: string; email: string; purpose: string };
    try {
      payload = jwt.verify(pendingToken, process.env.JWT_SECRET as string) as typeof payload;
    } catch {
      return res.status(401).json({ error: "This sign-in has expired -- try again" });
    }
    if (payload.purpose !== GOOGLE_ONBOARDING_PURPOSE) {
      return res.status(400).json({ error: "Invalid pending token" });
    }

    if (!(await isUsernameAvailable(username))) {
      return res.status(409).json({ error: "That username is taken" });
    }

    // Race guard: someone else may have completed sign-in for this
    // googleId/email while this token was pending.
    const already = await User.findOne({ $or: [{ googleId: payload.googleId }, { email: payload.email }] });
    if (already) {
      return res.status(409).json({ error: "This account already exists -- sign in again" });
    }

    const publicId = await generateUniquePublicId();
    const user = await User.create({
      username,
      usernameLower: username.toLowerCase(),
      publicId,
      email: payload.email,
      googleId: payload.googleId,
    });

    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const personalBests = await PersonalBest.find({ userId: user._id })
      .select("mode modeDetail wpm accuracy consistency timestamp -_id")
      .lean();
    res.json({ user: publicUser(user), aggregates: summarize(user), personalBests });
  })
);

export default router;
