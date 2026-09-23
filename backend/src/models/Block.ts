import mongoose, { Schema, Document, Types } from "mongoose";

// blocker has blocked blocked. Either direction hides the two people from
// each other everywhere (search, requests, DMs, race invites).
export interface IBlock extends Document {
  blocker: Types.ObjectId;
  blocked: Types.ObjectId;
  createdAt: Date;
}

const blockSchema = new Schema<IBlock>(
  {
    blocker: { type: Schema.Types.ObjectId, ref: "User", required: true },
    blocked: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
blockSchema.index({ blocked: 1 });

export default mongoose.model<IBlock>("Block", blockSchema);
