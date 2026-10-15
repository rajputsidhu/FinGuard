# ====================================================
# FinGuard AI — Production Backend Dockerfile
# ====================================================
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HOST=0.0.0.0 \
    PORT=8000

WORKDIR /app

# Install curl for healthchecks and build-essential for packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application source code
COPY api/ ./api/
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY models/ ./models/

# Create non-root system user for security
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/logs /app/data_processed /app/outputs && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=10s \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
