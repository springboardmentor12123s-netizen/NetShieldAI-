# =========================================================
# NetShield AI - Dataset Service
# =========================================================

# This file provides dataset information to the frontend.
# We DO NOT load the large CSV files here.
# The actual datasets can still be used by ML/traffic modules.


# =========================================================
# DATASET SUMMARY
# =========================================================

DATASET_SUMMARY = {

    "totalFlows": 700000,

    "benign": 68431,

    "attacks": 31569,

    "attackTypes": {

        "Analysis": 403,

        "Backdoor": 429,

        "DoS": 3420,

        "Exploits": 8364,

        "Fuzzers": 4120,

        "Generic": 11887,

        "Normal": 68431,

        "Reconnaissance": 2636,

        "Shellcode": 280,

        "Worms": 30

    },

    "datasets": [

        {
            "name": "CICIDS2017",
            "rows": 400000,
            "features": 79,
            "files": 8,
            "status": "Ready"
        },

        {
            "name": "UNSW-NB15",
            "rows": 300000,
            "features": 49,
            "files": 6,
            "status": "Ready"
        }

    ]

}


# =========================================================
# FUNCTION USED BY API
# =========================================================

def load_summary():

    return DATASET_SUMMARY