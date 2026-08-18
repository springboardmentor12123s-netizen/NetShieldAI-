"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Unable to send reset link.");
      }

      setMessage(data.message ?? "If an account exists for that email, reset instructions have been sent.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset link. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2),transparent_35%),linear-gradient(135deg,#020617_0%,#111827_60%,#030712_100%)] px-4 py-12 text-white">
      <div className="mx-auto flex max-w-md flex-col rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white">Forgot Password</h1>
          <p className="mt-2 text-sm text-slate-400">Enter the email for your account to receive reset instructions.</p>
        </div>

        {submitted ? (
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-sm text-emerald-200">
            <p className="font-medium text-emerald-100">Request received.</p>
            <p className="mt-2 text-slate-300">
              {message || (
                <>If an account exists for <span className="font-semibold text-white">{email}</span>, you will receive reset instructions shortly.</>
              )}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              Send reset link
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-400">
          Remembered your password?{" "}
          <Link href="/login" className="font-medium text-blue-400 transition hover:text-blue-300">
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
