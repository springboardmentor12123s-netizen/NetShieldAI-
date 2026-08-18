import { useQuery } from "@tanstack/react-query";
import apiClient from "../services/api-client";

export interface AlertItem {
    id: string;
    timestamp: string;
    message: string;
    severity: "critical" | "high" | "medium" | "low";
    src_ip?: string;
    type: string;
}

export function useAlertsQuery() {
    return useQuery<AlertItem[]>({
        queryKey: ["alerts"],
        queryFn: async () => {
            const response = await apiClient.get<any>("/alerts");
            const data = response.data.items || response.data || [];
            const rawAlerts = Array.isArray(data) ? data : [];
            return rawAlerts.map((item: any) => ({
                id: item.id || item._id || Math.random().toString(),
                timestamp: item.timestamp,
                message: item.message || item.description || "",
                severity: item.severity || "info",
                src_ip: item.src_ip || item.source_ip || "",
                type: item.type || item.alert_type || "Anomaly"
            }));
        },
        staleTime: 15000, // Keep cache warm for 15s to avoid duplicate API requests
        gcTime: 60000,
    });
}
