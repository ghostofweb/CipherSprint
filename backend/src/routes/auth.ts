import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { signupSchema, loginSchema, googleCompleteSchema, usernameSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "@ciphersprint/shared";
import User, { IUser } from "../models/User";
import PersonalBest from "../models/PersonalBest";
import requireAuth from "../middleware/requireAuth";
import { validateBody } from "../middleware/validate";
import asyncHandler from "../utils/asyncHandler";
import { summarize } from "../utils/aggregates";
import { generateUniquePublicId } from "../utils/ids";
import { signToken as signSession, forgetVersion } from "../utils/tokens";
import { rateLimit } from "../utils/rateLimit";
import { sendMail, mailConfigured } from "../utils/mailer";

const router = express.Router();
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;
const GOOGLE_ONBOARDING_PURPOSE = "google-onboarding";

const adminNames = () =>
  (process.env.ADMIN_USERNAMES || "")
    .split(",")
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);

export const isAdminUsername = (username: string) => adminNames().includes(username.toLowerCase());

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
    hasPassword: Boolean(user.passwordHash),
    isAdmin: isAdminUsername(user.username),
  };
}

const signToken = (user: IUser) => signSession(user._id, user.tokenVersion ?? 0);

// Login, signup and password endpoints share one budget per IP.
// AUTH_RATE_LIMIT overrides the budget (e.g. for automated tests).
const authLimit = rateLimit({ key: "auth", max: Number(process.env.AUTH_RATE_LIMIT) || 20, windowMs: 15 * 60 * 1000 });
// Reset emails are rarer still, so an inbox cannot be flooded.
const mailLimit = rateLimit({ key: "mail", max: 5, windowMs: 60 * 60 * 1000, message: "Too many reset emails. Try again in an hour." });

const RESET_PURPOSE = "password-reset";
// Signed with the current password hash mixed into the secret, so a link
// stops working the moment it has been used (the hash changes).
const resetSecret = (user: IUser) => `${process.env.JWT_SECRET}:${user.passwordHash ?? "none"}:${user.tokenVersion ?? 0}`;

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
  authLimit,
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
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

router.post(
  "/login",
  authLimit,
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

    res.json({ token: signToken(user), user: publicUser(user) });
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
      return res.json({ token: signToken(user), user: publicUser(user) });
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

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
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

// Change the password while signed in. Every other session is signed out;
// this one gets a fresh token.
router.post(
  "/password",
  authLimit,
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.passwordHash) {
      return res.status(400).json({ error: "This account signs in with Google. Use \"Forgot password\" to add a password." });
    }
    if (!(await bcrypt.compare(req.body.current, user.passwordHash))) {
      return res.status(401).json({ error: "That isn't your current password." });
    }
    user.passwordHash = await bcrypt.hash(req.body.next, 10);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();
    forgetVersion(String(user._id));
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

// Always the same answer, so the endpoint never reveals who has an account.
router.post(
  "/forgot",
  mailLimit,
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const token = jwt.sign({ sub: String(user._id), purpose: RESET_PURPOSE }, resetSecret(user), { expiresIn: "30m" });
      const origin = (process.env.CLIENT_ORIGIN || "http://localhost:3001").replace(/\/$/, "");
      const link = `${origin}/reset?token=${encodeURIComponent(token)}`;
      await sendMail({
        to: user.email,
        subject: "Reset your CipherSprint password",
        text: `Hi ${user.username},

Use this link to choose a new password. It works once and expires in 30 minutes:

${link}

If you didn't ask for this, ignore this email; your password stays the same.`,
        html: `<div style="font-family:ui-monospace,Menlo,monospace;font-size:15px;line-height:1.6;color:#1c2024"><p>Hi ${user.username},</p><p>Use this link to choose a new password. It works once and expires in 30 minutes.</p><p><a href="${link}" style="color:#a85f00">Choose a new password</a></p><p style="color:#6b7280">If you didn't ask for this, ignore this email; your password stays the same.</p></div>`,
      }).catch((err) => console.error("[mail]", err));
    }
    res.json({
      ok: true,
      message: "If that email has an account, a reset link is on its way.",
      // Lets the page say where the link went while no mail provider is set up.
      devMode: !mailConfigured(),
    });
  })
);

router.post(
  "/reset",
  authLimit,
  validateBody(resetPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const decoded = jwt.decode(req.body.token) as { sub?: string; purpose?: string } | null;
    const invalid = () => res.status(400).json({ error: "This reset link has expired or was already used. Ask for a new one." });
    if (!decoded?.sub || decoded.purpose !== RESET_PURPOSE) return invalid();
    const user = await User.findById(decoded.sub);
    if (!user) return invalid();
    try {
      jwt.verify(req.body.token, resetSecret(user));
    } catch {
      return invalid();
    }
    user.passwordHash = await bcrypt.hash(req.body.password, 10);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();
    forgetVersion(String(user._id));
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

export default router;
