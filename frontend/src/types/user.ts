export interface UserResponse {
    id: string;
    email: string;
    full_name: string;
    role: string;
    team_id?: string | null;
    is_active: boolean;
    created_at: string;
}

export interface UserCreate {
    email: string;
    full_name: string;
    role: string;
    team_id?: string | null;
    password?: string;
}

export interface UserUpdate {
    email?: string;
    full_name?: string;
    role?: string;
    team_id?: string | null;
    is_active?: boolean;
}
