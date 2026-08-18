import threading
import time
import uuid
from datetime import datetime
from collections import defaultdict

from scapy.all import sniff, IP, TCP, UDP, ICMP, get_if_list
from scapy.arch.windows import get_windows_if_list
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.traffic import TrafficRecord
from app.services.scoring import score_records

_flows = defaultdict(lambda: {
    "packet_count": 0,
    "byte_count": 0,
    "dst_packet_count": 0,
    "dst_byte_count": 0,
    "start": None,
    "last": None,
    "tcp_flags": set(),
})
_lock = threading.Lock()

_capture_thread = None
_flush_thread = None
_stop_event = threading.Event()
_local_ips = set()
_last_error = None  # surfaced via /live/status so the UI can explain *why* it isn't running


def _get_protocol(pkt):
    if TCP in pkt:
        return "TCP"
    if UDP in pkt:
        return "UDP"
    if ICMP in pkt:
        return "ICMP"
    return "OTHER"


def _process_packet(pkt):
    if IP not in pkt:
        return

    proto = _get_protocol(pkt)
    src_ip, dst_ip = pkt[IP].src, pkt[IP].dst
    src_port = dst_port = None
    flags = None

    if TCP in pkt:
        src_port, dst_port = pkt[TCP].sport, pkt[TCP].dport
        flags = str(pkt[TCP].flags)
    elif UDP in pkt:
        src_port, dst_port = pkt[UDP].sport, pkt[UDP].dport

    is_outbound = src_ip in _local_ips
    if is_outbound:
        key = (src_ip, dst_ip, src_port, dst_port, proto)
    else:
        key = (dst_ip, src_ip, dst_port, src_port, proto)

    size = len(pkt)
    now = time.time()

    with _lock:
        flow = _flows[key]
        if flow["start"] is None:
            flow["start"] = now
        flow["last"] = now

        if is_outbound:
            flow["packet_count"] += 1
            flow["byte_count"] += size
        else:
            flow["dst_packet_count"] += 1
            flow["dst_byte_count"] += size

        if flags:
            flow["tcp_flags"].add(flags)


def _flush_loop(interval_seconds=10, idle_timeout=5):
    while not _stop_event.is_set():
        time.sleep(interval_seconds)
        now = time.time()
        to_write = []

        with _lock:
            expired_keys = [k for k, f in _flows.items() if now - f["last"] >= idle_timeout]
            for k in expired_keys:
                flow = _flows.pop(k)
                to_write.append((k, flow))

        if not to_write:
            continue

        db: Session = SessionLocal()
        try:
            new_records = []
            for (src_ip, dst_ip, src_port, dst_port, proto), flow in to_write:
                duration = max(flow["last"] - flow["start"], 0.001)
                total_packets = flow["packet_count"] + flow["dst_packet_count"]
                total_bytes = flow["byte_count"] + flow["dst_byte_count"]

                record = TrafficRecord(
                    id=str(uuid.uuid4()),
                    timestamp=datetime.utcnow(),
                    src_ip=src_ip,
                    dst_ip=dst_ip,
                    src_port=src_port,
                    dst_port=dst_port,
                    protocol=proto,
                    duration=round(duration, 3),
                    packet_count=flow["packet_count"],
                    byte_count=flow["byte_count"],
                    dst_packet_count=flow["dst_packet_count"],
                    dst_byte_count=flow["dst_byte_count"],
                    packets_per_second=round(total_packets / duration, 2),
                    bytes_per_second=round(total_bytes / duration, 2),
                    avg_packet_size=round(total_bytes / max(total_packets, 1), 2),
                    tcp_flags=",".join(flow["tcp_flags"]) if flow["tcp_flags"] else None,
                    is_processed=False,
                    source="live_capture",
                )
                db.add(record)
                new_records.append(record)

            db.commit()
            for r in new_records:
                db.refresh(r)

            # Auto-score live-captured flows immediately, so alerts (and
            # critical emails) appear in real time without manual scoring.
            try:
                result = score_records(db, new_records)
                if result is None:
                    print("[live_capture] No trained model yet — flows saved but not scored.")
            except Exception as e:
                print(f"[live_capture] Auto-scoring failed: {e}")
        finally:
            db.close()


def _sniff_loop(interface):
    global _last_error
    try:
        sniff(
            iface=interface,
            prn=_process_packet,
            stop_filter=lambda pkt: _stop_event.is_set(),
            store=False,
        )
    except Exception as e:
        # Most commonly hit when running inside a Docker container: the
        # container's network namespace has no interface with this name
        # (containers only see virtual interfaces like eth0), and even if
        # it did, raw-socket capture requires host-level privileges Docker
        # doesn't grant by default. Recorded here so /live/status can
        # explain *why* capture isn't running instead of the UI silently
        # showing "started" forever.
        _last_error = str(e)
        print(f"[live_capture] Sniffing failed: {e}")


def start_capture(interface="Wi-Fi", local_ips=None):
    global _capture_thread, _flush_thread, _last_error

    if _capture_thread and _capture_thread.is_alive():
        return {"status": "already_running"}

    _last_error = None

    # Fail fast and honestly instead of spawning a thread that dies silently.
    # NOTE: on Windows, scapy's get_if_list() returns raw Npcap device paths
    # (\Device\NPF_{GUID}...), not friendly names like "Wi-Fi" — comparing
    # a friendly name against that list always fails even when the adapter
    # is available. get_windows_if_list() returns friendly names instead,
    # which is what actually matches what the UI/API passes in as `interface`.
    available = [i["name"] for i in get_windows_if_list()]
    if interface not in available:
        _last_error = (
            f"Interface '{interface}' not available in this environment "
            f"(found: {available}). Make sure Npcap is installed and this "
            f"backend is running natively on the host (outside Docker) with "
            f"administrator privileges — Docker containers cannot see the "
            f"host's real network interfaces. Use 'Simulate flows' for a "
            f"demo-friendly alternative."
        )
        return {"status": "error", "message": _last_error}

    _stop_event.clear()
    _local_ips.clear()
    if local_ips:
        _local_ips.update(local_ips)

    _capture_thread = threading.Thread(target=_sniff_loop, args=(interface,), daemon=True)
    _flush_thread = threading.Thread(target=_flush_loop, daemon=True)
    _capture_thread.start()
    _flush_thread.start()

    return {"status": "started", "interface": interface}


def stop_capture():
    _stop_event.set()
    return {"status": "stopping"}


def is_running():
    return bool(_capture_thread and _capture_thread.is_alive())


def get_status():
    return {
        "running": is_running(),
        "last_error": _last_error,
        "available_interfaces": [i["name"] for i in get_windows_if_list()],
    }