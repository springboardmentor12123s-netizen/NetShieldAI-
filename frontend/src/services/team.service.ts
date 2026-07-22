import apiClient from "./api-client";
import { TeamResponse, TeamMemberResponse, TeamCreate, TeamUpdate } from "../types/team";
import { APIResponse } from "../types/api";

export const teamService = {
    async listTeams(): Promise<TeamResponse[]> {
        const response = await apiClient.get<APIResponse<TeamResponse[]>>("/teams");
        return response.data?.data || (response.data as any);
    },

    async createTeam(data: TeamCreate): Promise<TeamResponse> {
        const response = await apiClient.post<APIResponse<TeamResponse>>("/teams", data);
        return response.data?.data || response.data;
    },

    async updateTeam(id: string, data: TeamUpdate): Promise<TeamResponse> {
        const response = await apiClient.put<APIResponse<TeamResponse>>(`/teams/${id}`, data);
        return response.data?.data || response.data;
    },

    async deleteTeam(id: string): Promise<void> {
        await apiClient.delete(`/teams/${id}`);
    },

    async getTeamMembers(teamId: string): Promise<TeamMemberResponse[]> {
        const response = await apiClient.get<APIResponse<TeamMemberResponse[]>>(`/teams/${teamId}/members`);
        return response.data?.data || (response.data as any);
    },

    async addMember(teamId: string, userId: string, role: string): Promise<TeamMemberResponse> {
        const response = await apiClient.post<APIResponse<TeamMemberResponse>>(`/teams/${teamId}/members`, {
            user_id: userId,
            role: role,
        });
        return response.data?.data || response.data;
    },

    async removeMember(teamId: string, userId: string): Promise<void> {
        await apiClient.delete(`/teams/${teamId}/members/${userId}`);
    },
};

export default teamService;
