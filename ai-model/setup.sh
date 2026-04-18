#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# setup.sh  —  Run once before starting the AI model service
# Usage:  cd ai-model && bash setup.sh
# ─────────────────────────────────────────────────────────────────

set -e  # Exit on any error

echo "🔧 CrimeAI Model Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# 2. Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Edit .env and add your GEMINI_API_KEY before continuing"
fi

# 3. Generate dataset if missing
if [ ! -f "data/crime_dataset_india.csv" ]; then
    echo "📊 Generating synthetic crime dataset..."
    python generate_dataset.py
else
    echo "✅ Dataset already exists: data/crime_dataset_india.csv"
fi

# 4. Create models directory
mkdir -p models

# 5. Train model if missing
if [ ! -f "models/crime_model.pkl" ]; then
    echo "🤖 Training RandomForest model (this may take a minute)..."
    python train.py
else
    echo "✅ Model already exists: models/crime_model.pkl"
fi

echo ""
echo "✅ Setup complete! Start the service with:"
echo "   python app.py          (development)"
echo "   gunicorn app:app --bind 0.0.0.0:5001   (production)"