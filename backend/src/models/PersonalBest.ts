import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPersonalBest extends Document {
  userId: Types.ObjectId;
  username: string;
  mode: string;
  modeDetail: string;
  wpm: number;
  accuracy?: number;
  consistency?: number;
  timestamp?: number;
  createdAt: Date;
  updatedAt: Date;
}

const personalBestSchema = new Schema<IPersonalBest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    mode: { type: String, required: true },
    modeDetail: { type: String, required: true },
    wpm: { type: Number, required: true },
    accuracy: Number,
    consistency: Number,
    timestamp: Number,
  },
  { timestamps: true }
);

// Leaderboard reads: find by category, sort by wpm, limit -- fully served by this index.
personalBestSchema.index({ mode: 1, modeDetail: 1, wpm: -1 });
// One best per user per category; also serves "all of this user's bests" lookups.
personalBestSchema.index({ userId: 1, mode: 1, modeDetail: 1 }, { unique: true });

export default mongoose.model<IPersonalBest>("PersonalBest", personalBestSchema);
