import time
import json
import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

def login():
    url = f"{BASE_URL}/auth/login"
    payload = {"email": "admin@netshield.io", "password": "Admin@123"}
    response = requests.post(url, json=payload)
    response.raise_for_status()
    data = response.json()
    # Handle direct access_token or token nested inside wrap key
    token = data.get("access_token") or data.get("data", {}).get("access_token")
    return token

def benchmark_endpoint(headers, path, params=None, count=10):
    url = f"{BASE_URL}{path}"
    latencies = []
    response_size = 0
    for _ in range(count):
        start = time.perf_counter()
        response = requests.get(url, headers=headers, params=params)
        end = time.perf_counter()
        response.raise_for_status()
        latencies.append((end - start) * 1000.0)
        # Approximate size of JSON response payload in bytes
        response_size = len(response.content)
    
    avg_l = sum(latencies) / len(latencies)
    min_l = min(latencies)
    max_l = max(latencies)
    return {
        "avg_ms": round(avg_l, 2),
        "min_ms": round(min_l, 2),
        "max_ms": round(max_l, 2),
        "size_bytes": response_size
    }

def main():
    print("Logging in to extract Auth Token...")
    token = login()
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = {
        "Operations: Stats": ("/traffic/stats", {"hours": 24}),
        "Operations: Analytics": ("/traffic/analytics", {"hours": 24}),
        "Network Monitor: Traffic logs": ("/traffic", {"page": 1, "per_page": 8}),
        "AI Detection: ML Status": ("/traffic/ml/status", None),
        "AI Detection: ML Eval": ("/traffic/ml/evaluation", None),
        "AI Detection: Confusion Matrix": ("/traffic/ml/confusion-matrix", None),
    }

    results: dict[str, dict] = {}
    print("\nStarting Dashboard API Benchmarks (10 trials each)...")
    for name, (path, params) in endpoints.items():
        print(f"Benchmarking {name} ({path})...")
        try:
            results[name] = benchmark_endpoint(headers, path, params)
        except Exception as e:
            print(f"Error benchmarking {name}: {e}")
            results[name] = {"error": str(e)}

    print("\n============================================================")
    print("DASHBOARD API PERFORMANCE BASELINE STATISTICS")
    print("============================================================")
    for name, res in results.items():
        if "error" in res:
            print(f"{name}: ERROR - {res['error']}")
        else:
            print(f"{name:<35} | Avg: {res['avg_ms']:>6.2f}ms | Min: {res['min_ms']:>6.2f}ms | Max: {res['max_ms']:>6.2f}ms | Size: {res['size_bytes']:>6} bytes")
    print("============================================================")

    # Save to json file
    import sys
    out_file = sys.argv[1] if len(sys.argv) > 1 else "reports/dashboard_performance_baseline.json"
    with open(out_file, "w") as f:
        json.dump(results, f, indent=4)
    print(f"\nSaved results to {out_file}")

if __name__ == "__main__":
    main()
