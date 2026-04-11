from flask import Flask, request, jsonify
from predict import predict_crime
from features.hotspot import predict_hotspots          # ← ADD
from features.trends  import analyze_trends
from features.area_risk import get_area_risk
from services.gemini_service import (
    generate_crime_summary,
    generate_alert_message
)

app = Flask(__name__)


# ── EXISTING: Predict crime type ──────────────────────────────────
@app.route("/predict-crime", methods=["POST"])
def predict():
    data     = request.json
    location = data.get("location")
    time     = data.get("time")

    if not location or not time:
        return jsonify({
            "error": "Missing required fields: location and time"
        }), 400

    result = predict_crime({
        "location":        location,
        "time":            time,
        "victim_age":      data.get("victim_age", 0),
        "victim_gender":   data.get("victim_gender", "Unknown"),
        "weapon_used":     data.get("weapon_used", "Unknown"),
        "crime_domain":    data.get("crime_domain", "Unknown"),
        "police_deployed": data.get("police_deployed", 0)
    })

    result["aiSummary"] = generate_crime_summary({
        "predicted_crime": result.get("predicted_crime"),
        "risk_level":      result.get("risk_level"),
        "probability":     result.get("probability"),
        "location":        location,
        "time":            time,
        "weapon_used":     data.get("weapon_used", "Unknown"),
    })

    return jsonify(result)


# ── NEW: Crime hotspot prediction ─────────────────────────────────
@app.route("/predict-hotspot", methods=["POST"])
def hotspot():
    data  = request.json
    city  = data.get("city")        # optional
    top_n = data.get("topN", 5)     # optional, default 5

    # Validate topN
    if not isinstance(top_n, int) or top_n < 1 or top_n > 20:
        return jsonify({
            "error": "topN must be an integer between 1 and 20"
        }), 400

    result = predict_hotspots(city=city, top_n=top_n)

    if not result.get("success"):
        return jsonify(result), 500

    # ── Add Gemini summary for top hotspot ────────────────────────
    if result["hotspots"]:
        top = result["hotspots"][0]
        result["aiSummary"] = generate_crime_summary({
            "predicted_crime": top["mostCommonCrime"],
            "risk_level":      top["riskLevel"],
            "probability":     top["riskScore"] / 10,
            "location":        top["area"],
            "time":            top["peakTime"],
            "weapon_used":     "Unknown",
        })

    return jsonify(result)


# ── EXISTING: Generate alert message ─────────────────────────────
@app.route("/generate-alert", methods=["POST"])
def generate_alert():
    data       = request.json
    crime_type = data.get("crimeType")
    severity   = data.get("severity")
    location   = data.get("location")
    camera_id  = data.get("cameraId")

    if not crime_type or not severity or not location:
        return jsonify({
            "error": "crimeType, severity, location are required"
        }), 400

    message = generate_alert_message({
        "crimeType": crime_type,
        "severity":  severity,
        "location":  location,
        "cameraId":  camera_id,
    })

    return jsonify({"message": message})


# ── EXISTING: Video detection (mock for now) ─────────────────────
@app.route("/detect", methods=["POST"])
def detect():
    data       = request.json
    video_path = data.get("videoPath")
    camera_id  = data.get("cameraId")
    location   = data.get("location")

    if not video_path or not camera_id:
        return jsonify({
            "error": "videoPath and cameraId are required"
        }), 400

    mock_events = [{
        "crimeType":        "suspicious",
        "severity":         "medium",
        "confidenceScore":  0.82,
        "timestampInVideo": "00:01:23",
        "thumbnailUrl":     None,
    }]

    for event in mock_events:
        event["aiSummary"] = generate_crime_summary({
            "predicted_crime": event["crimeType"],
            "risk_level":      event["severity"].upper(),
            "probability":     event["confidenceScore"],
            "location":        location,
            "time":            event["timestampInVideo"],
            "weapon_used":     "Unknown",
        })

    return jsonify({
        "success":        True,
        "detectedEvents": mock_events,
        "total":          len(mock_events)
    })


# ── Health check ─────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":   "ok",
        "service":  "ai-model",
        "routes": [
            "POST /predict-crime",
            "POST /predict-hotspot",
            "POST /generate-alert",
            "POST /detect",
        ]
    })


@app.route("/analyze-trends", methods=["POST"])
def trends():
    data = request.json or {}

    group_by   = data.get("groupBy",   "month")
    city       = data.get("city",       None)
    crime_type = data.get("crimeType",  None)
    start_date = data.get("startDate",  None)
    end_date   = data.get("endDate",    None)

    # Validate groupBy
    valid_groups = ['day', 'month', 'year', 'weekday', 'timeslot']
    if group_by not in valid_groups:
        return jsonify({
            "error": f"groupBy must be one of: {', '.join(valid_groups)}"
        }), 400

    result = analyze_trends(
        group_by   = group_by,
        city       = city,
        crime_type = crime_type,
        start_date = start_date,
        end_date   = end_date,
    )

    if not result.get("success"):
        return jsonify(result), 500

    # ── Add Gemini summary for top trend insight ──────────────────
    summary = result.get("summary", {})
    result["aiSummary"] = generate_crime_summary({
        "predicted_crime": summary.get("mostCommonCrime", "Unknown"),
        "risk_level":      "HIGH" if summary.get("trendDirection") == "increasing" else "MEDIUM",
        "probability":     0.75,
        "location":        city or "All Cities",
        "time":            summary.get("mostDangerousTime", "Unknown"),
        "weapon_used":     "Unknown",
    })

    return jsonify(result)


@app.route("/area-risk", methods=["POST"])
def area_risk():
    data = request.json or {}

    city        = data.get("city")
    time_of_day = data.get("timeOfDay")   # optional

    if not city:
        return jsonify({
            "error": "city is required"
        }), 400

    result = get_area_risk(
        city        = city,
        time_of_day = time_of_day,
    )

    if not result.get("success"):
        return jsonify(result), 404

    # ── Add Gemini summary ────────────────────────────────────────
    result["aiSummary"] = generate_crime_summary({
        "predicted_crime": result["summary"]["mostCommonCrime"],
        "risk_level":      result["riskLevel"],
        "probability":     result["riskScore"] / 10,
        "location":        city,
        "time":            result["summary"]["mostDangerousTime"],
        "weapon_used":     (
            result["weaponStats"][0]["weapon"]
            if result.get("weaponStats") else "Unknown"
        ),
    })

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5001)