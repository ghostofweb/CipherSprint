// One-off migration: backfills the PersonalBest collection from the old
// User.personalBests Mixed map (present in DBs created before that field
// was replaced by a dedicated, indexed collection). Safe to re-run --
// each row is upserted by (userId, mode, modeDetail).
//
// Usage: tsx src/scripts/migratePersonalBests.ts

import "dotenv/config";
import mongoose from "mongoose";
import PersonalBest from "../models/PersonalBest";

interface LegacyPersonalBest {
  mode: string;
  modeDetail?: string | number | null;
  wpm: number;
  accuracy?: number;
  consistency?: number;
  timestamp?: number;
}

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const users = await mongoose.connection.db!
    .collection("users")
    .find({ personalBests: { $exists: true, $ne: {} } })
    .toArray();

  let migrated = 0;
  for (const user of users) {
    const entries = Object.values(user.personalBests || {}) as LegacyPersonalBest[];
    for (const pb of entries) {
      if (!pb || typeof pb.wpm !== "number") continue;
      await PersonalBest.updateOne(
        { userId: user._id, mode: pb.mode, modeDetail: String(pb.modeDetail ?? "-") },
        {
          $setOnInsert: {
            userId: user._id,
            username: user.username,
            mode: pb.mode,
            modeDetail: String(pb.modeDetail ?? "-"),
            wpm: pb.wpm,
            accuracy: pb.accuracy,
            consistency: pb.consistency,
            timestamp: pb.timestamp,
          },
        },
        { upsert: true }
      );
      migrated += 1;
    }
  }

  console.log(`Migrated ${migrated} personal-best rows from ${users.length} users.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
