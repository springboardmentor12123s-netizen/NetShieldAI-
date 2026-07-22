"use client";

import React, { useState } from "react";
import { UserCheck, ShieldAlert, Trash2, Edit, Plus, RefreshCw, X, Check, Shield } from "lucide-react";
import { useUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from "@/hooks/use-users";
import { useTeamsQuery } from "@/hooks/use-teams";
import { UserResponse, UserCreate, UserUpdate } from "@/types/user";

export default function UsersManagementPage() {
    const { data: users, isLoading, refetch } = useUsersQuery();
    const { data: teams } = useTeamsQuery();

    const createUserMutation = useCreateUserMutation();
    const updateUserMutation = useUpdateUserMutation();
    const deleteUserMutation = useDeleteUserMutation();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserResponse | null>(null);

    // Form States
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("operator");
    const [teamId, setTeamId] = useState("");
    const [isActive, setIsActive] = useState(true);

    // Mock list items fallback if database stands unpopulated
    const mockUsers: UserResponse[] = [
        {
            id: "u-1",
            email: "admin@netshield.io",
            full_name: "Goutham S",
            role: "admin",
            team_id: "t-1",
            is_active: true,
            created_at: new Date().toISOString(),
        },
        {
            id: "u-2",
            email: "analyst@netshield.io",
            full_name: "Bruce Wayne",
            role: "security_analyst",
            team_id: "t-1",
            is_active: true,
            created_at: new Date().toISOString(),
        },
        {
            id: "u-3",
            email: "operator@netshield.io",
            full_name: "Clark Kent",
            role: "operator",
            team_id: null,
            is_active: false,
            created_at: new Date().toISOString(),
        },
    ];

    const userList = users && users.length > 0 ? users : mockUsers;

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createUserMutation.mutateAsync({
                email,
                full_name: fullName,
                password,
                role,
                team_id: teamId || null,
            });
            setIsAddOpen(false);
            resetForm();
        } catch (err) {
            console.error("Failed to create user:", err);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            await updateUserMutation.mutateAsync({
                id: editingUser.id,
                data: {
                    email,
                    full_name: fullName,
                    role,
                    team_id: teamId || null,
                    is_active: isActive,
                },
            });
            setEditingUser(null);
            resetForm();
        } catch (err) {
            console.error("Failed to update user:", err);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm("Are you sure you want to deprovision this security operator access key?")) {
            try {
                await deleteUserMutation.mutateAsync(id);
            } catch (err) {
                console.error("Failed to delete user:", err);
            }
        }
    };

    const resetForm = () => {
        setFullName("");
        setEmail("");
        setPassword("");
        setRole("operator");
        setTeamId("");
        setIsActive(true);
    };

    const handleOpenEdit = (user: UserResponse) => {
        setEditingUser(user);
        setFullName(user.full_name);
        setEmail(user.email);
        setRole(user.role);
        setTeamId(user.team_id || "");
        setIsActive(user.is_active);
    };

    return (
        <div className="space-y-8">
            {/* Upper header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        User Operations Panel
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Deprovision access keys and delegate admin privileges
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" /> Sync Users
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            setIsAddOpen(true);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-semibold px-4 py-2 text-xs uppercase tracking-wider transition-all"
                    >
                        <Plus className="h-4 w-4" /> Provision Operator
                    </button>
                </div>
            </div>

            {/* Main Grid Table */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/10 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-900 bg-slate-950/50 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                <th className="py-4 px-6">Identified Name</th>
                                <th className="py-4 px-6">Access Role</th>
                                <th className="py-4 px-6">Assigned Squad Container</th>
                                <th className="py-4 px-6 text-center">Status</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/80 text-sm">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, r) => (
                                    <tr key={r} className="animate-pulse">
                                        <td colSpan={5} className="py-6 px-6">
                                            <div className="h-4 rounded bg-slate-900/50 w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                userList.map((user) => {
                                    const roleColors = {
                                        admin: "bg-indigo-950/40 border-indigo-900/40 text-indigo-400",
                                        security_analyst: "bg-cyan-950/40 border-cyan-900/40 text-cyan-400",
                                        operator: "bg-slate-900/50 border-slate-800 text-slate-400",
                                    }[user.role] || "bg-slate-900/50 border-slate-800 text-slate-400";

                                    // Find team name
                                    const currentTeam = teams?.find((t) => t.id === user.team_id);

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-900/20 text-slate-350">
                                            <td className="py-4 px-6">
                                                <span className="font-semibold text-white block">{user.full_name}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">{user.email}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold font-mono uppercase ${roleColors}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 font-medium text-xs text-slate-300">
                                                {currentTeam ? currentTeam.name : <span className="text-slate-600 italic">None</span>}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${user.is_active
                                                        ? "bg-emerald-950/10 border-emerald-900/30 text-emerald-400"
                                                        : "bg-red-950/10 border-red-900/30 text-red-400"
                                                    }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                                                    {user.is_active ? "Permitted" : "Suspended"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEdit(user)}
                                                        className="inline-flex rounded-lg border border-slate-800 bg-slate-950/50 p-2 text-indigo-400 hover:bg-slate-800 hover:text-white transition-colors"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        disabled={user.role === "admin"}
                                                        className="inline-flex rounded-lg border border-slate-800 bg-slate-950/50 p-2 text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Provision Operator Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-indigo-400" />
                                Provision Operations Profile
                            </h3>
                            <button
                                onClick={() => setIsAddOpen(false)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-950 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-mono">
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Authorized Name</label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Diana Prince"
                                    className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Operator Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="analyst.diana@netshield.io"
                                    className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Default Secret Key</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-xs text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Security Role</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="operator">Operator</option>
                                        <option value="security_analyst">Security Analyst</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Squad Team</label>
                                    <select
                                        value={teamId}
                                        onChange={(e) => setTeamId(e.target.value)}
                                        className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="">No Team</option>
                                        {teams?.map((team) => (
                                            <option key={team.id} value={team.id}>
                                                {team.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-900">
                                <button
                                    type="button"
                                    onClick={() => setIsAddOpen(false)}
                                    className="rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 text-[10px] uppercase tracking-wider transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createUserMutation.isPending}
                                    className="rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-semibold px-4 py-2.5 text-[10px] uppercase tracking-wider transition-all"
                                >
                                    Provision Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Operator Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Edit className="h-5 w-5 text-indigo-400" />
                                Modify Operator Settings
                            </h3>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-950 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-mono">
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Operator Name</label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Operator Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    disabled={editingUser.role === "admin"}
                                    className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                                >
                                    <option value="operator">Operator</option>
                                    <option value="security_analyst">Security Analyst</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-505 uppercase tracking-wide mb-1.5">Squad Team</label>
                                <select
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    className="w-full rounded-lg border border-slate-855 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">No Team</option>
                                    {teams?.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {editingUser.role !== "admin" && (
                                <div className="flex items-center gap-3 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-indigo-650 focus:ring-indigo-500/20"
                                    />
                                    <label htmlFor="isActive" className="text-xs text-slate-350 cursor-pointer">
                                        Grant Active Security Clearance
                                    </label>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-900">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 text-[10px] uppercase tracking-wider transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateUserMutation.isPending}
                                    className="rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-semibold px-4 py-2.5 text-[10px] uppercase tracking-wider transition-all"
                                >
                                    Update Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
