import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Shield } from "lucide-react";
import { AuthAPI } from "@/lib/api";
import "@/styles/app.css";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login" },
      { name: "description", content: "Network Security Dashboard Login" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setBusy(true);
    setErr(null);

    try {
      const res = await AuthAPI.login(email, password);

      const token = res.access_token ?? "";

      localStorage.setItem("auth_token", token);

      router.navigate({ to: "/" });
    } catch (e: any) {
      setErr(
        e?.response?.data?.detail ??
          e?.message ??
          "Invalid Credentials"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={onSubmit}>
        <div className="login__brand">
          <span className="navbar__brand-mark">
            <Shield size={13} strokeWidth={2.4} />
          </span>

          <div>
            <div className="login__title">
              Login
            </div>

            <div className="login__sub">
              Network Security Dashboard
            </div>
          </div>
        </div>

        <div className="login__field">
          <label>Email</label>

          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="login__field">
          <label>Password</label>

          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {err && (
          <div className="login__error">
            {err}
          </div>
        )}

        <button
          type="submit"
          className="btn btn--primary login__btn"
          disabled={busy}
        >
          {busy ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;