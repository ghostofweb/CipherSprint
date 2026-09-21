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
  },
  { timestamps: true }
);

resultSchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model<IResult>("Result", resultSchema);
