import { ChevronDown, Eye, EyeOff, LockKeyhole, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../services/api";

// Role options for the "Login As" convenience dropdown.
const ROLE_OPTIONS = [
  { label: "Admin", username: "admin", hint: "admin / admin123" },
  { label: "Security Analyst", username: "analyst", hint: "analyst / analyst123" },
  { label: "Viewer", username: "viewer", hint: "viewer / viewer123" },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(ROLE_OPTIONS[0]);
  const [form, setForm] = useState({ username: ROLE_OPTIONS[0].username, password: "" });
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (localStorage.getItem("netshield_auth") === "true") {
    return <Navigate replace to="/dashboard" />;
  }

  const handleRoleChange = (event) => {
    const chosen = ROLE_OPTIONS.find((r) => r.label === event.target.value) || ROLE_OPTIONS[0];
    setSelectedRole(chosen);
    // Auto-fill username based on selected role; password stays blank for security.
    setForm((prev) => ({ ...prev, username: chosen.username }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Always send actual credentials to the backend — the dropdown is UX only.
      const response = await api.post("/login", {
        username: form.username,
        password: form.password,
      });

      // Store role/name returned by the backend, not the dropdown selection.
      localStorage.setItem("netshield_auth", "true");
      localStorage.setItem("netshield_user", response.data.username);
      localStorage.setItem("netshield_role", response.data.role);
      localStorage.setItem("netshield_name", response.data.name);

      toast.success(`Welcome, ${response.data.name}!`);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden p-5">
      {/* Background glow blobs */}
      <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-cyan/10 blur-[100px]" />
      <div className="absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />

      <section className="panel relative w-full max-w-md p-7 md:p-10">
        {/* Logo & title */}
        <div className="mb-8 text-center">
          <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-cyan text-ink shadow-glow">
            <ShieldCheck className="h-9 w-9" />
          </span>
          <h1 className="text-3xl font-bold text-white">
            NetShield <span className="text-cyan">AI</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Network anomaly detection console
          </p>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          {/* Login As (role selector) */}
          <label className="block" id="login-role-label">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Login As
            </span>
            <span className="relative block">
              <select
                aria-labelledby="login-role-label"
                className="input appearance-none pr-10"
                value={selectedRole.label}
                onChange={handleRoleChange}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 text-slate-500" />
            </span>
            <span className="mt-1 block text-xs text-slate-600">
              Hint: <span className="text-slate-400">{selectedRole.hint}</span>
            </span>
          </label>

          {/* Username */}
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Username
            </span>
            <span className="relative block">
              <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-600" />
              <input
                autoComplete="username"
                className="input pl-12"
                id="login-username"
                placeholder="Enter username"
                required
                value={form.username}
                onChange={(event) =>
                  setForm({ ...form, username: event.target.value })
                }
              />
            </span>
          </label>

          {/* Password */}
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </span>
            <span className="relative block">
              <LockKeyhole className="absolute left-4 top-3.5 h-5 w-5 text-slate-600" />
              <input
                autoComplete="current-password"
                className="input px-12"
                id="login-password"
                placeholder="Enter password"
                required
                type={visible ? "text" : "password"}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
              <button
                aria-label="Toggle password visibility"
                className="absolute right-4 top-3.5 text-slate-600 hover:text-slate-300"
                onClick={() => setVisible(!visible)}
                type="button"
              >
                {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </span>
          </label>

          <button
            className="button-primary w-full"
            disabled={loading}
            id="login-submit"
          >
            {loading ? "Authenticating..." : "Access Dashboard"}
          </button>
        </form>

        {/* Role-based credential reference */}
        <div className="mt-7 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-500">
          <p className="mb-2 font-semibold uppercase tracking-wider text-slate-400">
            Demo Credentials
          </p>
          <div className="space-y-1">
            <p>
              <span className="text-cyan">Admin</span>
              {" "}— admin / admin123{" "}
              <span className="text-slate-600">(full access)</span>
            </p>
            <p>
              <span className="text-violet-400">Security Analyst</span>
              {" "}— analyst / analyst123{" "}
              <span className="text-slate-600">(full operational)</span>
            </p>
            <p>
              <span className="text-amber-400">Viewer</span>
              {" "}— viewer / viewer123{" "}
              <span className="text-slate-600">(read-only)</span>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}