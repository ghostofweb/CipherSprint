import Group from "../models/Group";

// Idempotent data migrations, run once at startup after the DB connects.
// Each is a cheap no-op once applied, so there is no separate migration
// runner to operate. A failure is logged, never fatal: the API should still
// boot, and the migration retries on the next start.
export async function runMigrations(): Promise<void> {
  try {
    // Groups created before `nameLower` existed: derive it so prefix search
    // and case-insensitive uniqueness cover them too.
    const res = await Group.updateMany({ nameLower: { $exists: false } }, [{ $set: { nameLower: { $toLower: "$name" } } }]);
    if (res.modifiedCount) console.log(`Migration: backfilled nameLower on ${res.modifiedCount} group(s)`);
  } catch (err) {
    console.error("Migration (Group.nameLower) failed:", (err as Error).message);
  }
}
