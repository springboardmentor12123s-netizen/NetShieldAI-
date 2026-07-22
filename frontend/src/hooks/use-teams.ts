import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import teamService from "../services/team.service";
import { TeamCreate, TeamUpdate } from "../types/team";

export function useTeamsQuery() {
    return useQuery({
        queryKey: ["teams"],
        queryFn: () => teamService.listTeams(),
    });
}

export function useCreateTeamMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: TeamCreate) => teamService.createTeam(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
        },
    });
}

export function useUpdateTeamMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: TeamUpdate }) =>
            teamService.updateTeam(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
        },
    });
}

export function useDeleteTeamMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => teamService.deleteTeam(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
        },
    });
}

export function useTeamMembersQuery(teamId: string) {
    return useQuery({
        queryKey: ["team-members", teamId],
        queryFn: () => teamService.getTeamMembers(teamId),
        enabled: !!teamId,
    });
}

export function useAddTeamMemberMutation(teamId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) =>
            teamService.addMember(teamId, userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}

export function useRemoveTeamMemberMutation(teamId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => teamService.removeMember(teamId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}
