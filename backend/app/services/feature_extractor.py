import logging
from typing import Dict, List, Any
import threading

from app.services.flow_builder import flow_builder, Flow

logger = logging.getLogger("netshield.feature_extractor")


class FeatureExtractor:
    def __init__(self, max_history=1000):
        self.max_history = max_history
        self.extracted_features: List[Dict[str, Any]] = []
        self.lock = threading.Lock()

        # Start background worker to process expired flows
        self.is_running = True
        self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
        self.worker_thread.start()

    def _worker_loop(self):
        import queue
        logger.info("FeatureExtractor worker thread started.")
        while self.is_running:
            try:
                flow = flow_builder.expired_flows_queue.get(timeout=1.0)
                try:
                    self.process_completed_flow(flow)
                except Exception as e:
                    logger.exception(f"Error in FeatureExtractor process flow: {e}")
                finally:
                    flow_builder.expired_flows_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                logger.exception(f"Error in FeatureExtractor worker loop: {e}")

    def stop(self):
        self.is_running = False
        if self.worker_thread.is_alive():
            self.worker_thread.join(timeout=2.0)

    def process_completed_flow(self, flow: Flow):
        try:
            features = self._extract_features(flow)

            flow_id = f"{flow.src_ip}:{flow.src_port}-{flow.dst_ip}:{flow.dst_port}-{flow.protocol}"

            vector = {
                "flow_id": flow_id,
                "features": features
            }

            with self.lock:
                self.extracted_features.append(vector)
                if len(self.extracted_features) > self.max_history:
                    self.extracted_features.pop(0)

            # Pass to predictor
            from app.services.live_predictor import live_predictor
            live_predictor.enqueue_prediction(vector)

        except Exception as e:
            logger.exception(f"Error extracting features from flow: {e}")

    def _extract_features(self, flow: Flow) -> Dict[str, float]:
        """
        Extracts exactly 8 numeric features expected by the trained model.
        Features must match training names precisely.
        """

        # 1. Destination Port
        dst_port = float(flow.dst_port) if hasattr(flow, 'dst_port') and flow.dst_port is not None else 0.0

        # 2. Flow Duration (scale seconds to microseconds to align with typical CIC-IDS)
        flow_duration_s = flow.flow_duration
        flow_duration = round(flow_duration_s * 1_000_000.0, 2)

        # 3. Total Fwd Packets
        fwd_packets = float(flow.forward_packet_count)

        # 4. Total Backward Packets
        bwd_packets = float(flow.backward_packet_count)

        # 5. Flow Bytes/s
        bytes_per_s = round(flow.total_bytes / flow_duration_s, 2) if flow_duration_s > 0 else 0.0

        # 6. Flow Packets/s
        packets_per_s = round(flow.total_packets / flow_duration_s, 2) if flow_duration_s > 0 else 0.0

        # 7. Packet Length Mean (approximated)
        packet_len_mean = round(flow.average_packet_size, 2)

        # 8. Average Packet Size
        avg_packet_size = round(flow.average_packet_size, 2)

        return {
            "Destination Port": dst_port,
            "Flow Duration": flow_duration,
            "Total Fwd Packets": fwd_packets,
            "Total Backward Packets": bwd_packets,
            "Flow Bytes/s": bytes_per_s,
            "Flow Packets/s": packets_per_s,
            "Packet Length Mean": packet_len_mean,
            "Average Packet Size": avg_packet_size
        }

    def get_latest_features(self):
        with self.lock:
            return list(self.extracted_features)


feature_extractor = FeatureExtractor()
