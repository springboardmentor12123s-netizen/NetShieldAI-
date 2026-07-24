from fastapi import APIRouter
from pydantic import BaseModel
from ai_engine import predict_threat

router = APIRouter()

# Schema for incoming data from the frontend
class NetworkFlowFeatures(BaseModel):
    flow_duration: int = 0
    total_fwd_packets: int = 0
    total_backward_packets: int = 0
    fwd_packet_length_max: int = 0
    fwd_packet_length_mean: float = 0.0
    flow_bytes_per_sec: float = 0.0
    flow_packets_per_sec: float = 0.0

@router.post("/predict", summary="Analyze network flow with AI")
def analyze_traffic(flow: NetworkFlowFeatures):
    # Convert the incoming camelCase/pydantic names to match the CICIDS2017 column names
    flow_dict = {
        ' Flow Duration': flow.flow_duration,
        ' Total Fwd Packets': flow.total_fwd_packets,
        ' Total Backward Packets': flow.total_backward_packets,
        ' Fwd Packet Length Max': flow.fwd_packet_length_max,
        ' Fwd Packet Length Mean': flow.fwd_packet_length_mean,
        'Flow Bytes/s': flow.flow_bytes_per_sec,
        ' Flow Packets/s': flow.flow_packets_per_sec
    }
    
    # Run the AI prediction
    ai_result = predict_threat(flow_dict)
    
    return ai_result