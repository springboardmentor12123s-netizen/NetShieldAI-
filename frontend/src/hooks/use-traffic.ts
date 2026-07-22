import { useQuery } from "@tanstack/react-query";
import trafficService from "../services/traffic.service";
import { TrafficFilter } from "../types/traffic";

export function useTrafficQuery(filters: TrafficFilter) {
    return useQuery({
        queryKey: ["traffic", filters],
        queryFn: () => trafficService.listTraffic(filters),
    });
}

export function useTrafficStats(hours: number = 24) {
    return useQuery({
        queryKey: ["traffic-stats", hours],
        queryFn: () => trafficService.getStats(hours),
        refetchInterval: 10000, // Auto refresh stats every 10s for live simulation
    });
}

export function useTrafficAnalytics(hours: number = 24) {
    return useQuery({
        queryKey: ["traffic-analytics", hours],
        queryFn: () => trafficService.getAnalytics(hours),
        refetchInterval: 30000, // Refresh analytics every 30s
    });
}
