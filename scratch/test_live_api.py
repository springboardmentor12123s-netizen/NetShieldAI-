import urllib.request
import json
import time

def call_api(path, method="GET"):
    url = f"http://localhost:8000{path}"
    req = urllib.request.Request(url, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode())
    except Exception as e:
        return {"error": str(e)}

print("1. Querying initial sniffer status:")
print(call_api("/monitoring/sniffer/status"))

print("\n2. Starting sniffer:")
print(call_api("/monitoring/sniffer/start", method="POST"))

print("\n3. Generating some network traffic (fetching a page)...")
try:
    urllib.request.urlopen("https://www.google.com", timeout=2)
except Exception:
    pass

time.sleep(3)

print("\n4. Querying sniffer status after traffic generation:")
print(call_api("/monitoring/sniffer/status"))

print("\n5. Checking active alerts in database:")
print(call_api("/alerts"))
