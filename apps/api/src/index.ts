import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./strategies/passport.js";
import { v1Router } from "./routes/v1/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authConfig } from "./config/auth.config.js";

const app = express();
const PORT = authConfig.port;

app.set("trust proxy", 1);

app.use(
  cors({
    origin: authConfig.clientUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.get("/", (_req, res) => {
  res.json({ message: "Hello from Node.js TS inside Turborepo!" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1", v1Router);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running Abhik on http://localhost:${PORT}`);
});
