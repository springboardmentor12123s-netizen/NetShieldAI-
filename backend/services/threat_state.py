import json
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
STATE_FILE = os.path.join(BASE_DIR, "threat_state.json")


def save_threat(attack, confidence):

    attack_name = str(attack)

    if attack_name.upper() == "BENIGN":
        risk = "LOW"

    elif attack_name.upper() in [
        "DOS",
        "DDOS",
        "BOT",
        "BOTNET",
        "BRUTE FORCE",
        "BRUTEFORCE"
    ]:
        risk = "CRITICAL"

    elif confidence >= 90:
        risk = "HIGH"

    elif confidence >= 70:
        risk = "MEDIUM"

    else:
        risk = "LOW"

    data = {
        "threat": attack_name,
        "risk": risk,
        "confidence": confidence,
        "time": datetime.now().strftime("%H:%M:%S")
    }

    with open(STATE_FILE, "w") as file:
        json.dump(data, file)


def get_threat():

    if not os.path.exists(STATE_FILE):
        return {
            "threat": "BENIGN",
            "risk": "LOW",
            "confidence": 0,
            "time": None
        }

    try:
        with open(STATE_FILE, "r") as file:
            return json.load(file)

    except Exception:
        return {
            "threat": "BENIGN",
            "risk": "LOW",
            "confidence": 0,
            "time": None
        }