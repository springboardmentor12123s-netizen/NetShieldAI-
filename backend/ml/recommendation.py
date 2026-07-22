def get_recommendation(threat):

    recommendations = {

        "Analysis":
        "Review logs and investigate suspicious behavior.",

        "Backdoor":
        "Disconnect the affected system and perform malware analysis.",

        "DoS":
        "Enable rate limiting and block suspicious IP addresses.",

        "Exploits":
        "Patch vulnerable software immediately.",

        "Fuzzers":
        "Inspect malformed packets and increase monitoring.",

        "Generic":
        "Increase IDS sensitivity and inspect network traffic.",

        "Normal":
        "No action required.",

        "Reconnaissance":
        "Block scanning sources and strengthen firewall rules.",

        "Shellcode":
        "Isolate the host and perform forensic analysis.",

        "Worms":
        "Disconnect infected machines immediately."

    }

    return recommendations.get(
        threat,
        "Manual investigation required."
    )