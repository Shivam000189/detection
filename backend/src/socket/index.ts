import { Server } from "socket.io";
import axios from "axios";
import Alert from "../models/alert.model";
import Camera from "../models/camera.model";
import { v4 as uuidv4 } from "uuid";

// ✅ Use env variable — no more hardcoded localhost
const AI_URL = process.env.AI_MODEL_URL || "http://localhost:5001";

const lastAlertTime: Record<string, number> = {};

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("frame", async ({ image, cameraId }) => {
      try {
        const res = await axios.post(`${AI_URL}/detect`, {
          image,
        });

        const result = res.data;

        // Ignore low confidence
        if (!result.violence || result.confidence < 0.6) {
          return;
        }

        // Prevent spam — 1 alert per 10 seconds per camera
        const now = Date.now();
        if (
          lastAlertTime[cameraId] &&
          now - lastAlertTime[cameraId] < 10000
        ) {
          return;
        }
        lastAlertTime[cameraId] = now;

        // Get camera location
        const camera = await Camera.findOne({ cameraId });

        const severity =
          result.confidence > 0.8
            ? "high"
            : result.confidence > 0.5
            ? "medium"
            : "low";

        const alert = await Alert.create({
          alertId: `alt_${uuidv4().split("-")[0]}`,
          crimeId: `crm_${uuidv4().split("-")[0]}`,
          cameraId,
          location: camera?.location || "Unknown",
          crimeType: "violence",
          severity,
          message: `Violence detected at ${camera?.location || "Unknown"}`,
          sentVia: ["websocket"],
        });

        // Broadcast to all connected clients
        io.emit("new-alert", alert);

        // Send detection result back to sender
        socket.emit("detection", result);

      } catch (err: any) {
        console.error("Socket frame processing error:", err?.message || err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};