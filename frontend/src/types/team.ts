import { UserResponse } from "./user";

export interface TeamResponse {
    id: string;
    name: string;
    description: string;
    created_at: string;
}

export interface TeamMemberResponse {
    user_id: string;
    role: string;
    team_id: string;
    user?: UserResponse;
    added_at: string;
}

export interface TeamCreate {
    name: string;
    description: string;
}

export interface TeamUpdate {
    name?: string;
    description?: string;
}
