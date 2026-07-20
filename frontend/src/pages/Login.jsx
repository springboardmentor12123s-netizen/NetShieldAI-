import { Eye, EyeOff, LockKeyhole, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (localStorage.getItem("netshield_auth") === "true") {
    return <Navigate replace to="/dashboard" />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/login", form);

      localStorage.setItem("netshield_auth", "true");
      localStorage.setItem("netshield_user", response.data.username);
      localStorage.setItem("netshield_role", response.data.role);
      localStorage.setItem("netshield_name", response.data.name);

      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden p-5">
      <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-cyan/10 blur-[100px]" />
      <div className="absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />

      <section className="panel relative w-full max-w-md p-7 md:p-10">
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
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Username
            </span>
            <span className="relative block">
              <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-600" />
              <input
                autoComplete="username"
                className="input pl-12"
                placeholder="Enter username"
                required
                value={form.username}
                onChange={(event) =>
                  setForm({ ...form, username: event.target.value })
                }
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </span>
            <span className="relative block">
              <LockKeyhole className="absolute left-4 top-3.5 h-5 w-5 text-slate-600" />
              <input
                autoComplete="current-password"
                className="input px-12"
                placeholder="Enter password"
                required
                type={visible ? "text" : "password"}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
              <button
                aria-label="Toggle password"
                className="absolute right-4 top-3.5 text-slate-600 hover:text-slate-300"
                onClick={() => setVisible(!visible)}
                type="button"
              >
                {visible ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </span>
          </label>

          <button className="button-primary w-full" disabled={loading}>
            {loading ? "Authenticating..." : "Access Dashboard"}
          </button>
        </form>

        <p className="mt-7 text-center text-xs text-slate-600">
          Admin: admin/admin123 • Analyst: analyst/analyst123 • Viewer:
          viewer/viewer123
        </p>
      </section>
    </main>
  );
}