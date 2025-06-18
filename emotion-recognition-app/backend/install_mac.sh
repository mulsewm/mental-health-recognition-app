#!/bin/bash

# Exit on error
set -e

echo "🍏 Setting up Python environment for Apple Silicon..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    exit 1
fi

# Create and activate virtual environment
echo "🐍 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
echo "🔄 Upgrading pip..."
pip install --upgrade pip

# Install system dependencies
echo "📦 Installing system dependencies..."
brew install cmake
brew install boost

# Install Python dependencies
echo "📦 Installing Python dependencies..."

# First install numpy separately
pip install numpy==1.24.2

# Install dlib with pre-built wheel for Apple Silicon
pip install --no-cache-dir \
    --find-links https://github.com/ageitgey/face_recognition_models/raw/master/face_recognition_models/models/ \
    --find-links https://github.com/ageitgey/face_recognition/releases/download/0.1.0/ \
    dlib==19.24.99

# Install remaining requirements
echo "📦 Installing remaining requirements..."
pip install -r requirements.txt

echo "✅ Backend setup complete!"
echo "\nTo start the backend server, run:"
echo "source venv/bin/activate"
echo "uvicorn app.main:app --reload"
