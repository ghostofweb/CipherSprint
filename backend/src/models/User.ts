import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  usernameLower: string;
  publicId: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  isPublic: boolean;
  showPresence: boolean;
  avatarUrl: string | null;
  avatarPublicId: string | null;

  completedTests: number;
  totalTimeTypingSeconds: number;
  bestWpm: number;
  bestAccuracy: number;
  bestConsistency: number;

  testActivity: Record<string, number>;
  charMistakes: Record<string, number>;
  recentScores: { wpm: number; accuracy: number; consistency: number }[];
  streak: { current: number; max: number };
  // Synced app settings (validated by the shared settingsSchema).
  settings: Record<string, unknown> | null;
  // Bumped on a password change or reset: every token signed before it stops working.
  tokenVersion: number;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    // Lowercased shadow of username, kept in sync at creation -- lets
    // search do an index-backed case-insensitive prefix match instead of
    // a full collection scan.
    usernameLower: { type: String, required: true, index: true },
    // Short user-facing handle distinct from Mongo's _id -- searchable
    // alongside username so people can be found/friended unambiguously.
    publicId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    isPublic: { type: Boolean, default: true },
    // Friends can see when this user is online. Opt-out.
    showPresence: { type: Boolean, default: true },
    avatarUrl: { type: String, default: null },
    avatarPublicId: { type: String, default: null },

    completedTests: { type: Number, default: 0 },
    totalTimeTypingSeconds: { type: Number, default: 0 },
    bestWpm: { type: Number, default: 0 },
    bestAccuracy: { type: Number, default: 0 },
    bestConsistency: { type: Number, default: 0 },

    testActivity: { type: Schema.Types.Mixed, default: {} },
    charMistakes: { type: Schema.Types.Mixed, default: {} },
    recentScores: {
      type: [{ wpm: Number, accuracy: Number, consistency: Number, _id: false }],
      default: [],
    },

    streak: {
      current: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },

    settings: { type: Schema.Types.Mixed, default: null },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
