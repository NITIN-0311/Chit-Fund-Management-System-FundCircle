import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import memberRoutes from "./routes/members.js";
import groupRoutes from "./routes/groups.js";
import contributionRoutes from "./routes/contributions.js";
import auctionRoutes from "./routes/auctions.js";
import dashboardRoutes from "./routes/dashboard.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  return res.json({ status: "ok", service: "chit-fund-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === "23503") {
    return res.status(400).json({ message: "Referenced record does not exist." });
  }

  if (err.code === "23505") {
    return res.status(409).json({ message: "A record with this value already exists." });
  }

  if (err.code === "22P02") {
    return res.status(400).json({ message: "Invalid data type in request." });
  }

  return res.status(500).json({ message: "Internal server error." });
});

app.listen(port, () => {
  console.log(`Backend API listening on port ${port}`);
});
