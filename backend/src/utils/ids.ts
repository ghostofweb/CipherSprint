import User from "../models/User";

const PUBLIC_ID_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomPublicId(length = 8): string {
  let id = "";
  for (let i = 0; i < length; i++) {
    id += PUBLIC_ID_CHARS[Math.floor(Math.random() * PUBLIC_ID_CHARS.length)];
  }
  return id;
}

// Short, user-facing, unique handle (e.g. "A1B2C3D4") distinct from Mongo's
// _id -- retries on the (very unlikely) collision.
export async function generateUniquePublicId(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = randomPublicId();
    if (!(await User.exists({ publicId: candidate }))) return candidate;
  }
  throw new Error("Could not generate a unique public id");
}
