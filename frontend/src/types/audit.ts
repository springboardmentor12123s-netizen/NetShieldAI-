export interface AuditLogResponse {
    id: string;
    action: string;
    user_id: string;
    user_email?: string | null;
    user_name?: string | null;
    timestamp: string;
    ip_address: string;
    status: string;
    description: string;
    context?: Record<string, any> | null;
}

export interface AuditFilter {
    action?: string;
    user_id?: string;
    start_time?: string;
    end_time?: string;
    page?: number;
    per_page?: number;
}
