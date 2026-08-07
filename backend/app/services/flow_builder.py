import logging
import threading
import time
from typing import Dict
from app.services.capture_service import CaptureService

logger = logging.getLogger("netshield.flowbuilder")


class Flow:
    def __init__(self, src_ip, dst_ip, src_port, dst_port, protocol, start_time, packet_len):
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.src_port = src_port
        self.dst_port = dst_port
        self.protocol = protocol

        self.start_time = start_time
        self.last_packet_time = start_time

        self.forward_packet_count = 1
        self.backward_packet_count = 0

        self.forward_bytes = packet_len
        self.backward_bytes = 0

    @property
    def flow_duration(self):
        return max(0.0, self.last_packet_time - self.start_time)

    @property
    def total_packets(self):
        return self.forward_packet_count + self.backward_packet_count

    @property
    def total_bytes(self):
        return self.forward_bytes + self.backward_bytes

    @property
    def average_packet_size(self):
        return self.total_bytes / self.total_packets if self.total_packets > 0 else 0

    def to_dict(self):
        return {
            "src_ip": self.src_ip,
            "dst_ip": self.dst_ip,
            "src_port": self.src_port,
            "dst_port": self.dst_port,
            "protocol": self.protocol,
            "start_time": self.start_time,
            "last_packet_time": self.last_packet_time,
            "flow_duration": self.flow_duration,
            "forward_packet_count": self.forward_packet_count,
            "backward_packet_count": self.backward_packet_count,
            "forward_bytes": self.forward_bytes,
            "backward_bytes": self.backward_bytes,
            "total_packets": self.total_packets,
            "total_bytes": self.total_bytes,
            "average_packet_size": round(self.average_packet_size, 2)
        }


class FlowBuilder:
    def __init__(self, timeout=60):
        self.active_flows: Dict[str, Flow] = {}
        self.timeout = timeout
        self.lock = threading.Lock()

        # Stats
        self.total_processed_packets = 0
        self.total_expired_flows = 0

        # Queue for expired flows
        import queue
        self.expired_flows_queue = queue.Queue()

        # Stop event for graceful shutdown
        self.stop_event = threading.Event()

        # Start cleanup thread
        self.cleanup_thread = threading.Thread(target=self._expire_flows_worker, daemon=True)
        self.cleanup_thread.start()

    def stop(self):
        self.stop_event.set()
        if self.cleanup_thread.is_alive():
            self.cleanup_thread.join(timeout=2.0)

    def get_flow_key(self, src_ip, src_port, dst_ip, dst_port, protocol):
        return f"{src_ip}:{src_port}-{dst_ip}:{dst_port}-{protocol}"

    def process_packet(self, packet):
        try:
            length = len(packet)
            timestamp = float(packet.time)

            src_ip = None
            dst_ip = None
            protocol = None

            if packet.haslayer('IP'):
                src_ip = packet['IP'].src
                dst_ip = packet['IP'].dst
                proto_num = packet['IP'].proto
                if proto_num == 6:
                    protocol = "TCP"
                elif proto_num == 17:
                    protocol = "UDP"
                elif proto_num == 1:
                    protocol = "ICMP"
                else:
                    protocol = f"IPv4({proto_num})"
            elif packet.haslayer('IPv6'):
                src_ip = packet['IPv6'].src
                dst_ip = packet['IPv6'].dst
                proto_num = packet['IPv6'].nh
                if proto_num == 6:
                    protocol = "TCP"
                elif proto_num == 17:
                    protocol = "UDP"
                elif proto_num == 58:
                    protocol = "ICMPv6"
                else:
                    protocol = f"IPv6({proto_num})"

            if not src_ip or not dst_ip:
                return  # Not IP traffic

            src_port = 0
            dst_port = 0

            if packet.haslayer('TCP'):
                src_port = packet['TCP'].sport
                dst_port = packet['TCP'].dport
                if protocol is None or protocol.startswith("IPv"):
                    protocol = "TCP"
            elif packet.haslayer('UDP'):
                src_port = packet['UDP'].sport
                dst_port = packet['UDP'].dport
                if protocol is None or protocol.startswith("IPv"):
                    protocol = "UDP"

            self._update_flow(src_ip, src_port, dst_ip, dst_port, protocol, timestamp, length)

        except Exception as e:
            logger.exception(f"Error in FlowBuilder processing packet: {e}")

    def _update_flow(self, src_ip, src_port, dst_ip, dst_port, protocol, timestamp, length):
        forward_key = self.get_flow_key(src_ip, src_port, dst_ip, dst_port, protocol)
        backward_key = self.get_flow_key(dst_ip, dst_port, src_ip, src_port, protocol)

        with self.lock:
            self.total_processed_packets += 1
            if forward_key in self.active_flows:
                flow = self.active_flows[forward_key]
                flow.last_packet_time = timestamp
                flow.forward_packet_count += 1
                flow.forward_bytes += length
            elif backward_key in self.active_flows:
                flow = self.active_flows[backward_key]
                flow.last_packet_time = timestamp
                flow.backward_packet_count += 1
                flow.backward_bytes += length
            else:
                self.active_flows[forward_key] = Flow(
                    src_ip=src_ip, dst_ip=dst_ip, src_port=src_port, dst_port=dst_port,
                    protocol=protocol, start_time=timestamp, packet_len=length
                )

    def _expire_flows_worker(self):
        logger.info("FlowBuilder cleanup thread started.")
        while not self.stop_event.is_set():
            try:
                # Use wait instead of sleep so we can abort immediately when stop_event is set
                self.stop_event.wait(10)
                if self.stop_event.is_set():
                    break

                now = time.time()
                with self.lock:
                    expired_keys = []
                    for key, flow in self.active_flows.items():
                        if now - flow.last_packet_time > self.timeout:
                            expired_keys.append(key)

                    for key in expired_keys:
                        flow = self.active_flows.pop(key)
                        self.total_expired_flows += 1
                        self.expired_flows_queue.put(flow)

            except Exception as e:
                logger.exception(f"Error in FlowBuilder cleanup thread: {e}")

    def get_active_flows(self):
        with self.lock:
            return [flow.to_dict() for flow in self.active_flows.values()]

    def get_statistics(self):
        with self.lock:
            return {
                "active_flows_count": len(self.active_flows),
                "total_processed_packets": self.total_processed_packets,
                "total_expired_flows": self.total_expired_flows
            }


flow_builder = FlowBuilder()

# --- Monkey-Patching CaptureService ---
# Hook into CaptureService without modifying capture_service.py directly
original_process_packet = CaptureService._process_packet


def patched_process_packet(self, packet):
    # Ensure original print behavior runs flawlessly
    original_process_packet(self, packet)
    # Forward to our new flow builder
    flow_builder.process_packet(packet)


CaptureService._process_packet = patched_process_packet
