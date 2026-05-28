# WealthOS — Production Dockerfile
# Multi-stage build: frontend (Node) + backend (Python)

# ─── Stage 1: Build Frontend ───────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --prefer-offline

COPY frontend/ ./
ARG VITE_API_URL
ARG VITE_WS_URL
RUN npm run build

# ─── Stage 2: Python Backend ───────────────────────────────────────────────────
FROM python:3.11-slim AS production
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY WealthOS/ ./WealthOS/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./WealthOS/static

WORKDIR /app/WealthOS

# Environment defaults
ENV ENV=production
ENV BACKEND_HOST=0.0.0.0
ENV BACKEND_PORT=8000

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
