import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_crime_summary(data: dict) -> str:
    """
    Called after ML model prediction.
    Returns a natural language summary for police officers.
    """
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""
        You are a police crime analysis assistant in India.
        Write a 2-3 sentence professional summary for a police officer.
        Be direct, factual, and concise. No bullet points or formatting.

        Crime Details:
        - Predicted Crime Type : {data.get("predicted_crime", "Unknown")}
        - Risk Level           : {data.get("risk_level", "Unknown")}
        - Confidence           : {round(data.get("probability", 0) * 100, 1)}%
        - Location             : {data.get("location", "Unknown")}
        - Time                 : {data.get("time", "Unknown")}
        - Weapon Used          : {data.get("weapon_used", "Unknown")}
        """

        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        print(f"[Gemini Error]: {e}")
        # Safe fallback if Gemini API fails
        return (
            f"{data.get('predicted_crime', 'Crime')} risk detected at "
            f"{data.get('location', 'unknown location')} "
            f"at {data.get('time', 'unknown time')}. "
            f"Risk level: {data.get('risk_level', 'UNKNOWN')}. "
            f"Confidence: {round(data.get('probability', 0) * 100, 1)}%."
        )


def generate_alert_message(data: dict) -> str:
    """
    Called when a crime event triggers an alert.
    Returns a short urgent message for the alert notification.
    """
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""
        You are an emergency alert system for police in India.
        Write ONE short urgent alert message (max 2 sentences) 
        for a police officer about this crime event.
        Be urgent, clear, and actionable.

        Crime Event:
        - Crime Type : {data.get("crimeType", "Unknown")}
        - Severity   : {data.get("severity", "Unknown")}
        - Location   : {data.get("location", "Unknown")}
        - Camera ID  : {data.get("cameraId", "Unknown")}

        Respond with only the alert message text.
        """

        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        print(f"[Gemini Alert Error]: {e}")
        return (
            f"ALERT: {data.get('severity', '').upper()} severity "
            f"{data.get('crimeType', 'crime')} detected at "
            f"{data.get('location', 'unknown location')}. "
            f"Immediate attention required."
        )