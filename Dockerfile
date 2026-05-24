# ─────────────────────────────────────────────
# WealthOS — Production Dockerfile
# Builds React frontend then serves everything
# through FastAPI on a single port.
# ─────────────────────────────────────────────

# ── Stage 1: Build React frontend ────────────
FROM node:20-slim AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build
# Output: /build/frontend/dist


# ── Stage 2: Python backend ───────────────────
FROM python:3.11-slim

# System deps for OCR + image processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (cache layer)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

# Copy built frontend from Stage 1
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

# Expose port (Railway/Render inject $PORT)
EXPOSE 8000

# Start FastAPI — serves API + static frontend
CMD uvicorn api:app --host 0.0.0.0 --port ${PORT:-8000}
