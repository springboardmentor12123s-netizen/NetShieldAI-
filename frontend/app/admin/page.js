"use client";

import { useEffect, useState } from "react";

export default function AdminPanel() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      setError("You're not logged in. Please log in first.");
      return;
    }

    if (role !== "admin") {
      setError("Access denied. Admins only.");
      return;
    }

    fetch("http://127.0.0.1:8000/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch users (status " + res.status + ")");
        }
        return res.json();
      })
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-slate-900/70 border border-red-500/30 rounded-2xl p-8 text-center">
          <p className="text-red-400">{error}</p>
          <a
            href="/"
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 underline"
          >
            Go to login
          </a>
        </div>
      </main>
    );
  }

  if (!users) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <p className="text-slate-400">Loading admin panel...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-500 text-sm">Manage system users</p>
          </div>
          <a href="/" className="text-slate-400 hover:text-white text-sm underline">
            Back to home
          </a>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-slate-400 text-sm font-medium">Username</th>
                <th className="px-6 py-3 text-slate-400 text-sm font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="px-6 py-3 text-white">{u.username}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
