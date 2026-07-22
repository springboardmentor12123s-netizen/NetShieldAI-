export interface APIResponse<T> {
    data: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
}

export interface MessageResponse {
    message: string;
}
