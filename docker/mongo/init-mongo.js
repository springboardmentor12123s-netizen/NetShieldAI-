// NetShield AI - MongoDB Init Script
// Creates collections with indexes for traffic data

db = db.getSiblingDB('netshield_traffic');

// Traffic Logs
db.createCollection('traffic_logs');
db.traffic_logs.createIndex({ "timestamp": -1 });
db.traffic_logs.createIndex({ "src_ip": 1, "timestamp": -1 });
db.traffic_logs.createIndex({ "dst_ip": 1, "timestamp": -1 });
db.traffic_logs.createIndex({ "protocol": 1, "timestamp": -1 });
db.traffic_logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// Network Flows
db.createCollection('network_flows');
db.network_flows.createIndex({ "flow_id": 1, "timestamp": -1 });
db.network_flows.createIndex({ "timestamp": -1 });

// Packet Metadata
db.createCollection('packet_metadata');
db.packet_metadata.createIndex({ "traffic_log_id": 1 });
db.packet_metadata.createIndex({ "timestamp": -1 });

// Threat Events (Part 2)
db.createCollection('threat_events');
db.threat_events.createIndex({ "severity": 1, "timestamp": -1 });
db.threat_events.createIndex({ "status": 1 });

// AI Predictions (Part 2)
db.createCollection('ai_predictions');
db.ai_predictions.createIndex({ "model_id": 1, "timestamp": -1 });

// Anomaly Results (Part 2)
db.createCollection('anomaly_results');
db.anomaly_results.createIndex({ "anomaly_score": -1, "timestamp": -1 });

// Security Events
db.createCollection('security_events');
db.security_events.createIndex({ "severity": 1, "timestamp": -1 });
db.security_events.createIndex({ "event_type": 1 });

// Historical Traffic
db.createCollection('historical_traffic');
db.historical_traffic.createIndex({ "date": -1 });

print('NetShield AI MongoDB collections and indexes created successfully.');
