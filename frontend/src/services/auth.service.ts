import apiClient from "./api-client";
import { LoginCredentials, AuthResponse, UserProfile, ForgotPasswordRequest, ResetPasswordRequest } from "../types/auth";

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
        return response.data;
    },

    async logout(): Promise<void> {
        await apiClient.post("/auth/logout");
    },

    async getProfile(): Promise<UserProfile> {
        const response = await apiClient.get<{ data: UserProfile }>("/users/me");
        return response.data.data;
    },

    async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
        await apiClient.post("/auth/forgot-password", data);
    },

    async resetPassword(data: ResetPasswordRequest): Promise<void> {
        await apiClient.post("/auth/reset-password", data);
    },
};

export default authService;
