import { useEffect, useState, useRef } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getCameras } from "../api/cameras";
import {
  getAlerts,
  resolveAlert,
  dismissAlert,
} from "../api/alerts";
import StatCard from "../components/ui/StatCard";
import { Camera } from "lucide-react";
import { io } from "socket.io-client";


const socket = io("http://localhost:5000");

export default function Cameras() {
  const [cameras, setCameras] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  const videoRef = useRef(null);

  // 📸 Fetch cameras
  useEffect(() => {
    getCameras()
      .then((res) => {
        const data = res?.data;

        if (Array.isArray(data)) setCameras(data);
        else if (Array.isArray(data?.data)) setCameras(data.data);
        else if (Array.isArray(data?.cameras)) setCameras(data.cameras);
        else setCameras([]);
      })
      .catch(() => setCameras([]));
  }, []);

  // 🚨 Fetch alerts
  useEffect(() => {
    getAlerts()
      .then((res) => {
        const data = res?.data?.data || [];
        setAlerts(data);
      })
      .catch(() => setAlerts([]));
  }, []);

  // 🚨 Live alerts
  useEffect(() => {
    socket.on("new-alert", (alert) => {
      console.log("🚨 LIVE ALERT:", alert);

      setAlerts((prev) => {
        if (prev.find((a) => a.alertId === alert.alertId)) return prev;
        return [alert, ...prev];
      });
    });

    return () => socket.off("new-alert");
  }, []);

  // 🎥 Send frames
  const sendFrame = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const image = canvas.toDataURL("image/jpeg");

    socket.emit("frame", {
      image,
      cameraId: selectedCamera?.cameraId || "cam_1",
    });
  };

  useEffect(() => {
    const interval = setInterval(sendFrame, 1000);
    return () => clearInterval(interval);
  }, [selectedCamera]);

  // ✅ Resolve alert
  const handleResolve = async (id) => {
    try {
      await resolveAlert(id, { actionTaken: "Handled" });

      setAlerts((prev) =>
        prev.map((a) =>
          a.alertId === id ? { ...a, status: "resolved" } : a
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ❌ Dismiss alert
  const handleDismiss = async (id) => {
    try {
      await dismissAlert(id, { reason: "False alarm" });

      setAlerts((prev) =>
        prev.map((a) =>
          a.alertId === id ? { ...a, status: "dismissed" } : a
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout title="Cameras">
      
      {/* 📊 Stats */}
      <StatCard
        icon={Camera}
        label="Total Cameras"
        value={cameras.length}
      />

      {/* 📸 Cameras Grid */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        {cameras.map((cam) => (
          <div
            key={cam._id}
            onClick={() =>
                  setSelectedCamera((prev) =>
                    prev?.cameraId === cam.cameraId ? null : cam
                  )
                }
            className={`p-4 cursor-pointer rounded-xl border ${
              selectedCamera?.cameraId === cam.cameraId
                ? "border-purple-500 bg-[#1a1a24]"
                : "bg-[#111118] border-white/5"
            }`}
          >
            <p className="text-white font-semibold">
              {cam.cameraId}
              
            </p>
            <p className="text-gray-400 text-sm">
              {cam.location}
            </p>

            <p
              className={`text-xs mt-1 ${
                cam.status === "active"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              ● {cam.status}
            </p>
          </div>
        ))}
      </div>

      {/* 🎥 LIVE CAMERA */}
      <div className="mt-10">
        <h2 className="text-white text-xl font-semibold mb-4">
          🎥 Live Camera Feed
        </h2>

        {!selectedCamera ? (
          <p className="text-gray-400">
            Select a camera to view feed
          </p>
        ) : (
          <div>
            <p className="text-gray-400 mb-2">
              {selectedCamera.cameraId} —{" "}
              {selectedCamera.location}
            </p>

            <video
              ref={videoRef}
              src="/test-video.mp4"
              autoPlay
              loop
              muted
              className="w-full max-w-xl rounded-xl border border-white/10"
            />
          </div>
        )}
      </div>

      {/* 🚨 ALERTS */}
      <div className="mt-10">
        <h2 className="text-white text-xl font-semibold mb-4">
          🚨 Recent Alerts
        </h2>

        {alerts.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No alerts found
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.alertId}
                className={`p-4 rounded-xl border ${
                  alert.severity === "high"
                    ? "bg-red-900/30 border-red-500"
                    : alert.severity === "medium"
                    ? "bg-yellow-900/30 border-yellow-500"
                    : "bg-green-900/30 border-green-500"
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="text-red-400 font-semibold flex items-center gap-2">
                    🚨 {alert.crimeType}
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded">
                      {alert.cameraId}
                    </span>
                  </p>

                  <span className="text-xs px-2 py-1 bg-red-600 rounded">
                    ALERT
                  </span>
                </div>

                <p className="text-gray-400 text-sm mt-1">
                  {alert.location}
                </p>

                <p className="text-gray-500 text-xs">
                  Severity: {alert.severity}
                </p>

                <p className="text-xs mt-1">
                  Status:{" "}
                  <span className="uppercase font-semibold">
                    {alert.status}
                  </span>
                </p>

                <div className="flex gap-2 mt-3">
                  <button
                    className="px-3 py-1 text-xs bg-green-600 rounded"
                    onClick={() => handleResolve(alert.alertId)}
                  >
                    Resolve
                  </button>

                  <button
                    className="px-3 py-1 text-xs bg-yellow-600 rounded"
                    onClick={() => handleDismiss(alert.alertId)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}