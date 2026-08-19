
import asyncio
import platform
import threading
import time
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from app.config import settings


# ---------------------------------------------------------
# Protocol mapping
# ---------------------------------------------------------

PROTO_MAP = {
    6: "tcp",
    17: "udp",
    1: "icmp",
}


# ---------------------------------------------------------
# Flow data structure
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# Capture Engine
# ---------------------------------------------------------

class CaptureEngine:
    """
    Handles real-time packet capture.

    One CaptureEngine instance is used by the application.

    start()
        Starts Scapy packet capture.

    stop()
        Stops packet capture and background flow processing.

    _on_packet()
        Receives individual packets.

    _flush_loop()
        Periodically checks for inactive flows and sends them
        to the ML prediction pipeline.
    """

    def __init__(self) -> None:
        self._sniffer = None

        self._capture_thread: Optional[threading.Thread] = None

        self._flush_task: Optional[asyncio.Task] = None

        # Active flows
        self._flows: dict[tuple, _Flow] = {}

        # Thread synchronization
        self._lock = threading.Lock()

        # Capture state
        self._running = False

        # Last capture error
        self._error: Optional[str] = None

        # Actual interface used by Scapy
        self._active_interface = None

        # Statistics
        self.packets_captured = 0
        self.flows_processed = 0

        self.started_at: Optional[datetime] = None

        # Recent traffic statistics
        self._recent_host_hits: dict[str, list[float]] = defaultdict(list)

        self._recent_srv_hits: dict[
            tuple, list[float]
        ] = defaultdict(list)

    # =====================================================
    # STATUS
    # =====================================================

    @property
    def is_running(self) -> bool:
        return self._running

    def status(self) -> dict:
        """
        Return current monitoring status.
        """

        with self._lock:
            active_flows = len(self._flows)

        return {
            "running": self._running,

            "interface": (
                str(self._active_interface)
                if self._active_interface is not None
                else (
                    str(settings.capture_interface)
                    if settings.capture_interface
                    else "default"
                )
            ),

            "packets_captured": self.packets_captured,
            "flows_processed": self.flows_processed,
            "active_flows": active_flows,

            "started_at": (
                self.started_at.isoformat()
                if self.started_at
                else None
            ),

            "error": self._error,
        }

    # =====================================================
    # START CAPTURE
    # =====================================================

    def start(self) -> None:
        if self._running:
            print("[NetShield AI] Capture already running.")
            return

        # ---------------------------------------------
        # Import Scapy lazily
        # ---------------------------------------------

        try:
            from scapy.all import AsyncSniffer, conf

        except ImportError as exc:
            self._error = (
                "Scapy is not available in the current backend "
                "environment. Install Scapy in the backend environment."
            )

            raise RuntimeError(self._error) from exc

        self._error = None

        # ---------------------------------------------
        # Packet capture arguments
        # ---------------------------------------------

        kwargs = {
            "prn": self._on_packet,
            "store": False,
        }

        # ---------------------------------------------
        # Network interface
        # ---------------------------------------------

        iface = settings.capture_interface

        if not iface:

            # =========================================
            # Windows
            # =========================================

            if platform.system().lower() == "windows":

                try:
                    from scapy.arch.windows import get_windows_if_list

                    interfaces = get_windows_if_list()

                    # First try Wi-Fi
                    for adapter in interfaces:
                        adapter_name = str(
                            adapter.get("name", "")
                        )

                        if adapter_name.lower() == "wi-fi":
                            iface = adapter.get("guid")

                            print(
                                "[NetShield AI] Using interface: Wi-Fi"
                            )

                            print(
                                "[NetShield AI] GUID:",
                                iface
                            )

                            break

                    # If Wi-Fi was not found, show available interfaces
                    if not iface:
                        print(
                            "[NetShield AI] Wi-Fi interface not found."
                        )

                        print(
                            "[NetShield AI] Available Windows interfaces:"
                        )

                        for adapter in interfaces:
                            print(
                                "  -",
                                adapter.get("name"),
                                adapter.get("guid"),
                            )

                except Exception as exc:
                    print(
                        "[NetShield AI] Could not detect Windows "
                        "interfaces:",
                        exc,
                    )

            # =========================================
            # Linux / Docker
            # =========================================

            else:
                try:
                    iface = conf.iface

                    print(
                        "[NetShield AI] Linux/Docker interface:",
                        iface,
                    )

                except Exception as exc:
                    print(
                        "[NetShield AI] Could not detect Linux "
                        "interface:",
                        exc,
                    )

        # Save actual interface for status endpoint
        self._active_interface = iface

        if iface:
            kwargs["iface"] = iface

        # ---------------------------------------------
        # BPF filter
        # ---------------------------------------------

        bpf_filter = getattr(
            settings,
            "capture_bpf_filter",
            None,
        )

        if bpf_filter:
            kwargs["filter"] = bpf_filter

        # ---------------------------------------------
        # Start Scapy
        # ---------------------------------------------

        try:
            print("=" * 60)

            print(
                "[NetShield AI] Starting live packet capture"
            )

            print(
                "Operating System:",
                platform.system(),
            )

            print(
                "Interface:",
                iface or "default",
            )

            print(
                "BPF Filter:",
                bpf_filter or "none",
            )

            print(
                "Flow Timeout:",
                settings.capture_flow_timeout_seconds,
                "seconds",
            )

            print("=" * 60)

            self._sniffer = AsyncSniffer(**kwargs)

            self._sniffer.start()

            print(
                "[NetShield AI] Sniffer started successfully."
            )

        except Exception as exc:

            self._sniffer = None

            self._active_interface = None

            self._error = (
                f"Could not start packet capture: {exc}"
            )

            print(
                "[NetShield AI] CAPTURE ERROR:",
                repr(exc),
            )

            raise RuntimeError(self._error) from exc

        # ---------------------------------------------
        # Reset state
        # ---------------------------------------------

        self._running = True

        self.started_at = datetime.utcnow()

        self.packets_captured = 0

        self.flows_processed = 0

        # Clear old errors
        self._error = None

        # ---------------------------------------------
        # Start async flow processor
        # ---------------------------------------------

        try:
            loop = asyncio.get_running_loop()

            self._flush_task = loop.create_task(
                self._flush_loop()
            )

            print(
                "[NetShield AI] "
                "Flow processor started."
            )

        except RuntimeError as exc:

            self._error = (
                "No running asyncio event loop. "
                "Capture cannot process flows."
            )

            print(
                "[NetShield AI] ERROR:",
                exc,
            )

            # Stop sniffer because flow processing cannot start
            try:
                if self._sniffer is not None:
                    self._sniffer.stop()
            except Exception:
                pass

            self._sniffer = None
            self._running = False

            raise RuntimeError(self._error) from exc

    # =====================================================
    # PACKET CALLBACK
    # =====================================================

    def _on_packet(self, pkt) -> None:
        """
        Called by Scapy for every captured packet.

        IMPORTANT:
        Keep this function fast because it runs on the
        Scapy capture thread.
        """

        try:

            # -----------------------------------------
            # Only process IPv4 packets
            # -----------------------------------------

            if "IP" not in pkt:
                return

            ip = pkt["IP"]

            # -----------------------------------------
            # Protocol
            # -----------------------------------------

            proto = PROTO_MAP.get(
                int(ip.proto),
                str(ip.proto),
            )

            # -----------------------------------------
            # Ports
            # -----------------------------------------

            sport = 0
            dport = 0

            if "TCP" in pkt:
                sport = int(pkt["TCP"].sport)
                dport = int(pkt["TCP"].dport)

            elif "UDP" in pkt:
                sport = int(pkt["UDP"].sport)
                dport = int(pkt["UDP"].dport)

            # -----------------------------------------
            # Packet information
            # -----------------------------------------

            now = time.time()

            packet_size = len(pkt)

            # -----------------------------------------
            # Forward / reverse flow keys
            # -----------------------------------------

            fwd_key = (
                ip.src,
                ip.dst,
                proto,
                sport,
                dport,
            )

            rev_key = (
                ip.dst,
                ip.src,
                proto,
                dport,
                sport,
            )

            # -----------------------------------------
            # Update flow
            # -----------------------------------------

            with self._lock:

                if fwd_key in self._flows:

                    flow = self._flows[fwd_key]

                elif rev_key in self._flows:

                    flow = self._flows[rev_key]

                else:

                    flow = _Flow(
                        source_ip=ip.src,
                        destination_ip=ip.dst,
                        protocol=proto,
                        source_port=sport,
                        destination_port=dport,
                        first_seen=now,
                        last_seen=now,
                    )

                    self._flows[fwd_key] = flow

                # -------------------------------------
                # Update statistics
                # -------------------------------------

                flow.last_seen = now

                flow.packet_count += 1

                flow.total_bytes += packet_size

                # IP fragmentation
                if getattr(ip, "frag", 0):
                    flow.wrong_fragment += 1

                # TCP URG flag
                if "TCP" in pkt:

                    try:

                        tcp_flags = int(
                            pkt["TCP"].flags
                        )

                        if tcp_flags & 0x20:
                            flow.urgent += 1

                    except Exception:
                        pass

                # -------------------------------------
                # Recent traffic statistics
                # -------------------------------------

                self._recent_host_hits[
                    ip.dst
                ].append(now)

                self._recent_srv_hits[
                    (ip.dst, dport)
                ].append(now)

            # -----------------------------------------
            # Global packet count
            # -----------------------------------------

            self.packets_captured += 1

            print(
                f"Packet: "
                f"{ip.src} -> {ip.dst} "
                f"{proto} "
                f"Total={self.packets_captured}"
            )

        except Exception as exc:

            # Never allow a bad packet to terminate
            # the Scapy callback thread.

            print(
                "[NetShield AI] "
                "Packet processing error:",
                repr(exc),
            )

    # =====================================================
    # RECENT TRAFFIC COUNT
    # =====================================================

    def _recent_count(
        self,
        bucket: dict,
        key,
        window: float = 2.0,
    ) -> int:

        now = time.time()

        hits = bucket.get(key, [])

        # Keep only recent timestamps
        hits = [
            timestamp
            for timestamp in hits
            if now - timestamp <= window
        ]

        bucket[key] = hits

        return len(hits)

    # =====================================================
    # FLUSH LOOP
    # =====================================================

    async def _flush_loop(self) -> None:
        """
        Every second:

        1. Find flows inactive for the configured timeout.
        2. Remove them from active flows.
        3. Convert them into PredictionRequest.
        4. Run the existing ML prediction.
        5. Store packet information.
        """

        print(
            "[NetShield AI] "
            "Flow flush loop running."
        )

        try:

            # ---------------------------------------------
            # Import lazily
            # ---------------------------------------------

            from app.routers.predict_router import (
                predict as run_prediction
            )

            from app.models import PredictionRequest

            from app.database import packets_collection

        except Exception as exc:

            self._error = (
                f"Could not initialize flow processor: {exc}"
            )

            print(
                "[NetShield AI] ERROR:",
                self._error,
            )

            return

        # ---------------------------------------------
        # Continuous loop
        # ---------------------------------------------

        while self._running:

            try:

                # Check once every second
                await asyncio.sleep(1.0)

                now = time.time()

                ready: list[_Flow] = []

                timeout = float(
                    settings.capture_flow_timeout_seconds
                )

                # -------------------------------------
                # Find inactive flows
                # -------------------------------------

                with self._lock:

                    for key in list(self._flows.keys()):

                        flow = self._flows[key]

                        idle_time = (
                            now - flow.last_seen
                        )

                        if idle_time >= timeout:

                            ready.append(
                                self._flows.pop(key)
                            )

                # -------------------------------------
                # No completed flows
                # -------------------------------------

                if not ready:
                    continue

                print(
                    f"[NetShield AI] "
                    f"Processing {len(ready)} completed flow(s)"
                )

                # -------------------------------------
                # Process every completed flow
                # -------------------------------------

                for flow in ready:

                    try:

                        duration = max(
                            flow.last_seen
                            - flow.first_seen,
                            0.001,
                        )

                        flow_rate = (
                            flow.total_bytes
                            / duration
                        )

                        count = self._recent_count(
                            self._recent_host_hits,
                            flow.destination_ip,
                        )

                        srv_count = self._recent_count(
                            self._recent_srv_hits,
                            (
                                flow.destination_ip,
                                flow.destination_port,
                            ),
                        )

                        # ---------------------------------
                        # Create prediction request
                        # ---------------------------------

                        payload = PredictionRequest(

                            duration=round(
                                duration,
                                3,
                            ),

                            protocol_type=(
                                flow.protocol
                                if flow.protocol
                                in (
                                    "tcp",
                                    "udp",
                                    "icmp",
                                )
                                else "tcp"
                            ),

                            src_bytes=float(
                                flow.total_bytes
                            ),

                            dst_bytes=0.0,

                            packet_count=(
                                flow.packet_count
                            ),

                            flow_rate=round(
                                flow_rate,
                                2,
                            ),

                            wrong_fragment=(
                                flow.wrong_fragment
                            ),

                            urgent=(
                                flow.urgent
                            ),

                            count=max(
                                count,
                                1,
                            ),

                            srv_count=max(
                                srv_count,
                                1,
                            ),

                            source_ip=(
                                flow.source_ip
                            ),

                            destination_ip=(
                                flow.destination_ip
                            ),

                            source_port=(
                                flow.source_port
                            ),

                            destination_port=(
                                flow.destination_port
                            ),
                        )

                        print(
                            "[NetShield AI] "
                            "Sending flow to ML:"
                        )

                        print(
                            f"  {flow.source_ip}:"
                            f"{flow.source_port}"
                            f" -> "
                            f"{flow.destination_ip}:"
                            f"{flow.destination_port}"
                        )

                        print(
                            f"  Protocol: "
                            f"{flow.protocol}"
                        )

                        print(
                            f"  Packets: "
                            f"{flow.packet_count}"
                        )

                        print(
                            f"  Bytes: "
                            f"{flow.total_bytes}"
                        )

                        print(
                            f"  Duration: "
                            f"{duration:.3f}s"
                        )

                        print(
                            f"  Flow rate: "
                            f"{flow_rate:.2f}"
                        )

                        # ---------------------------------
                        # EXISTING ML PIPELINE
                        # ---------------------------------

                        result = await run_prediction(
                            payload,
                            current_user={
                                "username": "live-capture",
                                "role": "admin",
                            },
                        )

                        # ---------------------------------
                        # Determine status
                        # ---------------------------------

                        status = "normal"

                        if result.get("is_attack"):

                            threat_level = result.get(
                                "threat_level"
                            )

                            if threat_level in (
                                "Critical",
                                "High",
                            ):

                                status = "blocked"

                            else:

                                status = "suspicious"

                        # ---------------------------------
                        # Store live packet
                        # ---------------------------------

                        await packets_collection.insert_one(
                            {
                                "packet_id": result.get(
                                    "prediction_id",
                                    "PKT-LIVE",
                                ),

                                "source_ip": (
                                    flow.source_ip
                                ),

                                "destination_ip": (
                                    flow.destination_ip
                                ),

                                "protocol": (
                                    flow.protocol.upper()
                                ),

                                "source_port": (
                                    flow.source_port
                                ),

                                "destination_port": (
                                    flow.destination_port
                                ),

                                "packet_size": (
                                    flow.total_bytes
                                ),

                                "duration": round(
                                    duration,
                                    3,
                                ),

                                "flow_rate": round(
                                    flow_rate,
                                    2,
                                ),

                                "packet_count": (
                                    flow.packet_count
                                ),

                                "status": status,

                                "source": "live",

                                "timestamp": (
                                    datetime.utcnow()
                                ),
                            }
                        )

                        # ---------------------------------
                        # Success
                        # ---------------------------------

                        self.flows_processed += 1

                        print(
                            "[NetShield AI] "
                            f"Flow processed successfully. "
                            f"Total flows={self.flows_processed}"
                        )

                        print(
                            "[NetShield AI] "
                            "Prediction result:",
                            result,
                        )

                    except Exception as exc:

                        print(
                            "[NetShield AI] "
                            "Failed to process captured flow:"
                        )

                        print(
                            repr(exc)
                        )

            except asyncio.CancelledError:

                print(
                    "[NetShield AI] "
                    "Flow flush loop cancelled."
                )

                break

            except Exception as exc:

                print(
                    "[NetShield AI] "
                    "Flush loop error:",
                    repr(exc),
                )

                # Prevent a temporary error from killing
                # the entire monitoring system.
                await asyncio.sleep(1)

        print(
            "[NetShield AI] "
            "Flow flush loop stopped."
        )

    # =====================================================
    # STOP CAPTURE
    # =====================================================

    def stop(self) -> None:

        print(
            "🛑 Stop requested"
        )

        # ---------------------------------------------
        # Stop Scapy
        # ---------------------------------------------

        if self._sniffer is not None:

            try:

                self._sniffer.stop()

                print(
                    "✅ Sniffer stopped"
                )

            except Exception as exc:

                print(
                    "❌ Error stopping sniffer:",
                    exc,
                )

            finally:

                self._sniffer = None

        # ---------------------------------------------
        # Stop engine
        # ---------------------------------------------

        self._running = False

        # ---------------------------------------------
        # Cancel async flush task
        # ---------------------------------------------

        if self._flush_task is not None:

            try:

                self._flush_task.cancel()

            except Exception:
                pass

            self._flush_task = None

        # ---------------------------------------------
        # Clear active flows
        # ---------------------------------------------

        with self._lock:

            self._flows.clear()

        self._active_interface = None

        print(
            "✅ Monitoring fully stopped"
        )


# =========================================================
# GLOBAL ENGINE INSTANCE
# =========================================================

engine = CaptureEngine()
