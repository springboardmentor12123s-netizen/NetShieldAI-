"""Final verification of all API endpoints."""
import requests

BASE = "http://127.0.0.1:8765/api"

endpoints = ["dashboard", "history", "alerts", "reports/latest"]
all_ok = True

for ep in endpoints:
    r = requests.get("%s/%s" % (BASE, ep))
    ok = r.status_code == 200
    if not ok:
        all_ok = False
    data = r.json()
    status = "OK  " if ok else "FAIL"
    print("[%s] GET /api/%s -> HTTP %d" % (status, ep, r.status_code))
    if isinstance(data, list):
        print("  Count: %d" % len(data))
        if data:
            print("  First: %s" % str(data[0])[:100])
    elif isinstance(data, dict):
        items = list(data.items())
        for k, v in items[:8]:
            print("  %s: %s" % (k, str(v)[:80]))

print()
print("All endpoints OK: %s" % all_ok)
