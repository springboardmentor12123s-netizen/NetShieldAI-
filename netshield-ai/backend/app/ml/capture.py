"""
Feature 1 — Live Network Packet Capture.

Captures packets from a real network interface with Scapy, aggregates them
into flow records (the same shape the existing model/DB already expect —
see NUMERIC_FEATURES in app/ml/model.py), and feeds each completed flow
through the existing prediction pipeline (predict_traffic -> predictions
collection -> alerts collection -> email alert), exactly like a manual
/api/predict call would, just automatic and continuous.

Manual testing (the Dashboard's "Run Prediction" form and the Packet
Monitoring "Simulate Traffic" button) keeps working independently of this;
this module only ADDS a real data source on top.

Design notes:
  - Scapy's sniff()/AsyncSniffer runs in its own background thread because
    it is a blocking, synchronous C-level capture loop — it cannot run
    inside the asyncio event loop.
  - Raw packets are aggregated into "flows" keyed by the 5-tuple
    (src_ip, dst_ip, protocol, src_port, dst_port), direction-normalized so
    a request/response pair on the same connection is one flow.
  - A flow is flushed (closed out and sent for prediction) once it has been
    idle for `capture_flow_timeout_seconds`. A lightweight asyncio background
    task polls for idle flows and pushes them through the async pipeline.
  - Nothing here assumes root/npcap is available at import time — all Scapy
    imports and socket access happen lazily inside start(), so importing
    this module (e.g. at FastAPI startup) never fails even in restricted
    environments. Actually starting a capture will raise a clear error if
    the process lacks permission to open a raw socket.
"""
import asyncio
import threading
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from app.config import settings

PROTO_MAP = {6: "tcp", 17: "udp", 1: "icmp"}


@dataclass
class _Flow:
    source_ip: str
    destination_ip: str
    protocol: str
    source_port: int
    destination_port: int
    first_seen: float
    last_seen: float
    packet_count: int = 0
    total_bytes: int = 0
    wrong_fragment: int = 0
    urgent: int = 0


class CaptureEngine:
    """Singleton-style engine. One instance lives for the process lifetime;
    start()/stop() just toggle the underlying sniffer thread."""

    def __init__(self) -> None:
        self._sniffer = None
        self._capture_thread: Optional[threading.Thread] = None
        self._flush_task: Optional[asyncio.Task] = None
        self._flows: dict[tuple, _Flow] = {}
        self._lock = threading.Lock()
        self._running = False
        self._error: Optional[str] = None
        self.packets_captured = 0
        self.flows_processed = 0
        self.started_at: Optional[datetime] = None
        # recent host packet counts, used to approximate the KDD-style
        # "count"/"srv_count" features (connections to same host / service
        # in a short recent window) from raw traffic.
        self._recent_host_hits: dict[str, list[float]] = defaultdict(list)
        self._recent_srv_hits: dict[tuple, list[float]] = defaultdict(list)

    # ---------------------------------------------------------------- status
    @property
    def is_running(self) -> bool:
        return self._running

    def status(self) -> dict:
        return {
            "running": self._running,
            "interface": settings.capture_interface or "default",
            "packets_captured": self.packets_captured,
            "flows_processed": self.flows_processed,
            "active_flows": len(self._flows),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "error": self._error,
        }

    # ----------------------------------------------------------------- start
    def start(self) -> None:

        if self._running:
            return

        try:
            from scapy.all import AsyncSniffer
            from scapy.arch.windows import get_windows_if_list
        except ImportError as exc:
            raise RuntimeError(
                "Scapy is not installed. Run: pip install scapy"
            ) from exc

        self._error = None

        kwargs = {
            "prn": self._on_packet,
            "store": False,
        }

        # Use interface from .env if provided
        iface = settings.capture_interface

        # If no interface is configured, automatically select the Wi-Fi adapter
        if not iface:
            try:
                interfaces = get_windows_if_list()
                for adapter in interfaces:
                    if adapter["name"] == "Wi-Fi":
                        iface = adapter["guid"]
                        print(f"[NetShield AI] Using interface: {adapter['name']}")
                        print(f"[NetShield AI] GUID: {adapter['guid']}")
                        break
            except Exception as e:
                print(f"[NetShield AI] Could not detect interface: {e}")

        if iface:
            kwargs["iface"] = iface

        try:
            print("=" * 50)
            print("Capture Interface:", settings.capture_interface)
            print("BPF Filter:", settings.capture_bpf_filter)
            print("Kwargs:", kwargs)
            print("=" * 50)
            self._sniffer = AsyncSniffer(**kwargs)
            self._sniffer.start()
            print("Sniffer started successfully.")
        except Exception as exc:
            self._error = str(exc)
            raise RuntimeError(
                f"Could not start packet capture: {exc}"
            ) from exc

        self._running = True
        self.started_at = datetime.utcnow()
        self.packets_captured = 0
        self.flows_processed = 0

        loop = asyncio.get_event_loop()
        self._flush_task = loop.create_task(self._flush_loop())

    # ------------------------------------------------------------ packet cb
    def _on_packet(self, pkt) -> None:
        """Runs on Scapy's capture thread — keep this fast and non-blocking."""
        print("Packet callback triggered")
        try:
            if "IP" not in pkt:
                return
            ip = pkt["IP"]
            proto = PROTO_MAP.get(ip.proto, str(ip.proto))
            sport = dport = 0
            if "TCP" in pkt:
                sport, dport = int(pkt["TCP"].sport), int(pkt["TCP"].dport)
            elif "UDP" in pkt:
                sport, dport = int(pkt["UDP"].sport), int(pkt["UDP"].dport)

            # Normalize direction so both sides of a connection map to one flow.
            fwd_key = (ip.src, ip.dst, proto, sport, dport)
            rev_key = (ip.dst, ip.src, proto, dport, sport)
            now = time.time()
            size = len(pkt)

            with self._lock:
                if fwd_key in self._flows:
                    flow = self._flows[fwd_key]
                elif rev_key in self._flows:
                    flow = self._flows[rev_key]
                else:
                    flow = _Flow(
                        source_ip=ip.src, destination_ip=ip.dst, protocol=proto,
                        source_port=sport, destination_port=dport,
                        first_seen=now, last_seen=now,
                    )
                    self._flows[fwd_key] = flow

                flow.last_seen = now
                flow.packet_count += 1
                flow.total_bytes += size
                if getattr(ip, "frag", 0):
                    flow.wrong_fragment += 1
                if "TCP" in pkt and int(pkt["TCP"].flags) & 0x20:  # URG flag
                    flow.urgent += 1

                self._recent_host_hits[ip.dst].append(now)
                self._recent_srv_hits[(ip.dst, dport)].append(now)

            self.packets_captured += 1
            print(
                f"Packet: {ip.src} -> {ip.dst} "
                f"{proto} "
                f"Total={self.packets_captured}"
            )
        except Exception:
            # Never let a malformed/unsupported packet kill the sniffer thread.
            pass

    def _recent_count(self, bucket: dict, key, window: float = 2.0) -> int:
        now = time.time()
        hits = [t for t in bucket.get(key, []) if now - t <= window]
        bucket[key] = hits
        return len(hits)

    # --------------------------------------------------------------- flush
    async def _flush_loop(self) -> None:
        """Periodically closes out idle flows and sends them through the
        real prediction pipeline (predict -> store -> alert -> email)."""
        # Imported here to avoid a circular import at module load time.
        from app.routers.predict_router import predict as run_prediction
        from app.models import PredictionRequest
        from app.database import packets_collection

        while True:
            await asyncio.sleep(1.0)
            now = time.time()
            ready: list[_Flow] = []
            with self._lock:
                for key in list(self._flows.keys()):
                    flow = self._flows[key]
                    if now - flow.last_seen >= settings.capture_flow_timeout_seconds:
                        ready.append(self._flows.pop(key))

            for flow in ready:
                try:
                    duration = max(flow.last_seen - flow.first_seen, 0.001)
                    flow_rate = flow.total_bytes / duration
                    count = self._recent_count(self._recent_host_hits, flow.destination_ip)
                    srv_count = self._recent_count(self._recent_srv_hits, (flow.destination_ip, flow.destination_port))

                    payload = PredictionRequest(
                        duration=round(duration, 3),
                        protocol_type=flow.protocol if flow.protocol in ("tcp", "udp", "icmp") else "tcp",
                        src_bytes=float(flow.total_bytes),
                        dst_bytes=0.0,
                        packet_count=flow.packet_count,
                        flow_rate=round(flow_rate, 2),
                        wrong_fragment=flow.wrong_fragment,
                        urgent=flow.urgent,
                        count=max(count, 1),
                        srv_count=max(srv_count, 1),
                        source_ip=flow.source_ip,
                        destination_ip=flow.destination_ip,
                        source_port=flow.source_port,
                        destination_port=flow.destination_port,
                    )

                    # Run the exact same pipeline manual predictions use, so
                    # predictions/alerts/emails behave identically either way.
                    # `current_user` is a synthetic system actor for the audit trail.
                    result = await run_prediction(payload, current_user={"username": "live-capture", "role": "admin"})

                    status = "normal"
                    if result.get("is_attack"):
                        status = "blocked" if result.get("threat_level") in ("Critical", "High") else "suspicious"

                    await packets_collection.insert_one({
                        "packet_id": result.get("prediction_id", "PKT-LIVE"),
                        "source_ip": flow.source_ip,
                        "destination_ip": flow.destination_ip,
                        "protocol": flow.protocol.upper(),
                        "source_port": flow.source_port,
                        "destination_port": flow.destination_port,
                        "packet_size": flow.total_bytes,
                        "duration": round(duration, 3),
                        "flow_rate": round(flow_rate, 2),
                        "status": status,
                        "source": "live",
                        "timestamp": datetime.utcnow(),
                    })
                    self.flows_processed += 1
                except Exception as exc:
                    print(f"[NetShield AI] Failed to process captured flow: {exc}")
    def stop(self):
        print("🛑 Stop requested")

        if self._sniffer is not None:
            try:
                self._sniffer.stop()
                print("✅ Sniffer stopped")
            except Exception as e:
                print("❌ Error stopping sniffer:", e)

            self._sniffer = None

        self._running = False

        if self._flush_task is not None:
            self._flush_task.cancel()
            self._flush_task = None

        with self._lock:
            self._flows.clear()

        print("✅ Monitoring fully stopped")

engine = CaptureEngine()
