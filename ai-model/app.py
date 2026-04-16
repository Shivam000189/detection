from flask import Flask, request, jsonify
from predict import predict_crime
from features.hotspot import predict_hotspots
from features.trends  import analyze_trends
from features.area_risk import get_area_risk
from services.gemini_service import (
    generate_crime_summary,
    generate_alert_message
)

app = Flask(__name__)


# ── Predict crime ─────────────────────────────────
@app.route("/predict-crime", methods=["POST"])
def predict():
    data     = request.json
    location = data.get("location")
    time     = data.get("time")

    if not location or not time:
        return jsonify({"error": "Missing location/time"}), 400

    result = predict_crime(data)

    result["aiSummary"] = generate_crime_summary({
        "predicted_crime": result.get("predicted_crime"),
        "risk_level":      result.get("risk_level"),
        "probability":     result.get("probability"),
        "location":        location,
        "time":            time,
        "weapon_used":     "Unknown",
    })

    return jsonify(result)


# ── Hotspots ─────────────────────────────────
@app.route("/predict-hotspot", methods=["POST"])
def hotspot():
    data  = request.json
    city  = data.get("city")
    top_n = data.get("topN", 5)

    result = predict_hotspots(city=city, top_n=top_n)

    if not result.get("success"):
        return jsonify(result), 500

    return jsonify(result)


# ── Detect (mock) ─────────────────────────────
@app.route("/detect", methods=["POST"])
def detect():
    data = request.json
    image = data.get("image")

    if not image:
        return jsonify({"error": "image required"}), 400

    return jsonify({
        "violence": True,
        "confidence": 0.9,
        "location": "Test Area"
    })


# ── Trends ───────────────────────────────────
@app.route("/analyze-trends", methods=["POST"])
def trends():
    data = request.json or {}

    result = analyze_trends(
        group_by   = data.get("groupBy", "month"),
        city       = data.get("city"),
        crime_type = data.get("crimeType"),
        start_date = data.get("startDate"),
        end_date   = data.get("endDate"),
    )

    if not result.get("success"):
        return jsonify(result), 500

    return jsonify(result)


# ── AREA RISK (FIXED) ─────────────────────────
@app.route("/area-risk", methods=["POST"])
def area_risk():
    data = request.json or {}
    city = data.get("city")

    if not city:
        return jsonify({"error": "city is required"}), 400

    result = get_area_risk(city=city)

    if not result.get("success"):
        return jsonify(result), 404

    # ✅ SAFE WEAPON HANDLING
    weapon = "Unknown"

    if result.get("weaponStats") and len(result["weaponStats"]) > 0:
        weapon = result["weaponStats"][0].get("weapon", "Unknown")

    # ✅ SAFE SUMMARY DATA
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


# ── Health ───────────────────────────────────
@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5001)