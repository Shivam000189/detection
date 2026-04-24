import streamlit as st
import threading
import os
from app import app  # Import your Flask 'app' object

# 1. Setup Streamlit UI (Required for Streamlit Cloud to stay active)
st.set_page_config(page_title="CrimeAI API Server", page_icon="🚀")
st.title("CrimeAI ML Service")
st.info("The Flask API is running in the background.")

# 2. Function to run Flask
def run_flask():
    # Use the port Streamlit expects or a fixed one
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port)

# 3. Start Flask in a background thread
if "flask_thread" not in st.session_state:
    st.session_state.flask_thread = threading.Thread(target=run_flask, daemon=True)
    st.session_state.flask_thread.start()
    st.success(f"Flask API started on port {os.getenv('PORT', 5001)}")

# 4. Display Logs/Status
st.subheader("Service Status")
st.write("✅ Health Check: [Click here](/health)")
st.write("📡 Endpoints active: `/predict-crime`, `/predict-hotspot`, `/area-risk`")