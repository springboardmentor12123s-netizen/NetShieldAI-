"use client";

import React, { useState } from "react";
import { UserSquare2, RefreshCw, Plus, Trash2, X, Users, ShieldAlert, CheckCircle, ChevronRight, UserPlus, UserMinus } from "lucide-react";
import { useTeamsQuery, useCreateTeamMutation, useDeleteTeamMutation, useTeamMembersQuery, useAddTeamMemberMutation, useRemoveTeamMemberMutation } from "@/hooks/use-teams";
import { useUsersQuery } from "@/hooks/use-users";
import { TeamResponse, TeamMemberResponse } from "@/types/team";

export default function TeamsManagementPage() {
    const { data: teams, isLoading: teamsLoading, refetch } = useTeamsQuery();
    const { data: allUsers } = useUsersQuery();

    const createTeamMutation = useCreateTeamMutation();
    const deleteTeamMutation = useDeleteTeamMutation();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(null);

    // Form states for creating team
    const [teamName, setTeamName] = useState("");
    const [teamDesc, setTeamDesc] = useState("");

    // Member pane active state
    const { data: teamMembers, isLoading: membersLoading } = useTeamMembersQuery(selectedTeam?.id || "");
    const addMemberMutation = useAddTeamMemberMutation(selectedTeam?.id || "");
    const removeMemberMutation = useRemoveTeamMemberMutation(selectedTeam?.id || "");

    // Form states for adding member
    const [addUserId, setAddUserId] = useState("");
    const [memberRole, setMemberRole] = useState("operator");

    // Mock list items fallback if database stands unpopulated
    const mockTeams: TeamResponse[] = [
        {
            id: "t-1",
            name: "Alpha Threat Response",
            description: "Primary incident responders for infrastructure anomalies detection",
            created_at: new Date().toISOString(),
        },
        {
            id: "t-2",
            name: "Beta Analytics Squad",
            description: "Dedicated to security models profiling and traffic analysis optimization",
            created_at: new Date().toISOString(),
        },
    ];

    const mockMembers: TeamMemberResponse[] = [
        {
            user_id: "u-2",
            role: "lead",
            team_id: "t-1",
            user: {
                id: "u-2",
                email: "analyst@netshield.io",
                full_name: "Bruce Wayne",
                role: "security_analyst",
                is_active: true,
                created_at: new Date().toISOString(),
            },
            added_at: new Date().toISOString(),
        },
    ];

    const teamList = teams && teams.length > 0 ? teams : mockTeams;
    const memberList = teamMembers && teamMembers.length > 0 ? teamMembers : (selectedTeam?.id === "t-1" ? mockMembers : []);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTeamMutation.mutateAsync({
                name: teamName,
                description: teamDesc,
            });
            setIsCreateOpen(false);
            setTeamName("");
            setTeamDesc("");
        } catch (err) {
            console.error("Failed to create team:", err);
        }
    };

    const handleDeleteTeam = async (id: string) => {
        if (confirm("Are you sure you want to deprovision this operations team squad container?")) {
            try {
                await deleteTeamMutation.mutateAsync(id);
                if (selectedTeam?.id === id) {
                    setSelectedTeam(null);
                }
            } catch (err) {
                console.error("Failed to delete team:", err);
            }
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeam || !addUserId) return;
        try {
            await addMemberMutation.mutateAsync({
                userId: addUserId,
                role: memberRole,
            });
            setAddUserId("");
            setMemberRole("operator");
        } catch (err) {
            console.error("Failed to add member:", err);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!selectedTeam) return;
        if (confirm("Remove this operator from this active response squad?")) {
            try {
                await removeMemberMutation.mutateAsync(userId);
            } catch (err) {
                console.error("Failed to remove member:", err);
            }
        }
    };

    return (
        <div className="space-y-8">
            {/* Upper header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        Team Management Page
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Group operators into incident response squads
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" /> Sync Teams
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-semibold px-4 py-2 text-xs uppercase tracking-wider transition-all"
                    >
                        <Plus className="h-4 w-4" /> Provision Team
                    </button>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: Teams list */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-xl border border-slate-900 bg-slate-900/10 overflow-hidden backdrop-blur-sm">
                        <div className="p-4 bg-slate-950/40 border-b border-slate-900 flex justify-between">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                Operating Squad Container Registry
                            </span>
                        </div>

                        <div className="divide-y divide-slate-900">
                            {teamsLoading ? (
                                Array.from({ length: 2 }).map((_, r) => (
                                    <div key={r} className="p-6 animate-pulse space-y-2">
                                        <div className="h-4 bg-slate-900 rounded w-1/3" />
                                        <div className="h-3 bg-slate-900 rounded w-2/3" />
                                    </div>
                                ))
                            ) : (
                                teamList.map((team) => {
                                    const isActive = selectedTeam?.id === team.id;
                                    return (
                                        <div
                                            key={team.id}
                                            className={`p-6 flex items-start justify-between gap-4 cursor-pointer hover:bg-indigo-950/5 transition-all text-left ${isActive ? "bg-indigo-950/15 border-l-2 border-indigo-500" : ""
                                                }`}
                                            onClick={() => {
                                                setSelectedTeam(team);
                                                setAddUserId("");
                                            }}
                                        >
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-white text-sm">{team.name}</h4>
                                                    <ChevronRight className="h-3.5 w-3.5 text-slate-650" />
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xl">
                                                    {team.description}
                                                </p>
                                                <span className="text-[10px] text-slate-500 font-mono block">
                                                    ID: {team.id} | Provisioned: {new Date(team.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTeam(team.id);
                                                }}
                                                className="rounded border border-slate-800 bg-slate-950/20 p-2 text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Members details dashboard panel */}
                <div className="lg:col-span-1">
                    {selectedTeam ? (
                        <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-white">{selectedTeam.name}</h3>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                                        Squad Roster
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedTeam(null)}
                                    className="rounded p-1 text-slate-500 hover:bg-slate-900 hover:text-white transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Members List */}
                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                                {membersLoading ? (
                                    <div className="py-8 text-center text-slate-500">Retrieving members...</div>
                                ) : memberList.length === 0 ? (
                                    <div className="py-8 text-center text-slate-600 text-xs italic">
                                        No active operator assigned to squad.
                                    </div>
                                ) : (
                                    memberList.map((member) => (
                                        <div
                                            key={member.user_id}
                                            className="flex items-center justify-between rounded-lg border border-slate-850 bg-slate-950/40 p-3"
                                        >
                                            <div>
                                                <span className="font-semibold text-xs text-white block">
                                                    {member.user?.full_name || "Unknown Operator"}
                                                </span>
                                                <span className="text-[9px] text-slate-500 font-mono capitalize">
                                                    Role: {member.role}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMember(member.user_id)}
                                                className="rounded hover:bg-red-950/20 p-1.5 text-slate-505 hover:text-red-400 transition-colors"
                                                title="Remove operator from team"
                                            >
                                                <UserMinus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Member Form */}
                            <form onSubmit={handleAddMember} className="border-t border-slate-900 pt-4 space-y-4">
                                <span className="block text-[10px] font-semibold text-slate-450 uppercase tracking-widest font-mono">
                                    Enlist Member
                                </span>

                                <div className="space-y-3 font-mono text-xs">
                                    <div>
                                        <label className="block text-[9px] text-slate-500 uppercase tracking-wide mb-1">Select Operator</label>
                                        <select
                                            required
                                            value={addUserId}
                                            onChange={(e) => setAddUserId(e.target.value)}
                                            className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="">Choose User...</option>
                                            {allUsers?.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.full_name} ({user.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[9px] text-slate-500 uppercase tracking-wide mb-1">Operational Role</label>
                                        <select
                                            value={memberRole}
                                            onChange={(e) => setMemberRole(e.target.value)}
                                            className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="lead">Squad Leader</option>
                                            <option value="analyst">Security Analyst</option>
                                            <option value="operator">Operator</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={addMemberMutation.isPending || !addUserId}
                                    className="flex w-full justify-center items-center gap-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-semibold py-2 px-4 text-xs uppercase tracking-wider transition-all disabled:opacity-35"
                                >
                                    <UserPlus className="h-4 w-4" /> Assign Member
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/5 p-8 text-center text-slate-500 text-sm flex flex-col items-center justify-center min-h-[300px]">
                            <Users className="h-8 w-8 text-slate-700 animate-pulse mb-3" />
                            <p>Select a response squad from the directory to configure team memberships and roles.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Provision Squad Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <UserSquare2 className="h-5 w-5 text-indigo-400" />
                                Provision Operations Squad
                            </h3>
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-950 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-mono">
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Squad Name</label>
                                <input
                                    type="text"
                                    required
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="Sigma Ingress Response"
                                    className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Focus Scope & Purpose</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={teamDesc}
                                    onChange={(e) => setTeamDesc(e.target.value)}
                                    placeholder="Detail operations focus..."
                                    className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-sans"
                                />
                            </div>

                            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-900">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 font-semibold px-4 py-2.5 text-[10px] uppercase tracking-wider transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createTeamMutation.isPending}
                                    className="rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-semibold px-4 py-2.5 text-[10px] uppercase tracking-wider transition-all"
                                >
                                    Create Squad
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
