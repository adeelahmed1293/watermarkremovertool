FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV and FFmpeg
RUN apt-get update && apt-get install -y \
    libsm6 \
    libxext6 \
    libxrender-dev \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv to PATH
ENV PATH="/root/.cargo/bin:$PATH"

# Copy pyproject.toml and install dependencies
COPY pyproject.toml .
RUN uv pip install -e . --system

# Copy application files
COPY main.py .
COPY processor.py .
COPY utils.py .

# Create temp directories
RUN mkdir -p tmp/uploads tmp/processed

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
