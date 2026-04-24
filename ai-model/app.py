import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import predict_crime
from features.hotspot import predict_hotspots
from features.trends import analyze_trends
from features.area_risk import get_area_risk
from services.gemini_service import (
    generate_crime_summary,
    generate_alert_message
)

app = Flask(__name__)


allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5000")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",")]

CORS(app, origins=allowed_origins)


# ── Health check ──────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "crimeai-ml"})


# ── Predict crime ─────────────────────────────────────
@app.route("/predict-crime", methods=["POST"])
def predict():
    data = request.json or {}
    location = data.get("location")
    time = data.get("time")

    if not location or not time:
        return jsonify({"error": "Missing location/time"}), 400

    result = predict_crime(data)

    result["aiSummary"] = generate_crime_summary({
        "predicted_crime": result.get("predicted_crime"),
        "risk_level":      result.get("risk_level"),
        "probability":     result.get("probability"),
        "location":        location,
        "time":            time,
        "weapon_used":     data.get("weapon_used", "Unknown"),
    })

    return jsonify(result)


# ── Hotspots ─────────────────────────────────────────
@app.route("/predict-hotspot", methods=["POST"])
def hotspot():
    data = request.json or {}
    city = data.get("city")
    top_n = data.get("topN", 5)

    result = predict_hotspots(city=city, top_n=top_n)

    if not result.get("success"):
        return jsonify(result), 500

    return jsonify(result)


# ── Video detect (mock — YOLOv8 deferred) ────────────
@app.route("/detect", methods=["POST"])
def detect():
    data = request.json or {}
    # image = data.get("image")
    video_path = data.get("videoPath")
    camera_id = data.get("cameraId", "cam_unknown")
    location = data.get("location", "Unknown Location")

    # if not image:
    #     return jsonify({"error": "image required"}), 400

    if not video_path:
        return jsonify({"error": "videoPath required"}), 400

    hotspot_result = predict_hotspots(city=location, top_n=3)
    hotspots = hotspot_result.get("hotspots", []) if hotspot_result.get("success") else []
    primary_hotspot = hotspots[0] if hotspots else {}

    confidence = 0.82 if primary_hotspot else 0.68
    severity = "high" if confidence >= 0.85 else ("medium" if confidence >= 0.6 else "low")
    crime_type = primary_hotspot.get("mostCommonCrime", "suspicious_activity")

    # TODO: Replace with real YOLOv8 inference
    return jsonify({
        # "violence": True,
        # "confidence": 0.9,
        # "location": "Test Area"

        "detectedEvents": [
            {
                "crimeType": crime_type,
                "severity": severity,
                "confidenceScore": confidence,
                "timestampInVideo": "00:00:12",
                "aiSummary": (
                    f"AI analyzed video from {camera_id}. "
                    f"Likely {crime_type.replace('_', ' ')} around {location}."
                ),
                "recommendation": (
                    primary_hotspot.get("recommendation")
                    if primary_hotspot
                    else f"Increase patrol visibility around {location}."
                ),
            }
        ]
    })


# ── Trends ───────────────────────────────────────────
@app.route("/analyze-trends", methods=["POST"])
def trends():
    data = request.json or {}

    result = analyze_trends(
        group_by=data.get("groupBy", "month"),
        city=data.get("city"),
        crime_type=data.get("crimeType"),
        start_date=data.get("startDate"),
        end_date=data.get("endDate"),
    )

    if not result.get("success"):
        return jsonify(result), 500

    return jsonify(result)


# ── Area Risk ─────────────────────────────────────────
@app.route("/area-risk", methods=["POST"])
def area_risk():
    data = request.json or {}
    city = data.get("city")

    if not city:
        return jsonify({"error": "city is required"}), 400

    result = get_area_risk(city=city)

    if not result.get("success"):
        return jsonify(result), 404

    # Safe weapon handling
    weapon = "Unknown"
    if result.get("weaponStats") and len(result["weaponStats"]) > 0:
        weapon = result["weaponStats"][0].get("weapon", "Unknown")

    summary = result.get("summary", {})

    result["aiSummary"] = generate_crime_summary({
        "predicted_crime": summary.get("mostCommonCrime", "Unknown"),
        "risk_level":      result.get("riskLevel", "MEDIUM"),
        "probability":     result.get("riskScore", 0) / 10,
        "location":        city,
        "time":            summary.get("mostDangerousTime", "Unknown"),
        "weapon_used":     weapon,
    })

    return jsonify(result)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 10000))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=port)