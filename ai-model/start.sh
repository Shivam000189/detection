#!/bin/bash
set -e

FILE_ID="1kOSfD6BzPxCmz1EHvmil0S6m0HXUcnrg"
OUT_FILE="models/crime_model.pkl"

mkdir -p models

echo "⬇️ Attempting to bypass Google Drive scan warning..."

# This fetches the confirmation code and downloads in one pipe
CONFIRM=$(curl --silent --full-header "https://drive.google.com/uc?export=download&id=${FILE_ID}" | grep -ot 'confirm=[^&]*' | sed 's/confirm=//' || true)

if [ -z "$CONFIRM" ]; then
    # Fallback if no confirmation is needed
    curl -L "https://drive.google.com/uc?export=download&id=${FILE_ID}" -o $OUT_FILE
else
    curl -L "https://drive.google.com/uc?export=download&confirm=${CONFIRM}&id=${FILE_ID}" -o $OUT_FILE
fi

# Check file size - if it's still tiny, the download failed
FILESIZE=$(stat -c%s "$OUT_FILE")
if [ "$FILESIZE" -lt 10000 ]; then
    echo "❌ Error: Downloaded file is too small ($FILESIZE bytes). It is likely an HTML error page."
    exit 1
fi

echo "✅ Download successful ($FILESIZE bytes). Starting app..."
gunicorn app:app --bind 0.0.0.0:$PORT