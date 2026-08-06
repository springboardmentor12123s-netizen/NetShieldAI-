import urllib.request
import time
import json

# Trigger reset POST
try:
    req = urllib.request.Request("http://localhost:8000/monitoring/reset", method="POST")
    with urllib.request.urlopen(req) as res:
        print("Reset response:", res.read().decode())
except Exception as e:
    print("Reset failed:", e)

# Generate traffic
for _ in range(5):
    try:
        urllib.request.urlopen("https://www.google.com", timeout=2)
    except Exception:
        pass
    time.sleep(1)

# Check status
try:
    with urllib.request.urlopen("http://localhost:8000/monitoring/sniffer/status") as res:
        print("Status post-reset:", res.read().decode())
except Exception as e:
    print("Status check failed:", e)
