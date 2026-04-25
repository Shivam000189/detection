import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import cameraRoutes from "./routes/camera.routes";
import crimeRoutes from "./routes/crime.routes";
import alertRoutes from "./routes/alert.routes";
import { errorHandler } from "./middleware/error.middleware";
import predictRoutes from './routes/predict.routes';
import insightRoutes from "./routes/insight.routes";
import path from "path";

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
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/cameras", cameraRoutes);
app.use("/api/v1/crimes", crimeRoutes);
app.use("/api/v1/alerts", alertRoutes);
app.use("/api/v1", predictRoutes);
app.use("/api/v1/insights", insightRoutes);

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);


app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof Error && err.message.includes("Only video files")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large",
    });
  }

  next(err);
});

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