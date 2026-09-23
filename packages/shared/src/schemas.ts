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
  language: z.enum(["english", "spanish", "french", "german", "portuguese", "italian", "indonesian", "hinglish"]).optional(),
  // Keystroke timeline for replays: [ms since previous key, key].
  replay: z.array(z.tuple([z.number().int().min(0).max(600000), z.string().max(4)])).max(6000).optional(),
  // The words the test was typed against (as far as it got).
  words: z.array(z.string().max(60)).max(1500).optional(),
});

// Personal bests and leaderboards are per language: a non-English result
// files under "<detail>@<language>" so the existing (mode, modeDetail) index
// and queries work unchanged.
export const categoryDetail = (detail: string | number | null | undefined, language?: string | null): string => {
  const d = String(detail ?? "-");
  return !language || language === "english" ? d : `${d}@${language}`;
};

// ---- Races (1v1) ----

// The option lists are exported so the UI renders exactly what the server
// accepts.
export const RACE_FORMATS = ["time", "words", "quote"] as const;
export const RACE_SECONDS = [15, 30, 60, 120] as const;
export const RACE_WORD_COUNTS = [15, 30, 50, 100] as const;
export const RACE_QUOTE_LENGTHS = ["short", "medium", "long"] as const;
export const RACE_WORD_LENGTHS = ["any", "short", "long"] as const;

// Every field is always present so switching format in the form keeps the
// other picks; only the fields for the chosen format are used.
export const raceSettingsSchema = z.object({
  format: z.enum(RACE_FORMATS),
  seconds: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(120)]),
  words: z.union([z.literal(15), z.literal(30), z.literal(50), z.literal(100)]),
  quoteLength: z.enum(RACE_QUOTE_LENGTHS),
  punctuation: z.boolean(),
  numbers: z.boolean(),
  wordLength: z.enum(RACE_WORD_LENGTHS),
  // Quotes are English; the language applies to time and words races.
  language: z.enum(["english", "spanish", "french", "german", "portuguese", "italian", "indonesian", "hinglish"]).default("english"),
});

export const DEFAULT_RACE_SETTINGS: z.infer<typeof raceSettingsSchema> = {
  format: "time",
  seconds: 30,
  words: 30,
  quoteLength: "medium",
  punctuation: false,
  numbers: false,
  wordLength: "any",
  language: "english",
};

// Quick match: the three formats people can be paired on without a lobby.
export const QUICK_MATCH_PRESETS = ["time30", "words30", "quote"] as const;
export const quickMatchSchema = z.object({ preset: z.enum(QUICK_MATCH_PRESETS) });

// Room codes skip 0/O/1/I so they survive being read aloud or typed from a
// screenshot; input is upper-cased so "k7qh3n" works.
export const RACE_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const raceCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/, "Room codes are 6 letters or numbers");

export const raceRoomSchema = z.object({ code: raceCodeSchema });

export const raceCreateSchema = z.object({
  settings: raceSettingsSchema,
  // Optional friend to invite straight away (the "Challenge" entry points).
  invite: usernameSchema.optional(),
});

export const raceSettingsUpdateSchema = z.object({
  code: raceCodeSchema,
  settings: raceSettingsSchema,
});

export const raceInviteSchema = z.object({
  code: raceCodeSchema,
  username: usernameSchema,
});

// The caret position inside the shared word list: identical text on both
// sides means (word, char) maps to the same spot for the opponent.
export const raceProgressSchema = z.object({
  code: raceCodeSchema,
  word: z.number().int().min(0).max(5000),
  char: z.number().int().min(0).max(500),
  wpm: z.number().min(0).max(500),
});

export const raceFinishSchema = z.object({
  code: raceCodeSchema,
  stats: z.object({
    wpm: z.number().min(0).max(500),
    rawWpm: z.number().min(0).max(700),
    accuracy: z.number().min(0).max(100),
    consistency: z.number().min(0).max(100),
    correctChars: z.number().int().min(0).max(20000),
    incorrectChars: z.number().int().min(0).max(20000),
    missedChars: z.number().int().min(0).max(20000),
    extraChars: z.number().int().min(0).max(20000),
    elapsedMs: z.number().min(0).max(10 * 60 * 1000),
    graphData: z.array(z.tuple([z.number(), z.number()])).max(400),
    replay: z.array(z.tuple([z.number().int().min(0).max(600000), z.string().max(4)])).max(6000).optional(),
  }),
});

// ---- Languages ----

// English uses the large random-words list; the others are curated lists of
// common words in packages/shared/src/languages.
export const LANGUAGES = ["english", "spanish", "french", "german", "portuguese", "italian", "indonesian", "hinglish"] as const;
export const languageSchema = z.enum(LANGUAGES);

// ---- Settings (synced to the account when signed in) ----

export const CARET_STYLES = ["line", "block", "underline"] as const;
export const LIVE_STATS = ["off", "wpm", "both"] as const;
export const FONT_SIZES = ["s", "m", "l"] as const;
export const TEST_FONTS = ["plex", "jetbrains", "roboto", "fira"] as const;
export const SOUNDS = ["off", "click", "typewriter", "soft"] as const;

export const settingsSchema = z.object({
  caretStyle: z.enum(CARET_STYLES),
  smoothCaret: z.boolean(),
  liveStats: z.enum(LIVE_STATS),
  fontSize: z.enum(FONT_SIZES),
  testFont: z.enum(TEST_FONTS),
  // Tab restarts at once, instead of moving focus to the restart button.
  tabRestart: z.boolean(),
  // No backspace: every key counts, like a real sprint.
  confidence: z.boolean(),
  // The decode animation when a new test appears.
  decrypt: z.boolean(),
  sound: z.enum(SOUNDS),
  volume: z.number().min(0).max(1),
  errorSound: z.boolean(),
  language: languageSchema,
  // Theme label; applied on another device after sign-in.
  theme: z.string().max(40).optional(),
  // Last change, epoch ms: the newer copy wins when devices disagree.
  updatedAt: z.number().int().min(0),
});

export const DEFAULT_SETTINGS: z.infer<typeof settingsSchema> = {
  caretStyle: "line",
  smoothCaret: true,
  liveStats: "wpm",
  fontSize: "m",
  testFont: "plex",
  tabRestart: false,
  confidence: false,
  decrypt: true,
  sound: "off",
  volume: 0.5,
  errorSound: false,
  language: "english",
  updatedAt: 0,
};

// ---- Account ----

export const changePasswordSchema = z.object({
  current: z.string().min(1, "Enter your current password"),
  next: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(1000),
  password: passwordSchema,
});

// Typing the username is the confirmation; accounts with a password also
// re-enter it.
export const deleteAccountSchema = z.object({
  confirm: z.string().min(1),
  password: z.string().optional(),
});

// ---- Safety ----

export const blockUserSchema = z.object({ username: usernameSchema });

export const REPORT_REASONS = ["spam", "harassment", "cheating", "inappropriate-name", "other"] as const;

export const reportUserSchema = z.object({
  username: usernameSchema,
  reason: z.enum(REPORT_REASONS),
  note: z.string().trim().max(500, "Keep it under 500 characters").optional().default(""),
  context: z.object({
    kind: z.enum(["profile", "message", "race"]),
    ref: z.string().max(64).nullable().optional(),
    excerpt: z.string().max(500).nullable().optional(),
  }),
});
