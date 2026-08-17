import re
from collections import defaultdict
from statistics import mean, pstdev


# ============================================================
# ACTIVE FLOW STORAGE
# ============================================================

flows = defaultdict(lambda: {

    "start_time": None,
    "last_time": None,

    "forward_lengths": [],
    "backward_lengths": [],

    "forward_times": [],
    "backward_times": [],

    "tcp_flags": {
        "FIN": 0,
        "SYN": 0,
        "RST": 0,
        "PSH": 0,
        "ACK": 0,
        "URG": 0,
        "CWE": 0,
        "ECE": 0,
    },

    # Direction-specific flags
    "fwd_psh": 0,
    "bwd_psh": 0,
    "fwd_urg": 0,
    "bwd_urg": 0,

    # Header lengths
    "fwd_header_length": 0,
    "bwd_header_length": 0,

    # Initial TCP windows
    "init_fwd_win": None,
    "init_bwd_win": None,

    # Active / idle periods
    "active_periods": [],
    "idle_periods": [],

    # ========================================================
    # HTTP INFORMATION
    # ========================================================

    "http_method": "",
    "http_uri": "",
    "http_host": "",
    "http_user_agent": "",
    "http_payload": "",
})


# ============================================================
# FLOW KEY
# ============================================================

def get_flow_key(packet):
    """Create a bidirectional flow key."""

    if not hasattr(packet, "ip"):
        return None

    src = packet.ip.src
    dst = packet.ip.dst

    if hasattr(packet, "tcp"):

        protocol = "TCP"

        src_port = int(
            packet.tcp.srcport
        )

        dst_port = int(
            packet.tcp.dstport
        )

    elif hasattr(packet, "udp"):

        protocol = "UDP"

        src_port = int(
            packet.udp.srcport
        )

        dst_port = int(
            packet.udp.dstport
        )

    else:

        protocol = str(
            packet.ip.proto
        )

        src_port = 0
        dst_port = 0

    endpoints = sorted([
        (src, src_port),
        (dst, dst_port)
    ])

    return (
        endpoints[0][0],
        endpoints[0][1],
        endpoints[1][0],
        endpoints[1][1],
        protocol
    )


# ============================================================
# PACKET HELPERS
# ============================================================

def _packet_length(packet):

    try:

        return int(
            packet.length
        )

    except Exception:

        return 0


def _packet_time(packet):

    try:

        return float(
            packet.sniff_timestamp
        )

    except Exception:

        return 0.0


def _get_flags(packet):

    flags = []

    if not hasattr(
        packet,
        "tcp"
    ):

        return flags

    try:

        raw_flags = int(
            packet.tcp.flags,
            16
        )

    except Exception:

        return flags

    if raw_flags & 0x01:
        flags.append("FIN")

    if raw_flags & 0x02:
        flags.append("SYN")

    if raw_flags & 0x04:
        flags.append("RST")

    if raw_flags & 0x08:
        flags.append("PSH")

    if raw_flags & 0x10:
        flags.append("ACK")

    if raw_flags & 0x20:
        flags.append("URG")

    if raw_flags & 0x40:
        flags.append("ECE")

    if raw_flags & 0x80:
        flags.append("CWE")

    return flags


def _header_length(packet):
    """
    Approximate CICIDS-style header length using
    IP + TCP/UDP header lengths when available.
    """

    total = 0

    try:

        total += int(
            packet.ip.hdr_len
        )

    except Exception:

        pass

    try:

        if hasattr(
            packet,
            "tcp"
        ):

            total += int(
                packet.tcp.hdr_len
            )

        elif hasattr(
            packet,
            "udp"
        ):

            total += int(
                packet.udp.length
            )

    except Exception:

        pass

    return total


def _tcp_window(packet):

    try:

        if hasattr(
            packet,
            "tcp"
        ):

            return int(
                packet.tcp.window_size_value
            )

    except Exception:

        pass

    try:

        if hasattr(
            packet,
            "tcp"
        ):

            return int(
                packet.tcp.window_size
            )

    except Exception:

        pass

    return 0


# ============================================================
# RAW TCP PAYLOAD HELPER
# ============================================================

def _get_tcp_payload_text(packet):
    """
    Recover application data directly from TCP when PyShark's HTTP
    layer does not expose file_data/request body fields.
    """
    try:
        if not hasattr(packet, "tcp"):
            return ""

        if not hasattr(packet.tcp, "payload"):
            return ""

        raw = str(packet.tcp.payload)

        if not raw:
            return ""

        raw = raw.replace(":", "").replace(" ", "")

        data = bytes.fromhex(raw)

        return data.decode(
            "utf-8",
            errors="replace"
        )

    except Exception:
        return ""


# ============================================================
# HTTP INFORMATION EXTRACTION
# ============================================================

def _extract_http_information(
    packet,
    flow
):
    """
    Extract HTTP request information using both:
      1. TShark's decoded HTTP layer.
      2. Raw TCP payload fallback.

    The fallback is important for POST bodies such as:
        {"input":"<script>alert(1)</script>"}
    """

    try:

        http = getattr(packet, "http", None)

        # --------------------------------------------------------
        # TSHARK HTTP FIELDS
        # --------------------------------------------------------

        if http is not None:

            if hasattr(http, "request_method"):
                value = str(http.request_method)
                if value:
                    flow["http_method"] = value

            if hasattr(http, "request_uri"):
                value = str(http.request_uri)
                if value:
                    flow["http_uri"] = value

            if hasattr(http, "host"):
                value = str(http.host)
                if value:
                    flow["http_host"] = value

            if hasattr(http, "user_agent"):
                value = str(http.user_agent)
                if value:
                    flow["http_user_agent"] = value

            payload_parts = []

            for field_name in (
                "request_uri_query",
                "request_full_uri",
                "file_data",
                "request_line",
            ):
                try:
                    if hasattr(http, field_name):
                        value = str(getattr(http, field_name))
                        if value:
                            payload_parts.append(value)
                except Exception:
                    pass

            if payload_parts:
                current = flow.get("http_payload", "")
                combined = " ".join(payload_parts)

                if combined not in current:
                    flow["http_payload"] = (
                        current + " " + combined
                    ).strip()

        # --------------------------------------------------------
        # RAW TCP FALLBACK
        # --------------------------------------------------------

        raw_text = _get_tcp_payload_text(packet)

        if raw_text:

            # Save a bounded amount so the flow dictionary cannot grow
            # indefinitely during long captures.
            current_raw = flow.get(
                "http_payload",
                ""
            )

            if raw_text not in current_raw:
                flow["http_payload"] = (
                    current_raw + " " + raw_text
                )[-8000:].strip()

            # Recover HTTP request line if TShark did not expose it.
            request_match = re.search(
                r"(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+([^\s]+)\s+HTTP/",
                raw_text,
                re.IGNORECASE
            )

            if request_match:

                if not flow.get("http_method"):
                    flow["http_method"] = (
                        request_match.group(1).upper()
                    )

                if not flow.get("http_uri"):
                    flow["http_uri"] = (
                        request_match.group(2)
                    )

            # Recover Host header.
            host_match = re.search(
                r"\r?\nHost:\s*([^\r\n]+)",
                raw_text,
                re.IGNORECASE
            )

            if host_match and not flow.get("http_host"):
                flow["http_host"] = (
                    host_match.group(1).strip()
                )

            # Recover User-Agent.
            ua_match = re.search(
                r"\r?\nUser-Agent:\s*([^\r\n]+)",
                raw_text,
                re.IGNORECASE
            )

            if ua_match and not flow.get("http_user_agent"):
                flow["http_user_agent"] = (
                    ua_match.group(1).strip()
                )

            # For POST/PUT/PATCH, everything after the HTTP header
            # separator is application data.
            if "\r\n\r\n" in raw_text:
                body = raw_text.split(
                    "\r\n\r\n",
                    1
                )[1]

                if body:
                    current = flow.get(
                        "http_payload",
                        ""
                    )

                    if body not in current:
                        flow["http_payload"] = (
                            current + " " + body
                        )[-8000:].strip()

        # --------------------------------------------------------
        # DEBUG
        # --------------------------------------------------------

        if (
            flow.get("http_method")
            or flow.get("http_uri")
            or flow.get("http_payload")
        ):
            print(
                "\n========== HTTP PACKET DETECTED =========="
            )

            print(
                "Method  :",
                flow.get("http_method", "")
            )

            print(
                "URI     :",
                flow.get("http_uri", "")
            )

            print(
                "Host    :",
                flow.get("http_host", "")
            )

            print(
                "Payload :",
                flow.get("http_payload", "")[:1000]
            )

            print(
                "=========================================="
            )

    except Exception as e:

        print(
            "HTTP extraction error:",
            e
        )


# ============================================================
# PACKET EXTRACTION
# ============================================================

def extract_features(
    packet,
    feature_columns
):

    if not hasattr(
        packet,
        "ip"
    ):

        return {
            feature: 0
            for feature in feature_columns
        }


    key = get_flow_key(
        packet
    )


    if key is None:

        return {
            feature: 0
            for feature in feature_columns
        }


    src = packet.ip.src
    dst = packet.ip.dst

    timestamp = _packet_time(
        packet
    )

    length = _packet_length(
        packet
    )

    flow = flows[key]


    # ========================================================
    # HTTP INFORMATION
    # ========================================================

    _extract_http_information(
        packet,
        flow
    )


    # ========================================================
    # PROTOCOL
    # ========================================================

    if hasattr(
        packet,
        "tcp"
    ):

        flow["protocol"] = "TCP"

        flow["protocol_number"] = 6


    elif hasattr(
        packet,
        "udp"
    ):

        flow["protocol"] = "UDP"

        flow["protocol_number"] = 17


    else:

        flow["protocol"] = "IP"

        try:

            flow["protocol_number"] = int(
                packet.ip.proto
            )

        except Exception:

            flow["protocol_number"] = 0


    # ========================================================
    # SOURCE / DESTINATION
    # ========================================================

    flow["last_source"] = src

    flow["last_destination"] = dst

    flow["protocol"] = flow.get(
        "protocol",
        "IP"
    )


    # ========================================================
    # FLOW TIMING
    # ========================================================

    if flow["start_time"] is None:

        flow["start_time"] = timestamp


    previous_time = flow["last_time"]

    flow["last_time"] = timestamp


    # ========================================================
    # DIRECTION
    # ========================================================

    first_src = key[0]

    first_src_port = key[1]


    if hasattr(
        packet,
        "tcp"
    ):

        src_port = int(
            packet.tcp.srcport
        )


    elif hasattr(
        packet,
        "udp"
    ):

        src_port = int(
            packet.udp.srcport
        )


    else:

        src_port = 0


    forward = (

        src == first_src

        and

        src_port == first_src_port

    )


    # ========================================================
    # PACKET INFORMATION
    # ========================================================

    if forward:

        flow[
            "forward_lengths"
        ].append(
            length
        )

        flow[
            "forward_times"
        ].append(
            timestamp
        )


        # Header length

        flow[
            "fwd_header_length"
        ] += _header_length(
            packet
        )


        # Initial TCP window

        if (

            flow[
                "init_fwd_win"
            ] is None

            and

            hasattr(
                packet,
                "tcp"
            )

        ):

            flow[
                "init_fwd_win"
            ] = _tcp_window(
                packet
            )


    else:

        flow[
            "backward_lengths"
        ].append(
            length
        )

        flow[
            "backward_times"
        ].append(
            timestamp
        )


        flow[
            "bwd_header_length"
        ] += _header_length(
            packet
        )


        if (

            flow[
                "init_bwd_win"
            ] is None

            and

            hasattr(
                packet,
                "tcp"
            )

        ):

            flow[
                "init_bwd_win"
            ] = _tcp_window(
                packet
            )


    # ========================================================
    # ACTIVE / IDLE TIMING
    # ========================================================

    if previous_time is not None:

        gap = (
            timestamp
            -
            previous_time
        )


        # CICFlowMeter-style threshold:
        # gaps >= 1 second are idle.

        if gap >= 1.0:

            flow[
                "idle_periods"
            ].append(

                gap
                *
                1_000_000

            )

        else:

            flow[
                "active_periods"
            ].append(

                gap
                *
                1_000_000

            )


    # ========================================================
    # TCP FLAGS
    # ========================================================

    flags = _get_flags(
        packet
    )


    for flag in flags:

        flow[
            "tcp_flags"
        ][flag] += 1


    if "PSH" in flags:

        if forward:

            flow[
                "fwd_psh"
            ] += 1

        else:

            flow[
                "bwd_psh"
            ] += 1


    if "URG" in flags:

        if forward:

            flow[
                "fwd_urg"
            ] += 1

        else:

            flow[
                "bwd_urg"
            ] += 1


    return {
        feature: 0
        for feature in feature_columns
    }


# ============================================================
# FLOW SNAPSHOT
# ============================================================

def get_flow_snapshot(
    flow_key,
    feature_columns
):
    """
    Build the final 77-feature vector
    from an accumulated flow.
    """

    if flow_key not in flows:

        return {
            feature: 0
            for feature in feature_columns
        }


    flow = flows[
        flow_key
    ]


    fwd = flow[
        "forward_lengths"
    ]

    bwd = flow[
        "backward_lengths"
    ]


    all_lengths = (
        fwd + bwd
    )


    total_fwd = len(fwd)

    total_bwd = len(bwd)

    total_packets = len(
        all_lengths
    )


    # ========================================================
    # HELPERS
    # ========================================================

    def avg(values):

        return (
            mean(values)
            if values
            else 0
        )


    def std(values):

        return (
            pstdev(values)
            if len(values) > 1
            else 0
        )


    def minimum(values):

        return (
            min(values)
            if values
            else 0
        )


    def maximum(values):

        return (
            max(values)
            if values
            else 0
        )


    # ========================================================
    # TIME
    # ========================================================

    duration_seconds = max(

        flow["last_time"]
        -
        flow["start_time"],

        0

    )


    duration = (
        duration_seconds
        *
        1_000_000
    )


    # ========================================================
    # INTER-ARRIVAL TIMES
    # ========================================================

    all_times = sorted(

        flow[
            "forward_times"
        ]
        +
        flow[
            "backward_times"
        ]

    )


    iats = [

        (
            all_times[i]
            -
            all_times[i - 1]
        )
        *
        1_000_000

        for i in range(
            1,
            len(all_times)
        )

    ]


    fwd_iats = [

        (
            flow[
                "forward_times"
            ][i]

            -

            flow[
                "forward_times"
            ][i - 1]

        )
        *
        1_000_000

        for i in range(
            1,
            len(
                flow[
                    "forward_times"
                ]
            )
        )

    ]


    bwd_iats = [

        (
            flow[
                "backward_times"
            ][i]

            -

            flow[
                "backward_times"
            ][i - 1]

        )
        *
        1_000_000

        for i in range(
            1,
            len(
                flow[
                    "backward_times"
                ]
            )
        )

    ]


    # ========================================================
    # INITIALIZE EXACTLY THE MODEL'S FEATURES
    # ========================================================

    features = {

        feature: 0

        for feature in feature_columns

    }


    # ========================================================
    # PROTOCOL
    # ========================================================

    features[
        "Protocol"
    ] = flow.get(
        "protocol_number",
        0
    )


    # ========================================================
    # BASIC FLOW INFORMATION
    # ========================================================

    features[
        "Flow Duration"
    ] = duration


    features[
        "Total Fwd Packets"
    ] = total_fwd


    features[
        "Total Backward Packets"
    ] = total_bwd


    features[
        "Fwd Packets Length Total"
    ] = sum(fwd)


    features[
        "Bwd Packets Length Total"
    ] = sum(bwd)


    # ========================================================
    # FORWARD PACKET STATISTICS
    # ========================================================

    features[
        "Fwd Packet Length Max"
    ] = maximum(fwd)


    features[
        "Fwd Packet Length Min"
    ] = minimum(fwd)


    features[
        "Fwd Packet Length Mean"
    ] = avg(fwd)


    features[
        "Fwd Packet Length Std"
    ] = std(fwd)


    # ========================================================
    # BACKWARD PACKET STATISTICS
    # ========================================================

    features[
        "Bwd Packet Length Max"
    ] = maximum(bwd)


    features[
        "Bwd Packet Length Min"
    ] = minimum(bwd)


    features[
        "Bwd Packet Length Mean"
    ] = avg(bwd)


    features[
        "Bwd Packet Length Std"
    ] = std(bwd)


    # ========================================================
    # FLOW RATES
    # ========================================================

    total_bytes = sum(
        all_lengths
    )


    if duration_seconds > 0:

        features[
            "Flow Bytes/s"
        ] = (

            total_bytes
            /
            duration_seconds

        )


        features[
            "Flow Packets/s"
        ] = (

            total_packets
            /
            duration_seconds

        )


        features[
            "Fwd Packets/s"
        ] = (

            total_fwd
            /
            duration_seconds

        )


        features[
            "Bwd Packets/s"
        ] = (

            total_bwd
            /
            duration_seconds

        )


    # ========================================================
    # FLOW IAT
    # ========================================================

    features[
        "Flow IAT Mean"
    ] = avg(iats)


    features[
        "Flow IAT Std"
    ] = std(iats)


    features[
        "Flow IAT Max"
    ] = maximum(iats)


    features[
        "Flow IAT Min"
    ] = minimum(iats)


    # ========================================================
    # FORWARD IAT
    # ========================================================

    features[
        "Fwd IAT Total"
    ] = sum(fwd_iats)


    features[
        "Fwd IAT Mean"
    ] = avg(fwd_iats)


    features[
        "Fwd IAT Std"
    ] = std(fwd_iats)


    features[
        "Fwd IAT Max"
    ] = maximum(fwd_iats)


    features[
        "Fwd IAT Min"
    ] = minimum(fwd_iats)


    # ========================================================
    # BACKWARD IAT
    # ========================================================

    features[
        "Bwd IAT Total"
    ] = sum(bwd_iats)


    features[
        "Bwd IAT Mean"
    ] = avg(bwd_iats)


    features[
        "Bwd IAT Std"
    ] = std(bwd_iats)


    features[
        "Bwd IAT Max"
    ] = maximum(bwd_iats)


    features[
        "Bwd IAT Min"
    ] = minimum(bwd_iats)


    # ========================================================
    # PACKET STATISTICS
    # ========================================================

    features[
        "Packet Length Min"
    ] = minimum(all_lengths)


    features[
        "Packet Length Max"
    ] = maximum(all_lengths)


    features[
        "Packet Length Mean"
    ] = avg(all_lengths)


    features[
        "Packet Length Std"
    ] = std(all_lengths)


    if all_lengths:

        packet_mean = avg(
            all_lengths
        )


        features[
            "Packet Length Variance"
        ] = avg([

            (
                x
                -
                packet_mean
            )
            ** 2

            for x
            in all_lengths

        ])


    # ========================================================
    # TCP FLAGS
    # ========================================================

    for flag, count in flow[
        "tcp_flags"
    ].items():

        feature_name = (
            f"{flag} Flag Count"
        )


        if feature_name in features:

            features[
                feature_name
            ] = count


    # Direction-specific flags

    features[
        "Fwd PSH Flags"
    ] = flow[
        "fwd_psh"
    ]


    features[
        "Bwd PSH Flags"
    ] = flow[
        "bwd_psh"
    ]


    features[
        "Fwd URG Flags"
    ] = flow[
        "fwd_urg"
    ]


    features[
        "Bwd URG Flags"
    ] = flow[
        "bwd_urg"
    ]


    # ========================================================
    # HEADER LENGTHS
    # ========================================================

    features[
        "Fwd Header Length"
    ] = flow[
        "fwd_header_length"
    ]


    features[
        "Bwd Header Length"
    ] = flow[
        "bwd_header_length"
    ]


    # ========================================================
    # RATIO
    # ========================================================

    if total_fwd > 0:

        features[
            "Down/Up Ratio"
        ] = (

            total_bwd
            /
            total_fwd

        )


    # ========================================================
    # AVERAGE PACKET SIZES
    # ========================================================

    features[
        "Avg Packet Size"
    ] = avg(all_lengths)


    features[
        "Avg Fwd Segment Size"
    ] = avg(fwd)


    features[
        "Avg Bwd Segment Size"
    ] = avg(bwd)


    # ========================================================
    # BULK FEATURES
    # ========================================================
    #
    # These remain zero because the current live extractor
    # does not have enough information to reproduce the
    # CICIDS bulk-flow algorithm exactly.
    #
    # ========================================================

    features[
        "Fwd Avg Bytes/Bulk"
    ] = 0


    features[
        "Fwd Avg Packets/Bulk"
    ] = 0


    features[
        "Fwd Avg Bulk Rate"
    ] = 0


    features[
        "Bwd Avg Bytes/Bulk"
    ] = 0


    features[
        "Bwd Avg Packets/Bulk"
    ] = 0


    features[
        "Bwd Avg Bulk Rate"
    ] = 0


    # ========================================================
    # SUBFLOW STATISTICS
    # ========================================================

    features[
        "Subflow Fwd Packets"
    ] = total_fwd


    features[
        "Subflow Fwd Bytes"
    ] = sum(fwd)


    features[
        "Subflow Bwd Packets"
    ] = total_bwd


    features[
        "Subflow Bwd Bytes"
    ] = sum(bwd)


    # ========================================================
    # TCP WINDOW SIZES
    # ========================================================

    features[
        "Init Fwd Win Bytes"
    ] = (

        flow[
            "init_fwd_win"
        ]

        if flow[
            "init_fwd_win"
        ] is not None

        else 0

    )


    features[
        "Init Bwd Win Bytes"
    ] = (

        flow[
            "init_bwd_win"
        ]

        if flow[
            "init_bwd_win"
        ] is not None

        else 0

    )


    # ========================================================
    # FORWARD ACTIVE DATA
    # ========================================================

    features[
        "Fwd Act Data Packets"
    ] = total_fwd


    features[
        "Fwd Seg Size Min"
    ] = minimum(fwd)


    # ========================================================
    # ACTIVE / IDLE STATISTICS
    # ========================================================

    active = flow[
        "active_periods"
    ]


    idle = flow[
        "idle_periods"
    ]


    features[
        "Active Mean"
    ] = avg(active)


    features[
        "Active Std"
    ] = std(active)


    features[
        "Active Max"
    ] = maximum(active)


    features[
        "Active Min"
    ] = minimum(active)


    features[
        "Idle Mean"
    ] = avg(idle)


    features[
        "Idle Std"
    ] = std(idle)


    features[
        "Idle Max"
    ] = maximum(idle)


    features[
        "Idle Min"
    ] = minimum(idle)


    return features