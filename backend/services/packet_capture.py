import threading
from datetime import datetime
import time
import psutil

from scapy.all import sniff
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.layers.l2 import ARP
from scapy.layers.dns import DNS

from data.live_packets import (
    live_packets,
    protocol_counter,
    unique_ips,
)

from data.traffic_data import network_stats

from services.ai_detector import process_packet


# ---------------------------------------
# Previous network counters
# ---------------------------------------

previous = psutil.net_io_counters()
last_time = time.time()


def packet_callback(packet):
    global previous
    global last_time

    src = "-"
    dst = "-"
    protocol = "Other"

    # ---------------------------------------
    # Detect Protocol
    # ---------------------------------------

    if packet.haslayer(IP):

        src = packet[IP].src
        dst = packet[IP].dst

        unique_ips.add(src)
        unique_ips.add(dst)

        if packet.haslayer(TCP):
            protocol = "TCP"

        elif packet.haslayer(UDP):

            if packet.haslayer(DNS):
                protocol = "DNS"
            else:
                protocol = "UDP"

        elif packet.haslayer(ICMP):
            protocol = "ICMP"

    elif packet.haslayer(ARP):

        protocol = "ARP"

        src = packet[ARP].psrc
        dst = packet[ARP].pdst

        unique_ips.add(src)
        unique_ips.add(dst)

    # ---------------------------------------
    # Update Protocol Counter
    # ---------------------------------------

    if protocol in protocol_counter:
        protocol_counter[protocol] += 1
    else:
        protocol_counter["Other"] += 1

    # ---------------------------------------
    # Store Live Packet
    # ---------------------------------------

    live_packets.append(
        {
            "time": datetime.now().strftime("%H:%M:%S"),
            "source_ip": src,
            "destination_ip": dst,
            "protocol": protocol,
            "length": len(packet),
        }
    )

    # Keep latest 200 packets only
    if len(live_packets) > 200:
        live_packets.pop(0)

    # ---------------------------------------
    # AI Detection
    # ---------------------------------------

    features = {
        "dur": 0,
        "proto": 0,
        "service": 0,
        "state": 0,
        "spkts": 1,
        "dpkts": 1,
        "sbytes": len(packet),
        "dbytes": len(packet),
        "rate": 1,
        "sttl": 64,
        "dttl": 64,
        "sload": 0,
        "dload": 0,
        "sloss": 0,
        "dloss": 0,
        "sinpkt": 0,
        "dinpkt": 0,
        "sjit": 0,
        "djit": 0,
        "swin": 0,
        "stcpb": 0,
        "dtcpb": 0,
        "dwin": 0,
        "tcprtt": 0,
        "synack": 0,
        "ackdat": 0,
        "smean": len(packet),
        "dmean": len(packet),
        "trans_depth": 0,
        "response_body_len": 0,
        "ct_srv_src": 0,
        "ct_state_ttl": 0,
        "ct_dst_ltm": 0,
        "ct_src_dport_ltm": 0,
        "ct_dst_sport_ltm": 0,
        "ct_dst_src_ltm": 0,
        "is_ftp_login": 0,
        "ct_ftp_cmd": 0,
        "ct_flw_http_mthd": 0,
        "ct_src_ltm": 0,
        "ct_srv_dst": 0,
        "is_sm_ips_ports": 0,
        "srcip": src,
        "dstip": dst,
    }

    try:
        process_packet(features)
    except Exception as e:
        print("AI Error:", e)

    # ---------------------------------------
    # Update Live Network Stats
    # ---------------------------------------

    current = psutil.net_io_counters()

    network_stats["bytes_sent"] = current.bytes_sent
    network_stats["bytes_recv"] = current.bytes_recv

    network_stats["packets_sent"] = current.packets_sent
    network_stats["packets_recv"] = current.packets_recv

    network_stats["packets"] = (
        current.packets_sent +
        current.packets_recv
    )

    current_time = time.time()
    elapsed = current_time - last_time

    if elapsed <= 0:
        elapsed = 1

    upload = (current.bytes_sent - previous.bytes_sent) / elapsed
    download = (current.bytes_recv - previous.bytes_recv) / elapsed

    # KB/s
    network_stats["upload_speed"] = round(upload / 1024, 2)
    network_stats["download_speed"] = round(download / 1024, 2)

    last_time = current_time
    previous = current

    network_stats["active_connections"] = len(
        psutil.net_connections(kind="inet")
    )

    network_stats["interfaces_up"] = sum(
        1
        for interface in psutil.net_if_stats().values()
        if interface.isup
    )

    network_stats["protocols"] = [
        {
            "protocol": protocol_name,
            "count": count,
        }
        for protocol_name, count in protocol_counter.items()
    ]
def update_network_stats():
    global previous

    while True:
        time.sleep(1)

        current = psutil.net_io_counters()

        upload = current.bytes_sent - previous.bytes_sent
        download = current.bytes_recv - previous.bytes_recv

        network_stats["bytes_sent"] = current.bytes_sent
        network_stats["bytes_recv"] = current.bytes_recv

        network_stats["packets_sent"] = current.packets_sent
        network_stats["packets_recv"] = current.packets_recv

        network_stats["packets"] = (
            current.packets_sent + current.packets_recv
        )

        # KB/s
        network_stats["upload_speed"] = round(upload / 1024, 2)
        network_stats["download_speed"] = round(download / 1024, 2)

        network_stats["active_connections"] = len(
            psutil.net_connections(kind="inet")
        )

        network_stats["interfaces_up"] = sum(
            1
            for interface in psutil.net_if_stats().values()
            if interface.isup
        )

        network_stats["protocols"] = [
            {
                "protocol": protocol_name,
                "count": count,
            }
            for protocol_name, count in protocol_counter.items()
        ]

        previous = current

def start_sniffing():

    print("===================================")
    print(" NetShield AI Packet Sniffer Started")
    print("===================================")

    threading.Thread(
        target=update_network_stats,
        daemon=True,
    ).start()

    sniff(
        prn=packet_callback,
        store=False,
    )