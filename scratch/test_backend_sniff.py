import time
from backend.packet_sniffer import start_sniffer, get_sniffer_status, stop_sniffer
import urllib.request

print("Starting packet sniffer...")
success, msg = start_sniffer()
print(f"Start result: {success}, msg: {msg}")

# Trigger some traffic
try:
    urllib.request.urlopen("https://www.google.com", timeout=2)
except Exception:
    pass

for i in range(5):
    time.sleep(1)
    print(f"Status check {i+1}: {get_sniffer_status()}")

stop_sniffer()
