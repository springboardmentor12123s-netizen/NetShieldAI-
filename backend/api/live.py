from flask import Blueprint, jsonify
import psutil
import time

from services.threat_state import get_threat


live = Blueprint("live", __name__)

previous = psutil.net_io_counters()
previous_time = time.time()


@live.route("/live")
def live_network():

    global previous
    global previous_time

    current = psutil.net_io_counters()

    now = time.time()

    elapsed = now - previous_time

    if elapsed <= 0:
        elapsed = 1

    upload = (
        current.bytes_sent -
        previous.bytes_sent
    ) / elapsed

    download = (
        current.bytes_recv -
        previous.bytes_recv
    ) / elapsed

    packets = (
        current.packets_sent -
        previous.packets_sent
        +
        current.packets_recv -
        previous.packets_recv
    ) / elapsed

    connections = len(
        psutil.net_connections()
    )

    previous = current
    previous_time = now

    threat = get_threat()

    return jsonify({

        "download": round(
            download / 1024 / 1024,
            2
        ),

        "upload": round(
            upload / 1024 / 1024,
            2
        ),

        "packets": int(packets),

        "connections": connections,

        "interface": "Wi-Fi",

        "status": "Monitoring",

        "threat": threat["threat"],

        "risk": threat["risk"],

        "confidence": threat["confidence"],

        "threatTime": threat["time"]

    })