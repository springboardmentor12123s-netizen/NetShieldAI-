import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Mail, Lock, Loader2, ArrowRight, ShieldCheck, Radar, Brain } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — NetShield AI" },
      { name: "description", content: "Sign in to NetShield AI SOC platform." },
    ],
  }),
  component: () => (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  ),
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("rahul@gmail.com");
  const [password, setPassword] = useState("123456");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      window.location.href = "/";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-sidebar border-r border-sidebar-border">
        <div className="absolute inset-0 bg-gradient-glow opacity-70" />
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 0.6) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.6) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold">NetShield AI</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">SOC Platform</div>
          </div>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-safe pulse-dot" />
            Live threat intelligence feed connected
          </div>
          <h1 className="text-4xl xl:text-5xl font-semibold leading-tight max-w-md">
            See every packet. <span className="text-gradient-primary">Predict every threat.</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-md">
            AI-powered network anomaly detection and intrusion prediction for
            modern Security Operations Centers.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { icon: Radar, label: "Real-time capture" },
              { icon: Brain, label: "ML anomaly engine" },
              { icon: ShieldCheck, label: "MITRE ATT&CK" },
            ].map((f) => (
              <div key={f.label} className="glass-card p-3">
                <f.icon className="h-4 w-4 text-primary" />
                <div className="mt-2 text-xs text-muted-foreground">{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} NetShield AI · SOC 2 · ISO 27001
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">NetShield AI</span>
          </div>
          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to continue to your SOC dashboard.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Email</span>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 rounded-lg bg-muted/40 border border-border pl-9 pr-3 text-sm focus:outline-none focus:border-primary/60"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Password</span>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 rounded-lg bg-muted/40 border border-border pl-9 pr-3 text-sm focus:outline-none focus:border-primary/60"
                  placeholder="••••••••"
                  required
                />
              </div>
            </label>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-border bg-muted/40 accent-primary"
                />
                Remember me
              </label>
              <a href="#" className="text-primary hover:underline">Forgot password?</a>
            </div>

            {error && (
              <div className="rounded-lg border border-critical/40 bg-critical/10 text-critical text-xs p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-gradient-primary text-primary-foreground font-medium inline-flex items-center justify-center gap-2 shadow-elegant hover:opacity-95 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>

            <div className="text-[11px] text-muted-foreground text-center">
              Demo Credentials:
              <br />
              <strong>rahul@gmail.com / 123456</strong>
              
              <span className="font-mono text-foreground/80"> admin </span>/
              <span className="font-mono text-foreground/80"> engineer </span>/
              <span className="font-mono text-foreground/80"> read </span> switch roles.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
