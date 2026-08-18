import os
import sys
import time
import json
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List

# Ensure backend directory is in path
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(script_dir, "..", "backend"))
sys.path.insert(0, backend_dir)

# Initialize app and databases
from app.main import app
from app.core.mongodb import MongoDBManager
from app.services.traffic_service import TrafficService
from app.ai.prediction.predictor import ThreatPredictor
from app.core.dependencies import get_current_user
from fastapi.testclient import TestClient

# Mock user function to bypass authorization checks
async def mock_current_user():
    return {
        "user_id": "e2ba286f-2ef4-4fdb-935f-00ecf79d1a81",
        "role": "admin",
        "permissions": ["admin"]
    }

app.dependency_overrides[get_current_user] = mock_current_user

# Sample packets
sample_packets = [
    {
        "dst_port": 80,
        "bytes_sent": 1500 + i * 10,
        "bytes_received": 3000 - i * 5,
        "packet_count": 20,
        "duration_ms": 100,
        "flags": ["SYN"]
    } for i in range(100)
]

def run_ml_benchmark(iterations: int = 150) -> Dict[str, float]:
    predictor = ThreatPredictor()
    # Force loading if not loaded
    if not predictor.is_loaded:
        predictor.load_models()
    
    latencies = []
    for i in range(iterations):
        packet = sample_packets[i % len(sample_packets)]
        start = time.perf_counter()
        _ = predictor.predict_log(packet)
        latencies.append(time.perf_counter() - start)
    
    return {
        "average_latency_ms": (sum(latencies) / len(latencies)) * 1000,
        "min_latency_ms": min(latencies) * 1000,
        "max_latency_ms": max(latencies) * 1000
    }

def run_ml_batch_benchmark(batch_size: int = 50, iterations: int = 100) -> Dict[str, Any]:
    predictor = ThreatPredictor()
    if not predictor.is_loaded:
        predictor.load_models()
        
    latencies = []
    for _ in range(iterations):
        batch = sample_packets[:batch_size]
        start = time.perf_counter()
        _ = predictor.predict_batch(batch)
        latencies.append(time.perf_counter() - start)
        
    avg_sec = sum(latencies) / len(latencies)
    throughput = batch_size / avg_sec if avg_sec > 0 else 0.0
    
    return {
        "batch_size": batch_size,
        "average_latency_ms": avg_sec * 1000,
        "throughput_predictions_per_second": throughput
    }

async def run_traffic_benchmark(iterations: int = 20, batch_size: int = 50) -> Dict[str, float]:
    # Need MongoDB manager active
    await MongoDBManager.connect()
    db = MongoDBManager.get_database()
    service = TrafficService(db)
    
    latencies = []
    for i in range(iterations):
        batch = [{**pkg, "timestamp": None} for pkg in sample_packets[:batch_size]]
        start = time.perf_counter()
        _ = await service.ingest_packets(batch)
        latencies.append(time.perf_counter() - start)
        
    await MongoDBManager.disconnect()
    
    return {
        "average_latency_ms": (sum(latencies) / len(latencies)) * 1000
    }

def run_endpoint_benchmark(client: TestClient, route: str, count: int = 50, method: str = "GET", payload: Any = None) -> Dict[str, float]:
    latencies = []
    for _ in range(count):
        start = time.perf_counter()
        if method == "POST":
            response = client.post(route, json=payload)
        else:
            response = client.get(route)
        latencies.append(time.perf_counter() - start)
        # Ensure it works
        if response.status_code not in (200, 307):
            print(f"Error calling {route}: {response.status_code} - {response.text}")
            
    return {
        "average_latency_ms": (sum(latencies) / len(latencies)) * 1000,
        "min_latency_ms": min(latencies) * 1000,
        "max_latency_ms": max(latencies) * 1000
    }

async def main():
    print("Initializing Benchmark Suite...")
    client = TestClient(app)
    
    # 1. ML Predictor test
    print("Running ML prediction benchmarks...")
    ml_single = run_ml_benchmark(150)
    ml_batch = run_ml_batch_benchmark(50, 100)
    
    # 2. Traffic Service test
    print("Running Traffic ingestion benchmarks...")
    traffic_stats = await run_traffic_benchmark(15, 50)
    
    # 3. HTTP Endpoints
    print("Running API endpoint benchmarks...")
    status_stats = run_endpoint_benchmark(client, "/api/v1/traffic/ml/status", 50)
    eval_stats = run_endpoint_benchmark(client, "/api/v1/traffic/ml/evaluation", 50)
    matrix_stats = run_endpoint_benchmark(client, "/api/v1/traffic/ml/confusion-matrix", 30)
    
    predict_payload = sample_packets[0]
    predict_endpoint_stats = run_endpoint_benchmark(
        client, "/api/v1/traffic/ml/predict", 50, method="POST", payload=predict_payload
    )
    
    results = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "single_prediction": ml_single,
        "batch_prediction": ml_batch,
        "traffic_ingestion": traffic_stats,
        "api": {
            "/traffic/ml/status": status_stats,
            "/traffic/ml/evaluation": eval_stats,
            "/traffic/ml/confusion-matrix": matrix_stats,
            "/traffic/ml/predict": predict_endpoint_stats
        }
    }
    
    # Write json output if path given
    out_file = None
    if len(sys.argv) > 1:
        out_file = sys.argv[1]
    
    if out_file:
        os.makedirs(os.path.dirname(out_file), exist_ok=True)
        with open(out_file, "w") as f:
            json.dump(results, f, indent=4)
        print(f"Benchmark results written to {out_file}")
        
    # Print clean text summary
    print("\n" + "="*60)
    print("BENCHMARK PERFORMANCE STATISTICS (ms)")
    print("="*60)
    print(f"ML Single prediction:  Avg: {ml_single['average_latency_ms']:.2f}ms | Min: {ml_single['min_latency_ms']:.2f}ms | Max: {ml_single['max_latency_ms']:.2f}ms")
    print(f"ML Batch prediction (50): Avg: {ml_batch['average_latency_ms']:.2f}ms | Throughput: {ml_batch['throughput_predictions_per_second']:.2f} pred/sec")
    print(f"Traffic Ingestion (50): Avg: {traffic_stats['average_latency_ms']:.2f}ms")
    print(f"API /traffic/ml/status: Avg: {status_stats['average_latency_ms']:.2f}ms | Min: {status_stats['min_latency_ms']:.2f}ms | Max: {status_stats['max_latency_ms']:.2f}ms")
    print(f"API /traffic/ml/eval:   Avg: {eval_stats['average_latency_ms']:.2f}ms | Min: {eval_stats['min_latency_ms']:.2f}ms | Max: {eval_stats['max_latency_ms']:.2f}ms")
    print(f"API /traffic/ml/matrix: Avg: {matrix_stats['average_latency_ms']:.2f}ms | Min: {matrix_stats['min_latency_ms']:.2f}ms | Max: {matrix_stats['max_latency_ms']:.2f}ms")
    print(f"API /traffic/ml/predict:Avg: {predict_endpoint_stats['average_latency_ms']:.2f}ms | Min: {predict_endpoint_stats['min_latency_ms']:.2f}ms | Max: {predict_endpoint_stats['max_latency_ms']:.2f}ms")
    print("="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(main())

