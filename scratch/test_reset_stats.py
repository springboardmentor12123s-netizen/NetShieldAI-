import urllib.request
import time
import json

# Generate web traffic to trigger sniffer alerts
try:
    urllib.request.urlopen("https://www.google.com", timeout=2)
    print("Triggered web request.")
except Exception:
    pass

time.sleep(3)

# Query dashboard stats
try:
    with urllib.request.urlopen("http://localhost:8000/dashboard/stats") as res:
        stats = json.loads(res.read().decode())
        print("Stats:")
        print(f"Packets Processed: {stats['total_packets_processed']}")
        print(f"Alerts Triggered: {stats['total_alerts_triggered']}")
        print(f"Active Incidents: {stats['active_incidents']}")
        print(f"Threats Blocked: {stats['threats_blocked_today']}")
except Exception as e:
    print("Error:", e)
