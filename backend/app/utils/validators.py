"""NetShield AI - Shared Validation Utilities."""

import re
import socket
from typing import Optional

# Regular expression to match IPv4 addresses
IP_V4_REGEX = re.compile(
    r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
)


def validate_ip_address(ip: str) -> bool:
    """Validate standard IPv4 address formatting."""
    if not ip:
        return False
    return bool(IP_V4_REGEX.match(ip))


def validate_port_number(port: int) -> bool:
    """Validate TCP/UDP networking port ranges (0-65535)."""
    return 0 <= port <= 65535


def validate_network_protocol(protocol: str) -> bool:
    """Validate supported NetShield AI transmission protocol types."""
    return protocol.upper() in ["TCP", "UDP", "ICMP", "HTTP", "HTTPS", "DNS", "SSH"]
