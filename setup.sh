#!/bin/bash

# Exit on error
set -e

echo "🚀 Setting up Emotion Recognition Application..."

# Check for required commands
for cmd in python3 pip node npm; do
    if ! command -v $cmd &> /dev/null; then
        echo "❌ Error: $cmd is not installed"
        exit 1
    fi
done

# Create required directories
echo "📂 Creating required directories..."
mkdir -p backend/uploads
mkdir -p backend/models

# Check if Python virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv backend/venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source backend/venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install
cd ..

# Check for model files
if [ ! -f "backend/models/torchscript_model_0_66_49_wo_gl.pth" ]; then
    echo "⚠️  Warning: torchscript_model_0_66_49_wo_gl.pth not found in backend/models/"
    echo "   Please place your trained model file in this directory."
fi

if [ ! -f "backend/models/shape_predictor_68_face_landmarks.dat" ]; then
    echo "⚠️  Warning: shape_predictor_68_face_landmarks.dat not found in backend/models/"
    echo "   Please download it and place in this directory."
fi

echo "✅ Setup complete!"
echo "\nTo start the application, run:"
echo "1. Start the backend: cd backend && uvicorn app.main:app --reload"
echo "2. Start the frontend: cd frontend && npm run dev"
echo "\nOr use Docker: docker-compose up --build"
