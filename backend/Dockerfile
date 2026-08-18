FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (including libpcap for Scapy on Linux, though promiscuous mode requires privileges)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpcap-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the API port
EXPOSE 8765

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8765"]
