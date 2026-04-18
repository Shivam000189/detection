#!/bin/bash

echo "🚀 Starting CrimeAI ML service..."

gunicorn app:app --bind 0.0.0.0:$PORT