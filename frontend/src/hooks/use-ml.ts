import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../services/api-client";

export function useMLStatusQuery() {
    return useQuery({
        queryKey: ["ml-status"],
        queryFn: async () => {
            const response = await apiClient.get<any>("/traffic/ml/status");
            return response.data.data || response.data;
        },
        staleTime: 30000, // Keep fresh for 30 seconds
        gcTime: 60000,
    });
}

export function useMLEvaluationQuery() {
    return useQuery({
        queryKey: ["ml-evaluation"],
        queryFn: async () => {
            const response = await apiClient.get<any>("/traffic/ml/evaluation");
            return response.data.data || response.data;
        },
        staleTime: 60000, // Keep evaluation fresh for 60 seconds
        gcTime: 120000,
    });
}

export function useRetrainMLMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post<any>("/traffic/ml/train");
            return response.data;
        },
        onSuccess: () => {
            // Invalidate queries to fetch updated status and evaluation reports
            queryClient.invalidateQueries({ queryKey: ["ml-status"] });
            queryClient.invalidateQueries({ queryKey: ["ml-evaluation"] });
        },
    });
}
