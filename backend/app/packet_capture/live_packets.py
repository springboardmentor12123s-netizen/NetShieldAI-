from collections import deque

# Store only the latest 200 packets
live_packets = deque(maxlen=200)