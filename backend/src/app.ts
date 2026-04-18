import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import cameraRoutes from "./routes/camera.routes";
import crimeRoutes from "./routes/crime.routes";
import alertRoutes from "./routes/alert.routes";
import { errorHandler } from "./middleware/error.middleware";

dotenv.config();

const app = express();


const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Health check — required by Railway/Render
app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    service: "crimeai-backend",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────
app.use("/api/v1", authRoutes);
app.use("/api/v1/cameras", cameraRoutes);
app.use("/api/v1/crimes", crimeRoutes);
app.use("/api/v1/alerts", alertRoutes);

// ── 404 handler ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 404, message: `Route ${req.method} ${req.path} not found` },
  });
});

// ── Global error handler ──────────────────────────────
app.use(errorHandler);

export default app;