FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for sentence-transformers + OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment defaults (can be overridden at runtime)
ENV PORT=8000
ENV NDD_URL=http://endee-oss:8080

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
