from predict import predict_attack


sample_data = {
    "Destination Port": 80,
    "Flow Duration": 1000,
    "Total Fwd Packets": 10,
    "Total Backward Packets": 5,
    "Total Length of Fwd Packets": 500,
    "Total Length of Bwd Packets": 300,
    "Flow Bytes/s": 2000,
    "Flow Packets/s": 30
}


result = predict_attack(sample_data)


print("Prediction:", result["prediction"])
print("Confidence:", result["confidence"], "%")