import urllib.request
import time
import json

# Generate web traffic to trigger sniffer alerts
try:
    urllib.request.urlopen("https://www.google.com", timeout=2)
    print("Triggered web request.")
except Exception:
    pass

time.sleep(4)

# Query active alerts
try:
    with urllib.request.urlopen("http://localhost:8000/alerts") as res:
        alerts = json.loads(res.read().decode())
        print("Logged Alerts:")
        for a in alerts:
            print(f"ID: {a['id']}, Msg: {a['message']}, Timestamp: {a['timestamp']}")
except Exception as e:
    print("Error:", e)
