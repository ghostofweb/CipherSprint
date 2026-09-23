import mongoose, { Schema, Document, Types } from "mongoose";

// One row per finished race, written when the results are decided. Solo
// stats, personal bests and the leaderboard are deliberately not touched by
// races; this is the record a head-to-head history can be built from later.
export interface IRace extends Document {
  code: string;
  round: number;
  settings: Record<string, unknown>;
  players: {
    userId: Types.ObjectId;
    username: string;
    wpm: number;
    rawWpm: number;
    accuracy: number;
    consistency: number;
    elapsedMs: number;
    finished: boolean;
    forfeit: boolean;
  }[];
  winnerId: Types.ObjectId | null;
  reason: "time" | "finish" | "forfeit" | "tie";
  startedAt: Date | null;
  endedAt: Date;
}

const raceSchema = new Schema<IRace>(
  {
    code: { type: String, required: true },
    round: { type: Number, default: 1 },
    settings: { type: Schema.Types.Mixed, required: true },
    players: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        username: { type: String, required: true },
        wpm: Number,
        rawWpm: Number,
        accuracy: Number,
        consistency: Number,
        elapsedMs: Number,
        finished: Boolean,
        forfeit: Boolean,
        _id: false,
      },
    ],
    winnerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reason: { type: String, required: true },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

raceSchema.index({ "players.userId": 1, endedAt: -1 });

export default mongoose.model<IRace>("Race", raceSchema);
