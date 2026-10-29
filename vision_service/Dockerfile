FROM python:3.11-slim

# Prevent python from writing pyc files to disk and enable line-buffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV MODELS_DIR=/app/models
ENV ONNX_NUM_THREADS=2

WORKDIR /app

# Install dependencies with no cache to minimize image size
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy microservice code
COPY main.py .

# Create models directory (to be mounted or populated via volume)
RUN mkdir -p /app/models

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
