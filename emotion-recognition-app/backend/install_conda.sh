#!/bin/bash

# Exit on error
set -e

echo "🐍 Setting up Conda environment for Emotion Recognition..."

# Check if Conda is installed
if ! command -v conda &> /dev/null; then
    echo "❌ Error: Conda is not installed. Please install Miniconda or Anaconda first."
    echo "   Download from: https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

# Create Conda environment
echo "🐍 Creating Conda environment 'emotion-recognition'..."
conda create -n emotion-recognition python=3.9 -y

# Activate the environment
echo "🔧 Activating Conda environment..."
eval "$(conda shell.bash hook)"
conda activate emotion-recognition

# Install system dependencies
echo "📦 Installing system dependencies..."
conda install -c conda-forge cmake -y
conda install -c conda-forge dlib -y
conda install -c conda-forge opencv -y

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create required directories
echo "📂 Creating required directories..."
mkdir -p models
mkdir -p uploads

echo "✅ Backend setup complete!"
echo "\nTo start the backend server, run:"
echo "conda activate emotion-recognition"
echo "uvicorn app.main:app --reload"
