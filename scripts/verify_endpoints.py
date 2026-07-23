"Final verification of all API endpoints."

import requests

BASE = "http://127.0.0.1:8765/api"
ENDPOINTS = ["dashboard", "history", "alerts", "reports/latest"]


def verify_endpoints() -> bool:
    """Check each monitoring endpoint and print a status summary."""
    all_ok = True

    for ep in ENDPOINTS:
        response = requests.get(f"{BASE}/{ep}")
        ok = response.status_code == 200
        if not ok:
            all_ok = False
        data = response.json()
        status = "OK  " if ok else "FAIL"
        print(f"[{status}] GET /api/{ep} -> HTTP {response.status_code}")

        if isinstance(data, list):
            print(f"  Count: {len(data)}")
            if data:
                print(f"  First: {str(data[0])[:100]}")
        elif isinstance(data, dict):
            for key, value in list(data.items())[:8]:
                print(f"  {key}: {str(value)[:80]}")

    print()
    print(f"All endpoints OK: {all_ok}")
    return all_ok


if __name__ == "__main__":
    verify_endpoints()
