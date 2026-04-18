#!/bin/bash

echo "🚀 Starting CrimeAI ML service..."

# create models folder
mkdir -p models

# train model if not exists
if [ ! -f "models/crime_model.pkl" ]; then
  echo "🤖 Training model..."
  python train.py
fi

# start server
gunicorn app:app --bind 0.0.0.0:$PORT