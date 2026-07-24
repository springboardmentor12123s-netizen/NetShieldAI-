from dataclasses import dataclass, field
from typing import List
import time


@dataclass
class Flow:

    client_ip: str
    server_ip: str

    client_port: int
    server_port: int

    protocol: str

    start_time: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)

    forward_packets: int = 0
    backward_packets: int = 0

    forward_bytes: int = 0
    backward_bytes: int = 0

    forward_lengths: List[int] = field(default_factory=list)
    backward_lengths: List[int] = field(default_factory=list)

    forward_iat: List[float] = field(default_factory=list)
    backward_iat: List[float] = field(default_factory=list)

    flow_iat: List[float] = field(default_factory=list)

    last_packet_time: float = 0
    last_forward_time: float = 0
    last_backward_time: float = 0

    forward_header_lengths: List[int] = field(default_factory=list)
    backward_header_lengths: List[int] = field(default_factory=list)

    init_win_bytes_forward: int = 0
    init_win_bytes_backward: int = 0

    active_times: List[float] = field(default_factory=list)
    idle_times: List[float] = field(default_factory=list)

    last_activity: float = 0

    syn_count: int = 0
    ack_count: int = 0
    fin_count: int = 0
    rst_count: int = 0
    psh_count: int = 0
    urg_count: int = 0

    # -------- New --------

    act_data_pkt_fwd: int = 0

    min_seg_size_forward: int = 65535