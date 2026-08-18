// frontend/src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiBaseUrl } from "../../lib/api";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "Security Analyst",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const apiBaseUrl = getApiBaseUrl();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          full_name: formData.fullName.trim(),
          password: formData.password,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const detail = errorData.detail ?? errorData.message ?? "Registration failed";
        const formattedError = typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => `${item.loc?.join(".")}: ${item.msg}`).join("; ")
            : JSON.stringify(detail);
        throw new Error(formattedError);
      }

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred."); // <-- This prints the raw error to your F12 Console
      
      // Safety check in case FastAPI sends an array instead of a string
      if (typeof err.message === 'string') {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Check the console.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2),transparent_35%),linear-gradient(135deg,#020617_0%,#111827_60%,#030712_100%)] px-4 py-12 text-white">
      <div className="mx-auto flex max-w-md flex-col rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white">Join NetShield AI</h1>
          <p className="mt-2 text-sm text-slate-400">Create your security operations account</p>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              placeholder="abc"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              placeholder="abc@gmail.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Account Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            >
              <option value="Security Analyst">Security Analyst</option>
              <option value="SOC Team">SOC Team</option>
              <option value="Enterprises">Enterprise Client</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={success}
            className="w-full rounded-full bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-400 transition hover:text-blue-300">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}