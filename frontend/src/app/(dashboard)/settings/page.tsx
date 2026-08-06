"use client";

import React, { useState } from "react";
import { Sliders, Bell, Volume2, Save, Sun, HelpCircle, Key, ShieldAlert } from "lucide-react";

export default function SettingsPage() {
    const [theme, setTheme] = useState("dark");
    const [density, setDensity] = useState("comfortable");
    const [alertSound, setAlertSound] = useState(true);
    const [alertThreshold, setAlertThreshold] = useState("high");
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback("Console preference configurations successfully persisted.");
        setTimeout(() => setFeedback(null), 3000);
    };

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Header section */}
            <div>
                <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    Console Settings
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                    Configure operator portal interfaces, alert thresholds, and system preferences
                </p>
            </div>

            {feedback && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-4 text-xs font-semibold text-emerald-450">
                    {feedback}
                </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Visual Customization Group */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                    <h3 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2 border-b border-slate-900 pb-3">
                        <Sliders className="h-4.5 w-4.5 text-indigo-400" />
                        Visual Configuration & UX
                    </h3>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Theme Select */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                Interface Theme
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setTheme("dark")}
                                    className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 transition-all ${theme === "dark"
                                        ? "border-indigo-500/40 bg-indigo-950/20 text-indigo-455"
                                        : "border-slate-850 bg-slate-950 text-slate-500"
                                        }`}
                                >
                                    Dark Console Mode
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTheme("light")}
                                    className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 transition-all ${theme === "light"
                                        ? "border-indigo-500/40 bg-indigo-950/20 text-indigo-455"
                                        : "border-slate-850 bg-slate-950 text-slate-500"
                                        }`}
                                >
                                    Light Console Mode
                                </button>
                            </div>
                        </div>

                        {/* Density Select */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                Interface Density
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setDensity("comfortable")}
                                    className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 transition-all ${density === "comfortable"
                                        ? "border-indigo-500/40 bg-indigo-950/20 text-indigo-455"
                                        : "border-slate-850 bg-slate-950 text-slate-500"
                                        }`}
                                >
                                    Comfortable
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDensity("compact")}
                                    className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 transition-all ${density === "compact"
                                        ? "border-indigo-500/40 bg-indigo-950/20 text-indigo-455"
                                        : "border-slate-850 bg-slate-950 text-slate-500"
                                        }`}
                                >
                                    Compact
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications & Audios */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                    <h3 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2 border-b border-slate-900 pb-3">
                        <Bell className="h-4.5 w-4.5 text-cyan-400" />
                        Notification Trigger Thresholds
                    </h3>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Audio Warnings Toggle */}
                        <div className="flex items-center justify-between rounded-lg border border-slate-900 bg-slate-950/40 p-4">
                            <div className="space-y-0.5">
                                <span className="block text-xs font-bold text-white flex items-center gap-1.5">
                                    <Volume2 className="h-4 w-4 text-slate-400" />
                                    Alert Audio Beep
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                    Trigger audio indicator on incoming critical threat alarms.
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAlertSound(!alertSound)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${alertSound ? "bg-indigo-650" : "bg-slate-800"
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${alertSound ? "translate-x-5" : "translate-x-0"
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Dropdown severity threshold */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                Alert Ingestion Target
                            </label>
                            <select
                                value={alertThreshold}
                                onChange={(e) => setAlertThreshold(e.target.value)}
                                className="w-full rounded-lg border border-slate-850 bg-slate-950 py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                            >
                                <option value="all">Log All Events (Info+)</option>
                                <option value="medium">Warning Level & Above (Medium+)</option>
                                <option value="high">High Threat Ingest Class (High+)</option>
                                <option value="critical">Critical Anomaly Ingest only (Critical)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* API Authorization clearances */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                    <h3 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2 border-b border-slate-900 pb-3">
                        <Key className="h-4.5 w-4.5 text-emerald-400" />
                        API Keys & Access Management
                    </h3>

                    <div className="space-y-3 font-mono text-xs text-slate-400">
                        <div className="flex items-center justify-between border-b border-slate-900/50 py-2">
                            <span>Ingestion Feed Secret</span>
                            <span className="text-white text-[11px]">sec_ingest_••••••••••••3aB9</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-900/50 py-2">
                            <span>Machine Learning Inference Token</span>
                            <span className="text-white text-[11px]">tok_ml_fit_••••••••••••9eC5</span>
                        </div>
                    </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="rounded-lg bg-indigo-650 hover:bg-indigo-650 text-white font-semibold py-2.5 px-5 text-[10px] uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" /> Save Preferences
                    </button>
                </div>
            </form>
        </div>
    );
}
