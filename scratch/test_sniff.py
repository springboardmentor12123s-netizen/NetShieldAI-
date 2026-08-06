import threading
import time
import urllib.request
from scapy.all import sniff

def make_traffic():
    time.sleep(1)
    try:
        urllib.request.urlopen("https://www.google.com", timeout=2)
        print("[Traffic Generator] Triggered HTTP Request.")
    except Exception as e:
        print("[Traffic Generator] Error:", e)

# Start traffic generator thread
t = threading.Thread(target=make_traffic)
t.start()

# Sniff packets
print("[Sniffer] Sniffing packets for 5 seconds...")
packets = sniff(count=10, timeout=5)
print(f"[Sniffer] Completed. Sniffed {len(packets)} packets.")
for i, pkt in enumerate(packets[:5]):
    print(f"Packet {i+1}: {pkt.summary()}")
