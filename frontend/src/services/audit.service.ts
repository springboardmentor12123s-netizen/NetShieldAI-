import apiClient from "./api-client";
import { AuditFilter, AuditLogResponse } from "../types/audit";
import { PaginatedResponse } from "../types/api";

export const auditService = {
    async listLogs(filters: AuditFilter): Promise<PaginatedResponse<AuditLogResponse>> {
        const response = await apiClient.get<PaginatedResponse<AuditLogResponse>>("/audit", {
            params: filters,
        });
        return response.data;
    },
};

export default auditService;
