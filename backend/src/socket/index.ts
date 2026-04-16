import { Server } from "socket.io";
import axios from "axios";
import Alert from "../models/alert.model";
import Camera from "../models/camera.model";
import { v4 as uuidv4 } from "uuid";

const lastAlertTime: Record<string, number> = {};

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("frame", async ({ image, cameraId }) => {
      try {
        const res = await axios.post("http://localhost:5001/detect", {
          image,
        });

        const result = res.data;

        // 🔒 Ignore low confidence
        if (!result.violence || result.confidence < 0.6) {
          return;
        }

        // 🔒 Prevent spam (1 alert per 10 sec per camera)
        const now = Date.now();
        if (
          lastAlertTime[cameraId] &&
          now - lastAlertTime[cameraId] < 10000
        ) {
          return;
        }
        lastAlertTime[cameraId] = now;

        // 📍 Get camera info
        const camera = await Camera.findOne({ cameraId });

        const severity =
          result.confidence > 0.8
            ? "high"
            : result.confidence > 0.5
            ? "medium"
            : "low";

        const alert = await Alert.create({
          alertId: uuidv4(),
          crimeId: uuidv4(),
          cameraId,
          location: camera?.location || "Unknown",
          crimeType: "violence",
          severity,
          message: `Violence detected at ${camera?.location}`,
          sentVia: ["websocket"],
        });

        // 🔥 BROADCAST TO ALL CLIENTS
        io.emit("new-alert", alert);

        // 🎯 Send detection back to sender
        socket.emit("detection", result);

      } catch (err) {
        console.error("Socket error:", err);
      }
    });
  });
};