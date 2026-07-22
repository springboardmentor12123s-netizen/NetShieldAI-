import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userService from "../services/user.service";
import { UserCreate, UserUpdate } from "../types/user";

export function useUsersQuery() {
    return useQuery({
        queryKey: ["users"],
        queryFn: () => userService.listUsers(),
    });
}

export function useCreateUserMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UserCreate) => userService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}

export function useUpdateUserMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UserUpdate }) =>
            userService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}

export function useDeleteUserMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => userService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}
