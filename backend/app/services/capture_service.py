import logging
import threading
import sys
from scapy.all import sniff
from scapy.arch.windows import get_windows_if_list

logger = logging.getLogger("netshield.capture")


class CaptureService:
    def __init__(self):
        self.is_capturing = False
        self.capture_thread = None
        self.current_interface = None
        self.stop_event = threading.Event()
        self.error = None

    def get_interfaces(self):
        """Detect and list available interfaces on Windows."""
        interfaces = []
        try:
            if sys.platform.startswith('win'):
                win_ifaces = get_windows_if_list()
                for iface in win_ifaces:
                    name = iface.get('name', 'Unknown')
                    description = iface.get('description', '')
                    # Filter out loopback and mostly useless ones
                    if "Loopback" not in description and "Pseudo-Interface" not in description:
                        interfaces.append({
                            "id": name,
                            "name": description,
                            "guid": iface.get('guid', '')
                        })
            else:
                # Fallback for non-Windows
                from scapy.interfaces import get_working_ifaces
                for iface in get_working_ifaces():
                    interfaces.append({
                        "id": iface.name,
                        "name": iface.description if hasattr(iface, 'description') else iface.name,
                        "guid": iface.name
                    })
        except Exception as e:
            logger.error(f"Error listing interfaces: {e}")
            self.error = f"Failed to list interfaces: {e}"
        return interfaces

    def start_capture(self, interface_id: str):
        if self.is_capturing:
            raise ValueError("Capture is already running.")

        self.is_capturing = True
        self.stop_event.clear()
        self.current_interface = interface_id
        self.error = None

        self.capture_thread = threading.Thread(
            target=self._capture_worker,
            args=(interface_id,),
            daemon=True
        )
        self.capture_thread.start()

    def stop_capture(self):
        if not self.is_capturing:
            return

        self.is_capturing = False
        self.stop_event.set()
        if self.capture_thread:
            self.capture_thread.join(timeout=2.0)
            self.capture_thread = None
        self.current_interface = None

    def get_status(self):
        return {
            "is_capturing": self.is_capturing,
            "interface": self.current_interface,
            "error": self.error
        }

    def _capture_worker(self, interface_id):
        try:
            logger.info(f"Starting capture on interface: {interface_id}")
            sniff(
                iface=interface_id,
                prn=self._process_packet,
                store=False,
                stop_filter=lambda p: self.stop_event.is_set()
            )
        except PermissionError:
            self.error = "Permission denied. Please run as Administrator or install Npcap with appropriate permissions."
            logger.error(self.error)
        except OSError as e:
            self.error = f"Interface disconnected or OS error: {e}"
            logger.error(self.error)
        except Exception as e:
            self.error = f"Unexpected error during capture: {e}"
            logger.error(self.error)
        finally:
            self.is_capturing = False
            self.stop_event.set()
            logger.info("Capture stopped.")

    def _process_packet(self, packet):
        try:
            from datetime import datetime
            timestamp = datetime.fromtimestamp(float(packet.time)).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

            src_ip = "N/A"
            dst_ip = "N/A"
            src_port = "N/A"
            dst_port = "N/A"
            protocol = "N/A"
            length = len(packet)

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

            if packet.haslayer('TCP'):
                src_port = packet['TCP'].sport
                dst_port = packet['TCP'].dport
                if protocol == "N/A":
                    protocol = "TCP"
            elif packet.haslayer('UDP'):
                src_port = packet['UDP'].sport
                dst_port = packet['UDP'].dport
                if protocol == "N/A":
                    protocol = "UDP"

            logger.debug(
                f"[{timestamp}] {src_ip}:{src_port} -> {dst_ip}:{dst_port} | Proto: {protocol} | Len: {length}"
            )

        except Exception as e:
            # Handle malformed packets safely
            logger.error(f"Error processing packet: {e}")


capture_service = CaptureService()
