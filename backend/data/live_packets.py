from collections import deque

live_packets = deque(maxlen=1000)

protocol_counter = {
    "TCP": 0,
    "UDP": 0,
    "ICMP": 0,
    "ARP": 0,
    "DNS": 0,
    "Other": 0,
}

unique_ips = set()