export interface TrafficLogResponse {
    id: string;
    timestamp: string;
    src_ip: string;
    dst_ip: string;
    src_port: number;
    dst_port: number;
    protocol: string;
    bytes_sent: number;
    bytes_received: number;
    packet_count: number;
    flags: string[];
    duration_ms: number;
    geo?: {
        src_country?: string;
        dst_country?: string;
    };
    metadata?: Record<string, any>;
}

export interface TrafficFilter {
    src_ip?: string;
    dst_ip?: string;
    protocol?: string;
    src_port?: number;
    dst_port?: number;
    start_time?: string;
    end_time?: string;
    search?: string;
    page?: number;
    per_page?: number;
}

export interface TrafficStatsResponse {
    total_packets: number;
    total_bytes: number;
    unique_sources: number;
    unique_destinations: number;
    protocol_distribution: Record<string, number>;
    avg_packet_size: number;
    packets_per_second: number;
    bandwidth_mbps: number;
}

export interface TrafficAnalyticsResponse {
    traffic_timeline: {
        time: string;
        packets: number;
        bytes: number;
    }[];
    top_source_ips: {
        ip: string;
        count: number;
        bytes: number;
    }[];
    top_destination_ips: {
        ip: string;
        count: number;
        bytes: number;
    }[];
    protocol_distribution: {
        protocol: string;
        count: number;
    }[];
    bandwidth_usage: {
        time: string;
        bytes: number;
    }[];
    packets_per_second: number[];
}
