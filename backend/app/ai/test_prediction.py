from predict import predict_attack


sample_data = {
    "destination_port": 80,
    "flow_duration": 1000,
    "total_fwd_packets": 10,
    "total_backward_packets": 5,
    "total_length_fwd_packets": 500,
    "total_length_backward_packets": 300,
    "flow_bytes_per_sec": 2000,
    "flow_packets_per_sec": 30
}


result = predict_attack(sample_data)

print("Prediction:", result)