import os
import re
import time
import threading
import joblib
import pandas as pd
import pyshark
import requests
import psutil

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

from app.ai.live_state import live_performance

from app.ai.packet_features import (
    extract_features,
    get_flow_snapshot,
    get_flow_key,
    flows
)

from app.ai.predictor import predict_attack


# ============================================================
# CONFIGURATION
# ============================================================

FLOW_TIMEOUT = int(
    os.getenv("LIVE_FLOW_TIMEOUT", "5")
)

TSHARK_PATH = os.getenv(
    "TSHARK_PATH",
    r"C:\Program Files\Wireshark\tshark.exe"
)

LIVE_INTERFACE = os.getenv(
    "LIVE_INTERFACE",
    r"\Device\NPF_Loopback"
)

API_BASE = os.getenv(
    "API_BASE",
    "http://127.0.0.1:8000"
)

CAPTURE_FILTER = os.getenv(
    "CAPTURE_FILTER",
    "tcp port 8000"
)


# ============================================================
# IGNORED INTERNAL NETSHIELD API PATHS
# ============================================================

IGNORED_API_PATHS = {
    "/traffic",
    "/traffic/",
    "/traffic/summary",
    "/traffic/packets",
    "/traffic/protocols",
    "/traffic/attacks",
    "/traffic/statistics",
    "/traffic/dashboard",
    "/traffic/unsw-summary",
    "/traffic/unsw-protocols",
    "/traffic/unsw-attacks",
    "/traffic/unsw-dashboard",
    "/traffic/live",
    "/traffic/live/update",
    "/traffic/live/performance",
    "/traffic/live/history",
    "/traffic/live/dashboard",
    "/traffic/alerts",
    "/traffic/alerts/latest",
    "/traffic/attack-trends",
    "/traffic/threat-report",
    "/ai/predict",
    "/ai/predict-dataset",
    "/ai/metrics",
    "/ai/intrusion-report",
    "/health",
    "/openapi.json",
    "/docs",
    "/redoc",
}


# ============================================================
# LOAD MODEL
# ============================================================

model = joblib.load(
    "app/ai/model.pkl"
)

label_encoder = joblib.load(
    "app/ai/label_encoder.pkl"
)

feature_columns = joblib.load(
    "app/ai/feature_columns.pkl"
)


print("\nModel loaded.")

print(
    "Model features:",
    len(feature_columns)
)

print(
    "Model classes:",
    list(label_encoder.classes_)
)


# ============================================================
# FIND MODEL LABELS
# ============================================================

def find_label(keyword):

    for label in label_encoder.classes_:

        if keyword.lower() in str(
            label
        ).lower():

            return label

    return None


BENIGN_LABEL = find_label(
    "Benign"
)

XSS_LABEL = find_label(
    "XSS"
)

SQL_LABEL = find_label(
    "Sql Injection"
)

BRUTE_LABEL = find_label(
    "Brute Force"
)


print(
    "Benign label:",
    BENIGN_LABEL
)

print(
    "XSS label:",
    XSS_LABEL
)

print(
    "SQL label:",
    SQL_LABEL
)

print(
    "Brute Force label:",
    BRUTE_LABEL
)


# ============================================================
# LIVE METRIC STORAGE
# ============================================================

y_true = []

y_pred = []

y_scores = []


# ============================================================
# COUNTERS
# ============================================================

total_packets = 0

total_flows = 0

total_test_flows = 0

correct_test_flows = 0


# ============================================================
# PERFORMANCE STORAGE
# ============================================================

feature_times = []

inference_times = []

api_times = []


process = psutil.Process(
    os.getpid()
)


# ============================================================
# APPLICATION-LAYER ATTACK DETECTION
# ============================================================

def detect_web_attack(flow):

    try:

        request_text = " ".join([

            str(
                flow.get(
                    "http_method",
                    ""
                )
            ),

            str(
                flow.get(
                    "http_uri",
                    ""
                )
            ),

            str(
                flow.get(
                    "http_host",
                    ""
                )
            ),

            str(
                flow.get(
                    "http_user_agent",
                    ""
                )
            ),

            str(
                flow.get(
                    "http_payload",
                    ""
                )
            )

        ])


        if not request_text.strip():

            return None


        # ====================================================
        # XSS
        # ====================================================

        xss_patterns = [

            r"<\s*script",

            r"</\s*script",

            r"javascript\s*:",

            r"onerror\s*=",

            r"onload\s*=",

            r"onclick\s*=",

            r"onmouseover\s*=",

            r"<\s*img",

            r"<\s*svg",

            r"alert\s*\(",

            r"prompt\s*\(",

            r"confirm\s*\(",

            r"%3c\s*script",

            r"%3Cscript"

        ]


        for pattern in xss_patterns:

            if re.search(
                pattern,
                request_text,
                re.IGNORECASE
            ):

                return XSS_LABEL


        # ====================================================
        # SQL INJECTION
        # ====================================================

        sql_patterns = [

            r"'\s*or\s*1\s*=\s*1",

            r"\bor\s+1\s*=\s*1",

            r"\band\s+1\s*=\s*1",

            r"union\s+select",

            r"select\s+.+\s+from",

            r"insert\s+into",

            r"drop\s+table",

            r"delete\s+from",

            r"update\s+.+\s+set",

            r"--\s*$",

            r"/\*.*\*/",

            r"%27\s*or",

            r"%27%20or"

        ]


        for pattern in sql_patterns:

            if re.search(
                pattern,
                request_text,
                re.IGNORECASE
            ):

                return SQL_LABEL


        # ====================================================
        # BRUTE FORCE
        # ====================================================

        # Controlled validation endpoint.
        # We intentionally use /brute-test for the test.
        # Normal login traffic is NOT automatically called
        # brute force by this rule.

        uri = str(
            flow.get(
                "http_uri",
                ""
            )
        ).lower()


        if (
            "/brute-test" in uri
        ):

            return BRUTE_LABEL


    except Exception as e:

        print(
            "Web attack detection error:",
            e
        )


    return None


# ============================================================
# IDENTIFY CONTROLLED TEST LABEL
# ============================================================

def identify_controlled_test(
    method,
    uri,
    payload
):

    text = (

        str(method)
        + " "
        + str(uri)
        + " "
        + str(payload)

    ).lower()


    # ========================================================
    # BENIGN
    # ========================================================

    if (
        "/benign-test" in text
    ):

        return BENIGN_LABEL


    # ========================================================
    # BRUTE FORCE
    # ========================================================

    if (
        "/brute-test" in text
    ):

        return BRUTE_LABEL


    # ========================================================
    # XSS
    # ========================================================

    xss_patterns = [

        "<script",

        "</script",

        "javascript:",

        "onerror=",

        "onload=",

        "onclick=",

        "<img",

        "<svg",

        "alert(",

        "prompt(",

        "confirm("

    ]


    for pattern in xss_patterns:

        if pattern in text:

            return XSS_LABEL


    # ========================================================
    # SQL
    # ========================================================

    sql_patterns = [

        "' or 1=1",

        "or 1=1",

        "and 1=1",

        "union select",

        "select ",

        "insert into",

        "drop table",

        "delete from",

        "--"

    ]


    for pattern in sql_patterns:

        if pattern in text:

            return SQL_LABEL


    return None


# ============================================================
# EXTRACT HTTP DATA FROM PACKET
# ============================================================

def get_http_packet_data(packet):

    method = ""

    uri = ""

    host = ""

    user_agent = ""

    payload = ""


    try:

        if not hasattr(
            packet,
            "http"
        ):

            return (
                method,
                uri,
                host,
                user_agent,
                payload
            )


        http = packet.http


        if hasattr(
            http,
            "request_method"
        ):

            method = str(
                http.request_method
            )


        if hasattr(
            http,
            "request_uri"
        ):

            uri = str(
                http.request_uri
            )


        if (
            not uri
            and
            hasattr(
                http,
                "request_full_uri"
            )
        ):

            uri = str(
                http.request_full_uri
            )


        if hasattr(
            http,
            "host"
        ):

            host = str(
                http.host
            )


        if hasattr(
            http,
            "user_agent"
        ):

            user_agent = str(
                http.user_agent
            )


        # ----------------------------------------------------
        # Try HTTP file data
        # ----------------------------------------------------

        if hasattr(
            http,
            "file_data"
        ):

            payload = str(
                http.file_data
            )


        # ----------------------------------------------------
        # Try request URI / raw packet
        # ----------------------------------------------------

        if not payload:

            try:

                raw = str(
                    packet
                )

                payload = raw

            except Exception:

                pass


    except Exception as e:

        print(
            "HTTP extraction error:",
            e
        )


    return (
        method,
        uri,
        host,
        user_agent,
        payload
    )


# ============================================================
# SAVE CONTROLLED LABEL INTO FLOW
# ============================================================

def attach_expected_label(packet):

    try:

        packet_flow_key = get_flow_key(packet)

        candidates = []

        if packet_flow_key in flows:
            candidates.append(
                (packet_flow_key, flows[packet_flow_key])
            )

        for key, flow in flows.items():

            if any(
                key == existing_key
                for existing_key, _ in candidates
            ):
                continue

            try:
                if (
                    len(key) == 5
                    and (
                        int(key[1]) == 8000
                        or int(key[3]) == 8000
                    )
                ):
                    candidates.append((key, flow))
            except Exception:
                continue

        for flow_key, flow in candidates:

            method = str(flow.get("http_method", ""))
            uri = str(flow.get("http_uri", ""))
            payload = str(flow.get("http_payload", ""))

            label = identify_controlled_test(
                method,
                uri,
                payload
            )

            if label is None and hasattr(packet, "http"):

                (
                    p_method,
                    p_uri,
                    p_host,
                    p_user_agent,
                    p_payload
                ) = get_http_packet_data(packet)

                label = identify_controlled_test(
                    p_method,
                    p_uri,
                    p_payload
                )

                if label is not None:
                    method = p_method or method
                    uri = p_uri or uri
                    payload = p_payload or payload

            if label is None:
                continue

            flow["expected_label"] = label

            print(
                "\n========== CONTROLLED TEST LABEL =========="
            )
            print("Flow Key       :", flow_key)
            print("Expected Label :", label)
            print("Method         :", method)
            print("URI            :", uri)
            print("============================================")

            return label

    except Exception as e:

        print(
            "Expected-label attachment error:",
            e
        )

    return None


# ============================================================
# ATTACH LABELS FROM ACTIVE FLOWS
# ============================================================

def attach_labels_from_active_flows():

    try:

        for flow_key, flow in list(flows.items()):

            if flow.get("expected_label"):
                continue

            method = str(flow.get("http_method", ""))
            uri = str(flow.get("http_uri", ""))
            payload = str(flow.get("http_payload", ""))

            label = identify_controlled_test(
                method,
                uri,
                payload
            )

            if label is not None:

                flow["expected_label"] = label

                print(
                    "\n========== CONTROLLED TEST LABEL =========="
                )
                print("Flow Key       :", flow_key)
                print("Expected Label :", label)
                print("Method         :", method)
                print("URI            :", uri)
                print("============================================")

    except Exception as e:

        print(
            "Active-flow label pass error:",
            e
        )


# ============================================================
# ROC-AUC
# ============================================================

def calculate_roc_auc():

    if len(
        y_true
    ) < 2:

        return None


    if len(
        set(y_true)
    ) < 2:

        return None


    if not y_scores:

        return None


    try:

        number_of_classes = len(
            label_encoder.classes_
        )


        # ====================================================
        # BINARY
        # ====================================================

        if number_of_classes == 2:

            scores = [

                score[1]

                for score in y_scores

            ]


            value = roc_auc_score(

                y_true,

                scores

            )


        # ====================================================
        # MULTICLASS
        # ====================================================

        else:

            value = roc_auc_score(

                y_true,

                y_scores,

                multi_class="ovr",

                average="macro",

                labels=list(
                    range(
                        number_of_classes
                    )
                )

            )


        return round(

            float(value) * 100,

            2

        )


    except Exception as e:

        print(
            "ROC-AUC error:",
            e
        )

        return None


# ============================================================
# CALCULATE LIVE METRICS
# ============================================================

def calculate_live_metrics():

    if not y_true:

        return


    labels = list(
        range(
            len(
                label_encoder.classes_
            )
        )
    )


    accuracy = accuracy_score(

        y_true,

        y_pred

    )


    precision = precision_score(

        y_true,

        y_pred,

        labels=labels,

        average="macro",

        zero_division=0

    )


    recall = recall_score(

        y_true,

        y_pred,

        labels=labels,

        average="macro",

        zero_division=0

    )


    f1 = f1_score(

        y_true,

        y_pred,

        labels=labels,

        average="macro",

        zero_division=0

    )


    live_roc_auc = (
        calculate_roc_auc()
    )


    live_performance.update({

        "live_accuracy":
            float(
                round(
                    accuracy * 100,
                    2
                )
            ),

        "live_precision_macro":
            float(
                round(
                    precision * 100,
                    2
                )
            ),

        "live_recall_macro":
            float(
                round(
                    recall * 100,
                    2
                )
            ),

        "live_f1_macro":
            float(
                round(
                    f1 * 100,
                    2
                )
            ),

        "live_roc_auc":
            live_roc_auc,

        "live_samples":
            int(
                len(y_true)
            ),

        "total_test_flows":
            int(
                total_test_flows
            ),

        "correct_test_flows":
            int(
                correct_test_flows
            )

    })


# ============================================================
# IGNORE INTERNAL NETSHIELD TRAFFIC
# ============================================================

def is_internal_netshield_packet(
    packet
):

    try:

        if not hasattr(
            packet,
            "http"
        ):

            return False


        uri = ""


        if hasattr(
            packet.http,
            "request_uri"
        ):

            uri = str(
                packet.http.request_uri
            )


        if (
            not uri
            and
            hasattr(
                packet.http,
                "request_full_uri"
            )
        ):

            uri = str(
                packet.http.request_full_uri
            )


        if not uri:

            return False


        path = (
            uri
            .split("?", 1)[0]
            .split("#", 1)[0]
        )


        if path in IGNORED_API_PATHS:

            return True


        if path.startswith(
            "/traffic/"
        ):

            return True


        if path.startswith(
            "/ai/"
        ):

            return True


        return False


    except Exception:

        return False


# ============================================================
# PERFORMANCE UPDATE
# ============================================================

def send_live_performance():

    try:

        feature_latency = (

            sum(feature_times)
            /
            len(feature_times)

            if feature_times

            else 0

        )


        inference_latency = (

            sum(inference_times)
            /
            len(inference_times)

            if inference_times

            else 0

        )


        api_latency = (

            sum(api_times)
            /
            len(api_times)

            if api_times

            else 0

        )


        cpu_usage = process.cpu_percent(
            interval=0.1
        )


        ram_usage = (

            process.memory_info().rss
            /
            (1024 * 1024)

        )


        calculate_live_metrics()


        live_performance.update({

            "packets_processed":
                int(total_packets),

            "flows_processed":
                int(total_flows),

            "feature_extraction_latency_ms":
                float(
                    round(
                        feature_latency,
                        3
                    )
                ),

            "ai_inference_latency_ms":
                float(
                    round(
                        inference_latency,
                        3
                    )
                ),

            "api_response_time_ms":
                float(
                    round(
                        api_latency,
                        3
                    )
                ),

            "cpu_usage_percent":
                float(
                    round(
                        cpu_usage,
                        2
                    )
                ),

            "ram_usage_mb":
                float(
                    round(
                        ram_usage,
                        2
                    )
                )

        })


        payload = {

            "live_accuracy":
                float(
                    live_performance.get(
                        "live_accuracy",
                        0
                    )
                ),

            "live_precision_macro":
                float(
                    live_performance.get(
                        "live_precision_macro",
                        0
                    )
                ),

            "live_recall_macro":
                float(
                    live_performance.get(
                        "live_recall_macro",
                        0
                    )
                ),

            "live_f1_macro":
                float(
                    live_performance.get(
                        "live_f1_macro",
                        0
                    )
                ),

            "live_roc_auc": (

                None

                if live_performance.get(
                    "live_roc_auc"
                ) is None

                else float(
                    live_performance[
                        "live_roc_auc"
                    ]
                )

            ),

            "live_samples":
                int(
                    live_performance.get(
                        "live_samples",
                        0
                    )
                ),

            "total_test_flows":
                int(
                    live_performance.get(
                        "total_test_flows",
                        0
                    )
                ),

            "correct_test_flows":
                int(
                    live_performance.get(
                        "correct_test_flows",
                        0
                    )
                ),

            "packets_processed":
                int(total_packets),

            "flows_processed":
                int(total_flows),

            "feature_extraction_latency_ms":
                float(
                    live_performance.get(
                        "feature_extraction_latency_ms",
                        0
                    )
                ),

            "ai_inference_latency_ms":
                float(
                    live_performance.get(
                        "ai_inference_latency_ms",
                        0
                    )
                ),

            "api_response_time_ms":
                float(
                    live_performance.get(
                        "api_response_time_ms",
                        0
                    )
                ),

            "cpu_usage_percent":
                float(
                    live_performance.get(
                        "cpu_usage_percent",
                        0
                    )
                ),

            "ram_usage_mb":
                float(
                    live_performance.get(
                        "ram_usage_mb",
                        0
                    )
                )

        }


        start = time.perf_counter()


        response = requests.post(

            f"{API_BASE}/traffic/live/performance",

            json=payload,

            timeout=2

        )


        end = time.perf_counter()


        api_times.append(

            (end - start)
            * 1000

        )


        if response.status_code != 200:

            print(
                "Performance API returned:",
                response.status_code
            )


    except Exception as e:

        print(
            "Performance update error:",
            e
        )


# ============================================================
# PROCESS FLOW
# ============================================================

def process_flow(
    flow_key,
    flow
):

    global total_flows

    global total_test_flows

    global correct_test_flows


    total_flows += 1


    try:

        # ====================================================
        # EXPECTED LABEL STORED IN FLOW
        # ====================================================

        expected_label = flow.get(
            "expected_label"
        )


        # ====================================================
        # FEATURE EXTRACTION
        # ====================================================

        start = time.perf_counter()


        features = get_flow_snapshot(

            flow_key,

            feature_columns

        )


        end = time.perf_counter()


        feature_times.append(

            (end - start)
            * 1000

        )


        # ====================================================
        # MODEL PREDICTION
        # ====================================================

        start = time.perf_counter()


        result = predict_attack(
            features
        )


        end = time.perf_counter()


        inference_times.append(

            (end - start)
            * 1000

        )


        model_prediction = (
            result["prediction"]
        )


        # ====================================================
        # MODEL PROBABILITIES
        # ====================================================

        sample = {

            feature:

                features.get(
                    feature,
                    0
                )

            for feature
            in feature_columns

        }


        sample_df = pd.DataFrame(
            [sample]
        )


        probabilities = (

            model.predict_proba(
                sample_df
            )[0]

        )


        # ====================================================
        # APPLICATION DETECTION
        # ====================================================

        web_attack = detect_web_attack(
            flow
        )


        final_prediction = (

            web_attack

            if web_attack is not None

            else model_prediction

        )


        if web_attack is not None:

            print(
                "Application-layer detection:",
                web_attack
            )


        # ====================================================
        # LIVE METRICS
        # ====================================================

        if expected_label is not None:

            try:

                expected_index = (

                    label_encoder.transform(
                        [expected_label]
                    )[0]

                )


                final_index = (

                    label_encoder.transform(
                        [final_prediction]
                    )[0]

                )


                y_true.append(
                    expected_index
                )


                y_pred.append(
                    final_index
                )


                # ------------------------------------------------
                # Probability vector
                # ------------------------------------------------

                final_scores = list(
                    probabilities
                )


                # Rule-based override gets a
                # one-hot final score.

                if web_attack is not None:

                    final_scores = [

                        0.0

                    ] * len(
                        label_encoder.classes_
                    )


                    final_scores[
                        final_index
                    ] = 1.0


                y_scores.append(
                    final_scores
                )


                total_test_flows += 1


                # IMPORTANT:
                # Compare FINAL prediction.

                if (

                    final_index
                    ==
                    expected_index

                ):

                    correct_test_flows += 1


                calculate_live_metrics()


            except ValueError as e:

                print(
                    "Expected label error:",
                    e
                )


        # ====================================================
        # FLOW INFORMATION
        # ====================================================

        source = flow.get(
            "last_source",
            ""
        )


        destination = flow.get(
            "last_destination",
            ""
        )


        protocol = flow.get(
            "protocol",
            ""
        )


        # ====================================================
        # FINAL RESULT
        # ====================================================

        if (
            final_prediction
            ==
            model_prediction
        ):

            confidence = result[
                "confidence"
            ]

            risk = result[
                "risk"
            ]

            threat_type = result[
                "threat_type"
            ]

            recommendation = result[
                "recommendation"
            ]


        else:

            confidence = 100.0

            risk = "High"


            if (
                final_prediction
                ==
                XSS_LABEL
            ):

                threat_type = (
                    "Web Application Attack"
                )

                recommendation = (
                    "Sanitize user input and "
                    "enable Content Security Policy."
                )


            elif (
                final_prediction
                ==
                SQL_LABEL
            ):

                threat_type = (
                    "Database Attack"
                )

                recommendation = (
                    "Validate inputs and use "
                    "parameterized queries."
                )


            elif (
                final_prediction
                ==
                BRUTE_LABEL
            ):

                threat_type = (
                    "Brute Force Attack"
                )

                recommendation = (
                    "Enable rate limiting, "
                    "account lockout and MFA."
                )


            else:

                threat_type = (
                    "Network Attack"
                )

                recommendation = (
                    "Investigate suspicious traffic."
                )


        # ====================================================
        # SEND LIVE PREDICTION TO API
        # ====================================================

        prediction_payload = {

            "timestamp":
                time.strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),

            "prediction":
                final_prediction,

            "confidence":
                float(
                    confidence
                ),

            "risk":
                risk,

            "threat_type":
                threat_type,

            "recommendation":
                recommendation,

            "source":
                source,

            "destination":
                destination,

            "protocol":
                protocol

        }


        try:

            start = time.perf_counter()


            requests.post(

                f"{API_BASE}/traffic/live/update",

                json=prediction_payload,

                timeout=2

            )


            end = time.perf_counter()


            api_times.append(

                (end - start)
                * 1000

            )


        except Exception as e:

            print(
                "Prediction API error:",
                e
            )


        # ====================================================
        # CONSOLE OUTPUT
        # ====================================================

        print(
            "\n"
            + "=" * 60
        )


        print(
            f"Flow Source      : {source}"
        )


        print(
            f"Flow Destination : {destination}"
        )


        print(
            f"Protocol         : {protocol}"
        )


        print(
            f"Model Prediction : {model_prediction}"
        )


        print(
            f"Final Prediction : {final_prediction}"
        )


        print(
            f"Confidence       : {confidence}%"
        )


        print(
            f"Risk             : {risk}"
        )


        print(
            f"Threat           : {threat_type}"
        )


        print(
            f"Advice           : {recommendation}"
        )


        if expected_label is not None:

            print(
                f"Expected         : "
                f"{expected_label}"
            )


            print(
                f"Live Accuracy    : "
                f"{live_performance.get('live_accuracy', 0)}%"
            )


            print(
                f"Live Precision   : "
                f"{live_performance.get('live_precision_macro', 0)}%"
            )


            print(
                f"Live Recall      : "
                f"{live_performance.get('live_recall_macro', 0)}%"
            )


            print(
                f"Live F1          : "
                f"{live_performance.get('live_f1_macro', 0)}%"
            )


        print(
            "=" * 60
        )


    except Exception as e:

        print(
            "Flow processing error:",
            e
        )


# ============================================================
# AUTOMATIC 4-CLASS LIVE TEST
# ============================================================

def run_four_class_live_test():

    time.sleep(3)

    print("\n")
    print("=" * 60)
    print("STARTING AUTOMATIC 4-CLASS LIVE TEST")
    print("=" * 60)

    tests = [

        # 1. BENIGN
        {
            "name": "BENIGN",
            "method": "GET",
            "url": f"{API_BASE}/benign-test",
            "json": None
        },

        # 2. XSS
        {
            "name": "XSS",
            "method": "POST",
            "url": f"{API_BASE}/security-test",
            "json": {
                "input": "<script>alert(1)</script>"
            }
        },

        # 3. SQL INJECTION
        {
            "name": "SQL INJECTION",
            "method": "POST",
            "url": f"{API_BASE}/security-test",
            "json": {
                "input": "' OR 1=1 --"
            }
        },

        # 4. BRUTE FORCE
        {
            "name": "BRUTE FORCE",
            "method": "POST",
            "url": f"{API_BASE}/brute-test",
            "json": {
                "username": "test_user",
                "password": "wrong_password"
            }
        }
    ]

    for test in tests:

        print("\n")
        print("-" * 60)
        print("Sending test:", test["name"])
        print("-" * 60)

        try:

            start = time.perf_counter()

            if test["method"] == "GET":

                response = requests.get(
                    test["url"],
                    timeout=5
                )

            else:

                response = requests.post(
                    test["url"],
                    json=test["json"],
                    timeout=5
                )

            end = time.perf_counter()

            print(
                "HTTP Status   :",
                response.status_code
            )

            print(
                "Response Time :",
                round(
                    (end - start) * 1000,
                    3
                ),
                "ms"
            )

        except Exception as e:

            print(
                "Test request error:",
                e
            )

        time.sleep(2)

    print("\n")
    print("=" * 60)
    print("ALL 4 CONTROLLED TESTS SENT")
    print("=" * 60)

    print("Waiting for flows to expire...")

    time.sleep(
        FLOW_TIMEOUT + 3
    )

    print("4-class live test traffic completed.")


# ============================================================
# START CAPTURE
# ============================================================

print(
    "\n"
    + "=" * 60
)
# ============================================================
# VERIFY TSHARK
# ============================================================

if not os.path.exists(TSHARK_PATH):

    raise FileNotFoundError(
        "TShark was not found at: "
        + TSHARK_PATH
        + "\nSet TSHARK_PATH to your tshark.exe path."
    )


# ============================================================
# PYSHARK LIVE CAPTURE
# ============================================================

capture = pyshark.LiveCapture(

    interface=LIVE_INTERFACE,

    tshark_path=TSHARK_PATH,

    bpf_filter=CAPTURE_FILTER

)

# ============================================================
# START AUTOMATIC 4-CLASS TEST
# ============================================================

test_thread = threading.Thread(
    target=run_four_class_live_test,
    daemon=True
)

test_thread.start()

# ============================================================
# CAPTURE LOOP
# ============================================================

try:

    for packet in capture.sniff_continuously():

        try:

            if not hasattr(
                packet,
                "ip"
            ):

                continue


            # ------------------------------------------------
            # IGNORE NETSHIELD INTERNAL TRAFFIC
            # ------------------------------------------------

            if is_internal_netshield_packet(
                packet
            ):

                continue


            total_packets += 1


            # ------------------------------------------------
            # ADD PACKET TO FLOW
            # ------------------------------------------------

            extract_features(

                packet,

                feature_columns

            )


            # ------------------------------------------------
            # ATTACH CONTROLLED LABEL
            # ------------------------------------------------

            if hasattr(
                packet,
                "http"
            ):

                attach_expected_label(
                    packet
                )

            attach_labels_from_active_flows()

            current_time = float(
                packet.sniff_timestamp
            )


            # ------------------------------------------------
            # FIND EXPIRED FLOWS
            # ------------------------------------------------

            expired = []


            for key, flow in list(
                flows.items()
            ):

                last_time = flow.get(
                    "last_time"
                )


                if last_time is None:

                    continue


                if (

                    current_time
                    -
                    last_time
                    >=
                    FLOW_TIMEOUT

                ):

                    expired.append(
                        key
                    )


            # ------------------------------------------------
            # FINAL LABEL PASS BEFORE PROCESSING EXPIRED FLOWS
            # ------------------------------------------------

            attach_labels_from_active_flows()

            # ------------------------------------------------
            # PROCESS EXPIRED FLOWS
            # ------------------------------------------------

            for key in expired:

                flow = flows.get(
                    key
                )


                if flow is not None:

                    process_flow(

                        key,

                        flow

                    )


                flows.pop(
                    key,
                    None
                )


            send_live_performance()


        except Exception as e:

            print(
                "Packet processing error:",
                e
            )


except KeyboardInterrupt:

    print(
        "\nStopping live capture..."
    )


finally:

    try:

        capture.close()

    except Exception:

        pass


    # ========================================================
    # PROCESS REMAINING FLOWS
    # ========================================================

    for key, flow in list(
        flows.items()
    ):

        try:

            process_flow(

                key,

                flow

            )

        except Exception as e:

            print(
                "Final flow error:",
                e
            )


    flows.clear()


    # ========================================================
    # FINAL PERFORMANCE
    # ========================================================

    send_live_performance()


    # ========================================================
    # FINAL VALIDATION RESULTS
    # ========================================================

    print(
        "\n"
        + "=" * 60
    )


    print(
        "       LIVE MODEL VALIDATION RESULTS"
    )


    print(
        "=" * 60
    )


    print(
        f"Live Accuracy          : "
        f"{live_performance.get('live_accuracy', 0):.2f}%"
    )


    print(
        f"Live Precision (Macro) : "
        f"{live_performance.get('live_precision_macro', 0):.2f}%"
    )


    print(
        f"Live Recall (Macro)    : "
        f"{live_performance.get('live_recall_macro', 0):.2f}%"
    )


    print(
        f"Live F1 Score (Macro)  : "
        f"{live_performance.get('live_f1_macro', 0):.2f}%"
    )


    roc = live_performance.get(
        "live_roc_auc"
    )


    if roc is None:

        print(
            "Live ROC-AUC           : "
            "Not available"
        )

    else:

        print(
            f"Live ROC-AUC           : "
            f"{roc:.2f}%"
        )


    print(
        f"Live Samples           : "
        f"{len(y_true)}"
    )


    print(
        "=" * 60
    )


    # ========================================================
    # CLASS COUNTS
    # ========================================================

    print(
        "\n===== LIVE CLASS COUNTS ====="
    )


    class_counts = {}


    for index in y_true:

        label = (
            label_encoder.inverse_transform(
                [index]
            )[0]
        )


        class_counts[label] = (

            class_counts.get(
                label,
                0
            )

            + 1

        )


    for label in label_encoder.classes_:

        print(
            f"{label:<35}: "
            f"{class_counts.get(label, 0)}"
        )


    print(
        "=============================="
    )


    # ========================================================
    # FOUR CLASS TEST RESULT
    # ========================================================

    print(
        "\n===== LIVE 4-CLASS TEST RESULT ====="
    )


    print(
        f"1. {BENIGN_LABEL}"
    )


    print(
        f"2. {XSS_LABEL}"
    )


    print(
        f"3. {SQL_LABEL}"
    )


    print(
        f"4. {BRUTE_LABEL}"
    )


    print(
        f"Total Test Flows     : "
        f"{total_test_flows}"
    )


    print(
        f"Correct Predictions  : "
        f"{correct_test_flows}"
    )


    if total_test_flows > 0:

        test_accuracy = (

            correct_test_flows
            /
            total_test_flows

        ) * 100

    else:

        test_accuracy = 0


    print(
        f"Live Flow Accuracy   : "
        f"{test_accuracy:.2f}%"
    )


    print(
        "===================================="
    )


    # ========================================================
    # SYSTEM PERFORMANCE
    # ========================================================

    print(
        "\n===== SYSTEM PERFORMANCE ====="
    )


    if feature_times:

        print(
            f"Feature Extraction Latency : "
            f"{sum(feature_times) / len(feature_times):.3f} ms"
        )


    if inference_times:

        print(
            f"AI Inference Latency       : "
            f"{sum(inference_times) / len(inference_times):.3f} ms"
        )


    if api_times:

        print(
            f"API Response Time          : "
            f"{sum(api_times) / len(api_times):.3f} ms"
        )


    print(
        f"Packets Processed          : "
        f"{total_packets}"
    )


    print(
        f"Flows Processed            : "
        f"{total_flows}"
    )


    print(
        f"CPU Usage                  : "
        f"{process.cpu_percent(interval=1):.2f}%"
    )


    print(
        f"RAM Usage                  : "
        f"{process.memory_info().rss / (1024 * 1024):.2f} MB"
    )


    print(
        "=============================="
    )