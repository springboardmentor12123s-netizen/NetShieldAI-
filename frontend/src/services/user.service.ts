import apiClient from "./api-client";
import { UserResponse, UserCreate, UserUpdate } from "../types/user";
import { APIResponse } from "../types/api";

export const userService = {
    async listUsers(): Promise<UserResponse[]> {
        const response = await apiClient.get<APIResponse<UserResponse[]>>("/users");
        // Some FastAPI REST endpoints return a direct array or wrapped inside a "data" node.
        // Let's support both formats programmatically.
        return response.data?.data || (response.data as any);
    },

    async createUser(data: UserCreate): Promise<UserResponse> {
        const response = await apiClient.post<APIResponse<UserResponse>>("/users", data);
        return response.data?.data || response.data;
    },

    async updateUser(id: string, data: UserUpdate): Promise<UserResponse> {
        const response = await apiClient.put<APIResponse<UserResponse>>(`/users/${id}`, data);
        return response.data?.data || response.data;
    },

    async deleteUser(id: string): Promise<void> {
        await apiClient.delete(`/users/${id}`);
    },
};

export default userService;
