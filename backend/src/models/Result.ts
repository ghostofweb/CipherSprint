import mongoose, { Schema, Document, Types } from "mongoose";

export interface IResult extends Document {
  userId: Types.ObjectId;
  mode: string;
  modeDetail: string | number | null;
  wpm: number;
  rawWpm?: number;
  accuracy: number;
  consistency?: number;
  correctChars?: number;
  incorrectChars?: number;
  missedChars?: number;
  extraChars?: number;
  correctWords?: number;
  charMistakes: Record<string, number>;
  durationSeconds?: number;
  timestamp: number;
  language: string;
  replay?: [number, string][];
  hasReplay?: boolean;
  words?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const resultSchema = new Schema<IResult>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, required: true },
    modeDetail: { type: Schema.Types.Mixed, default: null },
    wpm: { type: Number, required: true },
    rawWpm: Number,
    accuracy: { type: Number, required: true },
    consistency: Number,
    correctChars: Number,
    incorrectChars: Number,
    missedChars: Number,
    extraChars: Number,
    correctWords: Number,
    charMistakes: { type: Schema.Types.Mixed, default: {} },
    durationSeconds: Number,
    timestamp: { type: Number, required: true },
    language: { type: String, default: "english" },
    // Heavy fields: excluded from list queries, loaded for one replay.
    replay: { type: [Schema.Types.Mixed], default: undefined, select: false },
    hasReplay: { type: Boolean, default: false },
    words: { type: [String], default: undefined, select: false },
  },
  { timestamps: true }
);

resultSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model<IResult>("Result", resultSchema);
