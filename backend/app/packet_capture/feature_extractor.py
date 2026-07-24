import statistics


def mean(v):
    return statistics.mean(v) if v else 0


def std(v):
    return statistics.stdev(v) if len(v) > 1 else 0


def minimum(v):
    return min(v) if v else 0


def maximum(v):
    return max(v) if v else 0


def extract_features(flow):

    duration = max(flow.last_seen - flow.start_time, 0.000001)

    total_packets = (
        flow.forward_packets +
        flow.backward_packets
    )

    total_bytes = (
        flow.forward_bytes +
        flow.backward_bytes
    )

    all_lengths = (
        flow.forward_lengths +
        flow.backward_lengths
    )

    return {

        # ===========================
        # Flow Features
        # ===========================

        "Destination Port": flow.server_port,

        "Flow Duration": duration,

        "Flow Bytes/s": total_bytes / duration,

        "Flow Packets/s": total_packets / duration,

        # ===========================
        # Forward Features
        # ===========================

        "Total Fwd Packets": flow.forward_packets,

        "Total Length of Fwd Packets": flow.forward_bytes,

        "Fwd Packet Length Max": maximum(flow.forward_lengths),

        "Fwd Packet Length Min": minimum(flow.forward_lengths),

        "Fwd Packet Length Mean": mean(flow.forward_lengths),

        "Fwd Packet Length Std": std(flow.forward_lengths),

        "Fwd IAT Total": sum(flow.forward_iat),

        "Fwd IAT Mean": mean(flow.forward_iat),

        "Fwd IAT Std": std(flow.forward_iat),

        "Fwd IAT Max": maximum(flow.forward_iat),

        "Fwd IAT Min": minimum(flow.forward_iat),

        "Fwd Header Length": sum(flow.forward_header_lengths),

        "Fwd Header Length.1": sum(flow.forward_header_lengths),

        "Fwd Packets/s": flow.forward_packets / duration,

        "Fwd PSH Flags": flow.psh_count,

        "Fwd URG Flags": flow.urg_count,

        "Avg Fwd Segment Size": mean(flow.forward_lengths),

        # ===========================
        # Backward Features
        # ===========================

        "Total Backward Packets": flow.backward_packets,

        "Total Length of Bwd Packets": flow.backward_bytes,

        "Bwd Packet Length Max": maximum(flow.backward_lengths),

        "Bwd Packet Length Min": minimum(flow.backward_lengths),

        "Bwd Packet Length Mean": mean(flow.backward_lengths),

        "Bwd Packet Length Std": std(flow.backward_lengths),

        "Bwd IAT Total": sum(flow.backward_iat),

        "Bwd IAT Mean": mean(flow.backward_iat),

        "Bwd IAT Std": std(flow.backward_iat),

        "Bwd IAT Max": maximum(flow.backward_iat),

        "Bwd IAT Min": minimum(flow.backward_iat),

        "Bwd Header Length": sum(flow.backward_header_lengths),

        "Bwd Packets/s": flow.backward_packets / duration,

        "Bwd PSH Flags": flow.psh_count,

        "Bwd URG Flags": flow.urg_count,

        "Avg Bwd Segment Size": mean(flow.backward_lengths),

        # ===========================
        # Flow IAT
        # ===========================

        "Flow IAT Mean": mean(flow.flow_iat),

        "Flow IAT Std": std(flow.flow_iat),

        "Flow IAT Max": maximum(flow.flow_iat),

        "Flow IAT Min": minimum(flow.flow_iat),

        # ===========================
        # Packet Statistics
        # ===========================

        "Min Packet Length": minimum(all_lengths),

        "Max Packet Length": maximum(all_lengths),

        "Packet Length Mean": mean(all_lengths),

        "Packet Length Std": std(all_lengths),

        "Packet Length Variance":
            std(all_lengths) ** 2 if len(all_lengths) > 1 else 0,

        "Average Packet Size": mean(all_lengths),

        # ===========================
        # Header / Window
        # ===========================

        "Init_Win_bytes_forward":
            flow.init_win_bytes_forward,

        "Init_Win_bytes_backward":
            flow.init_win_bytes_backward,

        # ===========================
        # Active / Idle
        # ===========================

        "Active Mean": mean(flow.active_times),

        "Active Std": std(flow.active_times),

        "Active Max": maximum(flow.active_times),

        "Active Min": minimum(flow.active_times),

        "Idle Mean": mean(flow.idle_times),

        "Idle Std": std(flow.idle_times),

        "Idle Max": maximum(flow.idle_times),

        "Idle Min": minimum(flow.idle_times),

        # ===========================
        # Derived Features
        # ===========================

        "Subflow Fwd Packets":
            flow.forward_packets,

        "Subflow Bwd Packets":
            flow.backward_packets,

        "Subflow Fwd Bytes":
            flow.forward_bytes,

        "Subflow Bwd Bytes":
            flow.backward_bytes,

        "Down/Up Ratio":
            flow.backward_packets / max(flow.forward_packets, 1),

        "act_data_pkt_fwd":
            flow.act_data_pkt_fwd,

        "min_seg_size_forward":
            0 if flow.min_seg_size_forward == 65535
            else flow.min_seg_size_forward,

        # ===========================
        # TCP Flags
        # ===========================

        "FIN Flag Count": flow.fin_count,

        "SYN Flag Count": flow.syn_count,

        "RST Flag Count": flow.rst_count,

        "PSH Flag Count": flow.psh_count,

        "ACK Flag Count": flow.ack_count,

        "URG Flag Count": flow.urg_count,

        "CWE Flag Count": 0,

        "ECE Flag Count": 0,

        # ===========================
        # Bulk Features
        # (To be implemented later)
        # ===========================

        "Fwd Avg Bytes/Bulk": 0,

        "Fwd Avg Packets/Bulk": 0,

        "Fwd Avg Bulk Rate": 0,

        "Bwd Avg Bytes/Bulk": 0,

        "Bwd Avg Packets/Bulk": 0,

        "Bwd Avg Bulk Rate": 0,
    }