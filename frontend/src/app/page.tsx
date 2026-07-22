import Link from "next/link";

const highlights = [
  "Realtime traffic monitoring",
  "Adaptive threat detection",
  "Role-based analyst workflows",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),linear-gradient(135deg,#020617_0%,#111827_60%,#030712_100%)] px-6 py-16 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-blue-950/30 backdrop-blur md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300">
                NetShield AI • Secure Operations Center
              </span>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Protect every network edge with clarity, speed, and confidence.
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                NetShield AI gives administrators and analysts a modern control center for monitoring traffic, validating alerts, and responding to threats with less noise.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-full bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500"
                >
                  Open portal
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-200 transition hover:border-blue-400 hover:text-white"
                >
                  Create account
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Operational readiness</p>
              <div className="mt-4 space-y-4">
                {highlights.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="text-sm text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
