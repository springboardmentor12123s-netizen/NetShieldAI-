"use client";

import React, { useState } from "react";
import { User, Shield, Key, Mail, Terminal, Calendar, Award } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
    const { user } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);
    const [profileName, setProfileName] = useState(user?.full_name || "");
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setFeedback(null);

        // Simulate updating name
        setTimeout(() => {
            setIsUpdating(false);
            setFeedback("Operations profile configuration successfully updated.");
        }, 1000);
    };

    if (!user) {
        return (
            <div className="flex h-64 items-center justify-center text-slate-500">
                Authenticating session...
            </div>
        );
    }

    // System permissions based on role
    const getPermissions = () => {
        if (user.role === "admin") {
            return ["Manage Users", "Deprovision Keys", "Configure RBAC Matrix", "Audit Inspection", "Read Network Packets"];
        }
        if (user.role === "security_analyst") {
            return ["Read Network Packets", "Aggregated Traffic Analytics", "View Squad Container"];
        }
        return ["Read Raw Package Logs"];
    };

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Upper header */}
            <div>
                <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    Profile & Security Settings
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                    Manage your operations session and review console system clearance
                </p>
            </div>

            {feedback && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-4 text-xs font-semibold text-emerald-450">
                    {feedback}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Card: Summary */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-6 md:col-span-1 text-center flex flex-col items-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-indigo-950/40 border-2 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                        <User className="h-10 w-10" />
                        <span className="absolute bottom-0 right-0 rounded-full bg-emerald-500 border-2 border-slate-950 px-1 py-1 h-4.5 w-4.5" />
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-white">{user.full_name}</h3>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold mt-1 block">
                            Clearance: {user.role}
                        </span>
                    </div>

                    <div className="w-full border-t border-slate-900 pt-4 text-xs font-mono space-y-2.5 text-left text-slate-400">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-600 shrink-0" />
                            <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-600 shrink-0" />
                            <span>Created: {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Right Pane: Forms + Permissions */}
                <div className="md:col-span-2 space-y-6">
                    {/* Settings form */}
                    <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm">
                        <h3 className="text-sm font-semibold tracking-wide text-white mb-4 flex items-center gap-2">
                            <Terminal className="h-4.5 w-4.5 text-indigo-400" />
                            Profile Details
                        </h3>

                        <form onSubmit={handleUpdateProfile} className="space-y-4 font-mono text-xs">
                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Console Operator Name</label>
                                <input
                                    type="text"
                                    required
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Hashed Credentials Secret</label>
                                <input
                                    type="password"
                                    disabled
                                    placeholder="••••••••••••••••"
                                    className="w-full rounded-lg border border-slate-850 bg-slate-950/40 py-2.5 px-3 text-xs text-slate-600 focus:outline-none cursor-not-allowed"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-semibold px-4 py-2.5 text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                >
                                    {isUpdating ? "Updating..." : "Persist Configuration"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* System Clearance matrix */}
                    <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm">
                        <h3 className="text-sm font-semibold tracking-wide text-white mb-4 flex items-center gap-2">
                            <Award className="h-4.5 w-4.5 text-cyan-400" />
                            Hashed Access Permissions Clearance
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            {getPermissions().map((perm) => (
                                <span
                                    key={perm}
                                    className="rounded bg-indigo-950/40 border border-indigo-900/30 px-3 py-1 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1.5"
                                >
                                    <Shield className="h-3 w-3" />
                                    {perm}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
