import { z } from "zod";

// ---- Primitives, shared by both signup and username-search/availability ----

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only");

// Individual rules exported (not just the combined schema) so the frontend
// can render a live per-rule checklist instead of one pass/fail message.
export const PASSWORD_RULES = [
  { key: "length", label: "8+ characters", test: (v: string) => v.length >= 8 },
  { key: "letter", label: "contains a letter", test: (v: string) => /[A-Za-z]/.test(v) },
  { key: "number", label: "contains a number", test: (v: string) => /[0-9]/.test(v) },
] as const;

export const passwordSchema = z
  .string()
  .refine((v) => PASSWORD_RULES.every((rule) => rule.test(v)), {
    message: "Password does not meet the requirements",
  });

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email");

// ---- Auth ----

export const signupSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const googleCompleteSchema = z.object({
  pendingToken: z.string().min(1),
  username: usernameSchema,
});

// ---- Users ----

export const visibilitySchema = z.object({
  isPublic: z.boolean(),
});

export const presenceSchema = z.object({
  showPresence: z.boolean(),
});

export const avatarUpdateSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
});

// ---- Groups ----

export const groupNameSchema = z
  .string()
  .trim()
  .min(3, "Group name must be at least 3 characters")
  .max(40, "Group name must be at most 40 characters");

export const createGroupSchema = z.object({
  name: groupNameSchema,
  description: z.string().trim().max(280, "Keep it under 280 characters").optional().default(""),
});

// ---- Friends ----

export const friendRequestSchema = z.object({
  username: usernameSchema,
});

// ---- Chat ----

export const sendMessageSchema = z.object({
  contextType: z.enum(["group", "dm"]),
  contextId: z.string().min(1),
  text: z.string().trim().min(1, "Message can't be empty").max(2000, "Message is too long"),
  // Client-generated id echoed back on the resulting message:new so the
  // sender can swap its optimistic copy for the saved message exactly.
  clientId: z.string().min(1).max(64).optional(),
});

// ---- Media ----

export const mediaSignatureSchema = z.object({
  folder: z.string().regex(/^(users|groups)\/[a-f0-9]{24}$/, "Invalid folder"),
});

// ---- Typing results ----

export const resultSchema = z.object({
  mode: z.string().min(1),
  modeDetail: z.union([z.string(), z.number(), z.null()]).optional(),
  wpm: z.number().min(0),
  rawWpm: z.number().min(0).optional(),
  accuracy: z.number().min(0).max(100),
  consistency: z.number().min(0).max(100).optional(),
  correctChars: z.number().min(0).optional(),
  incorrectChars: z.number().min(0).optional(),
  missedChars: z.number().min(0).optional(),
  extraChars: z.number().min(0).optional(),
  correctWords: z.number().min(0).optional(),
  charMistakes: z.record(z.string(), z.number()).optional(),
  durationSeconds: z.number().min(0).optional(),
  timestamp: z.number().optional(),
});
