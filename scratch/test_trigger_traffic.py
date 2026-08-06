import urllib.request
import time
import json

# Fetch google.com a few times to generate traffic
for _ in range(3):
    try:
        urllib.request.urlopen("https://www.google.com", timeout=2)
        print("Generated traffic.")
    except Exception:
        pass
    time.sleep(1)

# Query live uvicorn server stats
try:
    with urllib.request.urlopen("http://localhost:8000/monitoring/sniffer/status") as res:
        status = json.loads(res.read().decode())
        print("Live Sniffer Status of Uvicorn:")
        print(status)
except Exception as e:
    print("Error:", e)
