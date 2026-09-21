// One-off migration: backfills usernameLower/publicId on any User docs
// created before those fields existed. Idempotent -- safe to re-run.
//
// Usage: tsx src/scripts/backfillUserFields.ts

import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User";
import { generateUniquePublicId } from "../utils/ids";

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const users = await User.find({ $or: [{ publicId: { $exists: false } }, { usernameLower: { $exists: false } }] });
  for (const user of users) {
    if (!user.usernameLower) user.usernameLower = user.username.toLowerCase();
    if (!user.publicId) user.publicId = await generateUniquePublicId();
    await user.save();
  }

  console.log(`Backfilled ${users.length} user(s).`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
