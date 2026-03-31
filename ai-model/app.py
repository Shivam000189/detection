from flask import Flask, request, jsonify
from predict import predict_crime

app = Flask(__name__)

@app.route("/predict-crime", methods=["POST"])
def predict():
    data = request.json

    location = data.get("location")
    time = data.get("time")

    if not location or not time:
        return jsonify({"error": "Missing required fields: location and time"}), 400

    result = predict_crime({
        "location": location,
        "time": time,
        # "victim_age": data.get("victim_age", 0),
        "victim_gender": data.get("victim_gender", "Unknown"),
        "weapon_used": data.get("weapon_used", "Unknown"),
        "crime_domain": data.get("crime_domain", "Unknown"),
        "police_deployed": data.get("police_deployed", 0)
    })

    return jsonify(result)