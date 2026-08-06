"use client";

import React, { createContext, useContext, useState, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserProfile, LoginCredentials } from "../types/auth";
import authService from "../services/auth.service";

interface AuthContextType {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/register"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const [, startTransition] = useTransition();

    const normalizeUserRole = (u: any) => {
        if (!u) return u;
        const rawRole = u.role || u.role_name || "";
        const role = rawRole.toLowerCase().trim().replace(/\s+/g, "_");
        return { ...u, role };
    };

    const refreshProfile = async () => {
        try {
            const profile = await authService.getProfile();
            const normalized = normalizeUserRole(profile);
            setUser(normalized);
            localStorage.setItem("netshield_user", JSON.stringify(normalized));
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            logout();
        }
    };

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            const response = await authService.login(credentials);
            const { access_token, refresh_token, user: userData } = response.data;
            const normalized = normalizeUserRole(userData);

            localStorage.setItem("netshield_access_token", access_token);
            localStorage.setItem("netshield_refresh_token", refresh_token);
            localStorage.setItem("netshield_user", JSON.stringify(normalized));
            setUser(normalized);

            startTransition(() => {
                router.push("/dashboard");
            });
        } catch (error: any) {
            console.error("Login failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await authService.logout();
        } catch (error) {
            console.warn("Logout request failed on server:", error);
        } finally {
            localStorage.removeItem("netshield_access_token");
            localStorage.removeItem("netshield_refresh_token");
            localStorage.removeItem("netshield_user");
            setUser(null);
            setIsLoading(false);
            startTransition(() => {
                router.push("/login");
            });
        }
    };

    // Perform hydration and route checking
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem("netshield_access_token");
            const storedUser = localStorage.getItem("netshield_user");

            if (storedToken && storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(normalizeUserRole(parsedUser));
                    // Refresh background profile to ensure session is valid
                    const profile = await authService.getProfile();
                    const normalized = normalizeUserRole(profile);
                    setUser(normalized);
                    localStorage.setItem("netshield_user", JSON.stringify(normalized));
                } catch {
                    // If profile fetch fails, force logout
                    localStorage.removeItem("netshield_access_token");
                    localStorage.removeItem("netshield_refresh_token");
                    localStorage.removeItem("netshield_user");
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    // Route guarding logic
    useEffect(() => {
        if (isLoading) return;

        const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
        const token = localStorage.getItem("netshield_access_token");

        if (!token && !isPublic) {
            startTransition(() => {
                router.push("/login");
            });
        } else if (token && isPublic) {
            startTransition(() => {
                router.push("/dashboard");
            });
        }
    }, [pathname, isLoading, router]);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading || PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ? (
                children
            ) : (
                <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
                        <p className="text-sm font-medium tracking-wide text-slate-400">Loading NetShield AI...</p>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
