FROM python:3.11-slim

WORKDIR /app

# -----------------------------
# System dependencies (OpenCV + FFmpeg)
# -----------------------------
RUN apt-get update && apt-get install -y \
    libsm6 \
    libxext6 \
    libxrender-dev \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------
# Install uv (Python package manager)
# -----------------------------
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# IMPORTANT: fix PATH for uv
ENV PATH="/root/.local/bin:$PATH"

# -----------------------------
# Copy dependency file first (better caching)
# -----------------------------
COPY pyproject.toml ./

# Install dependencies using uv
RUN uv pip install --system -e .

# -----------------------------
# Copy application code
# -----------------------------
COPY main.py ./
COPY processor.py ./
COPY utils.py ./

# -----------------------------
# Create runtime folders
# -----------------------------
RUN mkdir -p tmp/uploads tmp/processed

# -----------------------------
# Expose FastAPI port
# -----------------------------
EXPOSE 8000

# -----------------------------
# Start server
# -----------------------------
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]