import pickle
import pandas as pd
from utils.preprocess import preprocess_data


with open("models/crime_model.pkl", "rb") as f:
    model = pickle.load(f)

# def predict_crime(input_data):
#     df = pd.DataFrame([input_data])

    
#     # df['date'] = "2025-01-01"

#     df = preprocess_data(df)

    
#     expected_columns = model.feature_names_in_

#     for col in expected_columns:
#         if col not in df.columns:
#             df[col] = 0

#     df = df[expected_columns]

#     prediction = model.predict(df)[0]
#     probabilities = model.predict_proba(df).max()

    
#     if probabilities > 0.7:
#         risk = "HIGH"
#     elif probabilities > 0.4:
#         risk = "MEDIUM"
#     else:
#         risk = "LOW"

#     return {
#         "predicted_crime": prediction,
#         "probability": float(probabilities),
#         "risk_level": risk
#     }


def predict_crime(input_data):
    if 'location' in input_data:
        input_data['city'] = input_data.pop('location')
    if 'time' in input_data:
        input_data['time_of_occurrence'] = input_data.pop('time')
    else:
        input_data['time_of_occurrence'] = "00:00"

    df = pd.DataFrame([input_data])
    df = preprocess_data(df)

    expected_columns = model.feature_names_in_
    for col in expected_columns:
        if col not in df.columns:
            df[col] = 0
    df = df[expected_columns]

    prediction = model.predict(df)[0]
    probabilities = model.predict_proba(df).max()

    if probabilities > 0.7:
        risk = "HIGH"
        recommendation = "Avoid this area. Contact police if necessary."
    elif probabilities > 0.4:
        risk = "MEDIUM"
        recommendation = "Stay alert and avoid isolated areas."
    else:
        risk = "LOW"
        recommendation = "Area is relatively safe. Stay cautious."

    return {
        "predicted_crime": prediction,
        "probability": round(float(probabilities), 2),
        "risk_level": risk,
        "recommendation": recommendation,
        "input_summary": {
            "location": input_data.get("city", "Unknown"),
            "time": input_data.get("time_of_occurrence", "Unknown"),
            # "victim_age": input_data.get("victim_age", "Not provided"),
            "weapon_used": input_data.get("weapon_used", "Not provided")
        }
    }