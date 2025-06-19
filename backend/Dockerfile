# ===== BUILD STAGE =====
FROM python:3.9-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first to leverage Docker cache
COPY requirements.txt .

# Prevent Jupyter installation and install only necessary dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    # Explicitly remove jupyter if it was installed by any dependency
    pip uninstall -y jupyter jupyter_core jupyter-client jupyter-console jupyterlab ipykernel ipython || true

# ===== RUNTIME STAGE =====
FROM python:3.9-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libopenblas-base \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Create non-root user and set up directories
RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && mkdir -p /app/uploads \
    && chown -R appuser:appuser /app

# Copy application code
COPY --chown=appuser:appuser app/ ./app
COPY --chown=appuser:appuser start.sh .

# Set permissions
RUN chmod +x /app/start.sh \
    && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Command to run the application
CMD ["./start.sh"]
