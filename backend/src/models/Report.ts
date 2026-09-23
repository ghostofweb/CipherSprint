import mongoose, { Schema, Document, Types } from "mongoose";

export const REPORT_REASONS = ["spam", "harassment", "cheating", "inappropriate-name", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

// A user's report of another user, kept with a copy of what was reported
// (a message can be deleted later; the report should still make sense).
export interface IReport extends Document {
  reporter: Types.ObjectId;
  reporterUsername: string;
  target: Types.ObjectId;
  targetUsername: string;
  reason: ReportReason;
  note: string;
  context: { kind: "profile" | "message" | "race"; ref: string | null; excerpt: string | null };
  status: "open" | "resolved";
  createdAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reporterUsername: { type: String, required: true },
    target: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetUsername: { type: String, required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    note: { type: String, default: "" },
    context: {
      kind: { type: String, enum: ["profile", "message", "race"], required: true },
      ref: { type: String, default: null },
      excerpt: { type: String, default: null },
    },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IReport>("Report", reportSchema);
