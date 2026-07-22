"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Lock, Mail, AlertTriangle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/navigation"; // wait, Link should be imported from next/link! Let's use standard a tag or next/link. Yes, next/link is correct!

// Let's import Link from 'next/link' below
import NextLink from "next/link";

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFields>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFields) => {
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            await login({
                email: data.email,
                password: data.password,
            });
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (typeof detail === "string") {
                setErrorMsg(detail);
            } else if (Array.isArray(detail)) {
                setErrorMsg(detail.map((d: any) => d.msg || JSON.stringify(d)).join(", "));
            } else {
                setErrorMsg("Authentication failed. Check your credentials.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black px-4 py-12 sm:px-6 lg:px-8">
            {/* Background Decorative Rings */}
            <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/10 blur-[80px]" />
            <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-emerald-500/5 blur-[100px]" />

            <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/40 bg-indigo-950/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                        <Shield className="h-6 w-6 animate-pulse" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
                        NetShield <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
                    </h2>
                    <p className="mt-2 text-center text-xs tracking-wider text-slate-400 uppercase">
                        Security Operations Dashboard
                    </p>
                </div>

                {errorMsg && (
                    <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-400">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <p>{errorMsg}</p>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Console Email
                            </label>
                            <div className="relative mt-1">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    {...register("email")}
                                    className={`block w-full rounded-lg border bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent ${errors.email
                                        ? "border-red-500/50 focus:ring-red-500/30"
                                        : "border-slate-800/80 focus:ring-indigo-500/30 focus:border-indigo-500/40"
                                        }`}
                                    placeholder="operator@netshield.io"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Access Key
                                </label>
                                <NextLink
                                    href="/forgot-password"
                                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    Forgot Key?
                                </NextLink>
                            </div>
                            <div className="relative mt-1">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    {...register("password")}
                                    className={`block w-full rounded-lg border bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent ${errors.password
                                        ? "border-red-500/50 focus:ring-red-500/30"
                                        : "border-slate-800/80 focus:ring-indigo-500/30 focus:border-indigo-500/40"
                                        }`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative flex w-full justify-center rounded-lg bg-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                        >
                            {isSubmitting ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Access Dashboard <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
