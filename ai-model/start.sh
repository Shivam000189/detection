#!/bin/bash
set -e

echo "🚀 Starting CrimeAI ML service..."

# Create the directory if it doesn't exist
mkdir -p models

# Define the Dropbox link (dl=1 forces the direct download)
DROPBOX_URL="https://www.dropbox.com/scl/fi/c9q1yw1o1npx4ltmyh17q/crime_model.pkl?rlkey=ug4epwpuc1ibg8c07c5inrme8&st=e5vm582t&dl=1"
OUT_FILE="models/crime_model.pkl"

if [ ! -f "$OUT_FILE" ]; then
    echo "⬇️ Downloading model from Dropbox..."
    # -L follows redirects, -o specifies output file
    curl -L "$DROPBOX_URL" -o "$OUT_FILE"
else
    echo "📦 Model already exists, skipping download."
fi

# Final check to ensure the file is actually there and not empty
if [ ! -s "$OUT_FILE" ]; then
    echo "❌ Error: Model file is empty or download failed."
    exit 1
fi

echo "✅ Model ready. Launching Gunicorn..."
gunicorn app:app --bind 0.0.0.0:$PORT