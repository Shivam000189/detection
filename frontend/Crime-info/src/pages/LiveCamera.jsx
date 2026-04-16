import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function LiveCamera() {
  const videoRef = useRef(null);
  const [alerts, setAlerts] = useState([]);

  // 🎥 Listen alerts
  useEffect(() => {
    socket.on("new-alert", (alert) => {
      console.log("🚨 ALERT:", alert);

      // add alert to UI
      setAlerts((prev) => [alert, ...prev]);
    });

    return () => socket.off("new-alert");
  }, []);

  // 📸 Send frames
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
      cameraId: "cam_1",
    });
  };

  useEffect(() => {
    const interval = setInterval(sendFrame, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ color: "white" }}>CCTV Simulation</h1>

      <video
        ref={videoRef}
        src="/test-video.mp4"
        autoPlay
        loop
        muted
        width="500"
      />

      {/* 🚨 ALERT PANEL */}
      <div style={{ marginTop: "20px" }}>
        <h2 style={{ color: "red" }}>Alerts</h2>

        {alerts.map((a, index) => (
          <div
            key={index}
            style={{
              background: "#111",
              color: "white",
              padding: "10px",
              margin: "5px 0",
              borderLeft: "5px solid red",
            }}
          >
            <p><b>Type:</b> {a.crimeType}</p>
            <p><b>Location:</b> {a.location}</p>
            <p><b>Severity:</b> {a.severity}</p>
          </div>
        ))}
      </div>
    </div>
  );
}