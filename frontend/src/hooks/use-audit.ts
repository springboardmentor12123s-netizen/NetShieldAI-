import { useQuery } from "@tanstack/react-query";
import auditService from "../services/audit.service";
import { AuditFilter } from "../types/audit";

export function useAuditQuery(filters: AuditFilter) {
    return useQuery({
        queryKey: ["audit", filters],
        queryFn: () => auditService.listLogs(filters),
    });
}
