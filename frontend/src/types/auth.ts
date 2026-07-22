export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    team_id?: string | null;
    is_active: boolean;
    created_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthTokenData {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: UserProfile;
}

export interface AuthResponse {
    data: AuthTokenData;
    message?: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    new_password: string;
}
