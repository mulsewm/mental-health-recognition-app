#!/bin/bash
set -euo pipefail

# Enable debug mode if DEBUG is set to true
if [ "${DEBUG:-false}" = "true" ]; then
    set -x
    export PYTHONUNBUFFERED=1
    export PYTHONFAULTHANDLER=1
fi

# Log function for consistent output
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Error function for error handling
error_exit() {
    log "ERROR: $1" >&2
    exit 1
}

# Check if required commands are available
for cmd in python pip; do
    if ! command -v $cmd &> /dev/null; then
        error_exit "$cmd is required but not installed."
    fi
done

# Print environment information
log "=== Starting Application ==="
log "Working directory: $(pwd)"
log "Python version: $(python --version 2>&1 || echo 'Not found')"
log "Pip version: $(pip --version 2>&1 || echo 'Not found')"

# Create necessary directories with proper permissions
UPLOAD_DIR="/app/uploads"
log "Ensuring upload directory exists: $UPLOAD_DIR"
mkdir -p "$UPLOAD_DIR"
chmod 777 "$UPLOAD_DIR"

# Set default port
PORT=${PORT:-8000}

# Verify application files
if [ ! -d "app" ] || [ ! -f "app/main.py" ]; then
    error_exit "Required application files not found. Current directory: $(pwd)"
fi

# Check for Python dependencies
REQUIRED_PACKAGES=("fastapi" "uvicorn" "torch" "torchvision" "opencv-python-headless" "numpy")
for pkg in "${REQUIRED_PACKAGES[@]}"; do
    if ! python -c "import ${pkg%%[<=>]*}" &>/dev/null; then
        error_exit "Required Python package $pkg is not installed."
    fi
done

# Start the FastAPI server
log "Starting FastAPI server on port $PORT"
log "Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1"

exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "$PORT" \
    --workers 1 \
    --no-access-log \
    --proxy-headers \
    --timeout-keep-alive 30
