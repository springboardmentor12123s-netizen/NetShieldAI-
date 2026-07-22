import apiClient from "./api-client";
import { TrafficFilter, TrafficLogResponse, TrafficStatsResponse, TrafficAnalyticsResponse } from "../types/traffic";
import { PaginatedResponse, APIResponse } from "../types/api";

export const trafficService = {
    async listTraffic(filters: TrafficFilter): Promise<PaginatedResponse<TrafficLogResponse>> {
        const response = await apiClient.get<PaginatedResponse<TrafficLogResponse>>("/traffic", {
            params: filters,
        });
        return response.data;
    },

    async getStats(hours: number = 24): Promise<TrafficStatsResponse> {
        const response = await apiClient.get<APIResponse<TrafficStatsResponse>>(`/traffic/stats`, {
            params: { hours },
        });
        return response.data.data;
    },

    async getAnalytics(hours: number = 24): Promise<TrafficAnalyticsResponse> {
        const response = await apiClient.get<APIResponse<TrafficAnalyticsResponse>>(`/traffic/analytics`, {
            params: { hours },
        });
        return response.data.data;
    },
};

export default trafficService;
