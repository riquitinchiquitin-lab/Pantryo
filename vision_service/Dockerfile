FROM python:3.13-slim

# Prevent python from writing pyc files to disk and enable line-buffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV MODELS_DIR=/app/models
ENV ONNX_NUM_THREADS=2
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Apply latest Debian security patches and remove apt caches to minimize attack surface
RUN apt-get update && apt-get upgrade -y && apt-get dist-upgrade -y --no-install-recommends \
    ca-certificates \
    && (apt-get purge -y openssh-server openssh-client openssh-sftp-server 2>/dev/null || true) \
    && apt-get autoremove -y \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Upgrade packaging tools and install latest secure Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir --upgrade -r requirements.txt

# Copy microservice code and run as non-root user
COPY main.py .
RUN useradd -r -u 1000 -s /usr/sbin/nologin appuser \
    && mkdir -p /app/models \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
