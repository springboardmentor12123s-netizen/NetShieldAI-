from scapy.layers.inet import IP, TCP, UDP
import time

from app.packet_capture.flow import Flow

flows = {}


def get_flow_key(packet):

    src = packet[IP].src
    dst = packet[IP].dst

    if TCP in packet:
        sport = packet[TCP].sport
        dport = packet[TCP].dport
        protocol = "TCP"

    elif UDP in packet:
        sport = packet[UDP].sport
        dport = packet[UDP].dport
        protocol = "UDP"

    else:
        sport = 0
        dport = 0
        protocol = "OTHER"

    if (src, sport) <= (dst, dport):
        return (src, dst, sport, dport, protocol)

    return (dst, src, dport, sport, protocol)


def update_flow(packet):

    key = get_flow_key(packet)

    if key not in flows:

        flows[key] = Flow(
            client_ip=key[0],
            server_ip=key[1],
            client_port=key[2],
            server_port=key[3],
            protocol=key[4],
        )

    flow = flows[key]

    now = time.time()

    # -----------------------------
    # Flow Timing
    # -----------------------------

    if flow.last_packet_time != 0:
        flow.flow_iat.append(now - flow.last_packet_time)

    flow.last_packet_time = now
    flow.last_seen = now

    if flow.last_activity != 0:

        gap = now - flow.last_activity

        if gap > 1:
            flow.idle_times.append(gap)
        else:
            flow.active_times.append(gap)

    flow.last_activity = now

    packet_size = len(packet)
    src = packet[IP].src

    # -----------------------------
    # Forward Direction
    # -----------------------------

    if src == flow.client_ip:

        flow.forward_packets += 1
        flow.forward_bytes += packet_size
        flow.forward_lengths.append(packet_size)

        if IP in packet:
            flow.forward_header_lengths.append(packet[IP].ihl * 4)

        if TCP in packet:

            if flow.init_win_bytes_forward == 0:
                flow.init_win_bytes_forward = packet[TCP].window

            payload = len(packet[TCP].payload)

            if payload > 0:
                flow.act_data_pkt_fwd += 1

            if packet[TCP].dataofs:
                seg = packet[TCP].dataofs * 4
                flow.min_seg_size_forward = min(
                    flow.min_seg_size_forward,
                    seg,
                )

        if flow.last_forward_time != 0:
            flow.forward_iat.append(
                now - flow.last_forward_time
            )

        flow.last_forward_time = now

    # -----------------------------
    # Backward Direction
    # -----------------------------

    else:

        flow.backward_packets += 1
        flow.backward_bytes += packet_size
        flow.backward_lengths.append(packet_size)

        if IP in packet:
            flow.backward_header_lengths.append(packet[IP].ihl * 4)

        if TCP in packet and flow.init_win_bytes_backward == 0:
            flow.init_win_bytes_backward = packet[TCP].window

        if flow.last_backward_time != 0:
            flow.backward_iat.append(
                now - flow.last_backward_time
            )

        flow.last_backward_time = now

    # -----------------------------
    # TCP Flags
    # -----------------------------

    if TCP in packet:

        flags = packet[TCP].flags

        if flags & 0x02:
            flow.syn_count += 1

        if flags & 0x10:
            flow.ack_count += 1

        if flags & 0x01:
            flow.fin_count += 1

        if flags & 0x04:
            flow.rst_count += 1

        if flags & 0x08:
            flow.psh_count += 1

        if flags & 0x20:
            flow.urg_count += 1

    return flow