"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // 1. Point to the correct endpoint
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          // 2. Send it as JSON so FastAPI's Pydantic can read it
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.detail ?? errorData?.message ?? "Invalid credentials";
        throw new Error(message);
      }

      const data = await response.json();
      
      // 3. Store the returned data securely to maintain the session
      localStorage.setItem("token", data.access_token); // FIXED: Added missing token
      localStorage.setItem("username", data.username);
      localStorage.setItem("userRole", data.role); 
      
      // Route all validated users to the shared SOC dashboard
      router.push("/dashboard");
      
    } catch (err) {
      setError("Login failed. Please check your username and password.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2),transparent_35%),linear-gradient(135deg,#020617_0%,#111827_60%,#030712_100%)] px-4 py-12 text-white">
      <div className="mx-auto flex max-w-md flex-col rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white">NetShield AI</h1>
          <p className="mt-2 text-sm text-slate-400">Security Operations Portal</p>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">User Id</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              placeholder="e.g., a@gmail.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Authenticate
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Forgot your password?{" "}
          <Link href="/forgot" className="font-medium text-blue-400 transition hover:text-blue-300">
            Reset it here
          </Link>
        </div>
        <div className="mt-3 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-blue-400 transition hover:text-blue-300">
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
}