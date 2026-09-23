import "dotenv/config";
import http from "http";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth";
import resultsRoutes from "./routes/results";
import usersRoutes from "./routes/users";
import leaderboardRoutes from "./routes/leaderboard";
import friendsRoutes from "./routes/friends";
import groupsRoutes from "./routes/groups";
import dmRoutes from "./routes/dm";
import mediaRoutes from "./routes/media";
import safetyRoutes from "./routes/safety";
import { attachSocket } from "./socket";
import { runMigrations } from "./utils/migrations";

// One origin or a comma-separated list (e.g. the Vercel site and local dev):
// CLIENT_ORIGIN=https://ciphersprint.vercel.app,http://localhost:3001
const clientOrigin = (process.env.CLIENT_ORIGIN || "http://localhost:3001")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const app = express();
// Behind a hosting proxy (Render, Fly, ...), rate limits need the real client IP.
if (process.env.TRUST_PROXY) app.set("trust proxy", 1);
app.use(cors({ origin: clientOrigin }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/dm", dmRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api", safetyRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
attachSocket(httpServer, clientOrigin);

mongoose
  .connect(process.env.MONGODB_URI as string, {
    maxPoolSize: Number(process.env.MONGO_POOL_SIZE) || 50,
  })
  .then(() => runMigrations())
  .then(() => {
    httpServer.listen(PORT, () => console.log(`API + sockets listening on :${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
