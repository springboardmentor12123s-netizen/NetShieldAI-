import { hasPermission } from "../utils/permissions";
import {
  Bell,
  BrainCircuit,
  Database,
  FileBarChart2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanSearch,
  ShieldCheck,
  X,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useLiveData } from "../context/LiveDataContext";

const links = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: "dashboard",
  },
  {
    to: "/upload",
    label: "Upload Dataset",
    icon: Database,
    permission: "upload",
  },
  {
    to: "/train",
    label: "Train Model",
    icon: BrainCircuit,
    permission: "train",
  },
  {
    to: "/predict",
    label: "Prediction",
    icon: ScanSearch,
    permission: "predict",
  },
  {
    to: "/alerts",
    label: "Alerts",
    icon: Bell,
    permission: "alerts",
  },
  {
    to: "/history",
    label: "History",
    icon: History,
    permission: "history",
  },
  {
    to: "/threat-report",
    label: "Threat Report",
    icon: FileBarChart2,
    permission: "reports",
  },
  {
    to: "/incidents",
    label: "Incidents",
    icon: AlertTriangle,
    permission: "alerts",
  },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenFlowIds = useRef(new Set());
  const navigate = useNavigate();
  
  const { predictions } = useLiveData();

  const visibleLinks = links.filter((link) => hasPermission(link.permission));
  const role = localStorage.getItem("netshield_role") || "guest";
  const name = localStorage.getItem("netshield_name") || "User";

  const logout = () => {
    localStorage.removeItem("netshield_auth");
    localStorage.removeItem("netshield_user");
    localStorage.removeItem("netshield_role");
    localStorage.removeItem("netshield_name");
    navigate("/login");
  };

  useEffect(() => {
    if (predictions && predictions.length > 0) {
      const newAlerts = [];
      
      predictions.forEach(p => {
        if (!seenFlowIds.current.has(p.flow_id)) {
          seenFlowIds.current.add(p.flow_id);
          
          const isAttack = p.prediction_label !== "Normal" || p.severity === "Critical";
          
          if (isAttack) {
            newAlerts.push(p);
            
            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} pointer-events-auto flex w-full max-w-md rounded-xl border-l-4 border-red-500 bg-slate-900 shadow-2xl ring-1 ring-white/10`}>
                <div className="w-0 flex-1 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-bold text-white">Threat Detected!</p>
                      <p className="mt-1 text-xs text-slate-300">
                        <span className="font-semibold text-rose-400">{p.predicted_class}</span> • 
                        Severity: <span className="font-medium text-white">{p.severity}</span> • 
                        Risk: <span className="font-medium text-white">{p.risk_score}</span>
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">{new Date(p.prediction_timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ), { duration: 4000 });
          }
        }
      });

      if (newAlerts.length > 0) {
        setAlerts(prev => {
          const updated = [...newAlerts.reverse(), ...prev];
          return updated.slice(0, 100);
        });
        setUnreadCount(prev => prev + newAlerts.length);
      }
    }
  }, [predictions]);

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-800 bg-[#0b1525]">
      <div className="flex h-24 items-center gap-3 px-7">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan text-ink shadow-glow">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <p className="text-lg font-bold text-white">
            NetShield <span className="text-cyan">AI</span>
          </p>
          <p className="text-[10px] font-semibold tracking-[.18em] text-slate-500">
            THREAT MONITOR
          </p>
        </div>
      </div>

      <div className="mx-4 mb-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-xs uppercase tracking-wider text-cyan">
          Role: {role}
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {visibleLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-cyan/10 text-cyan"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`
            }
            key={to}
            onClick={() => setOpen(false)}
            to={to}
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-300"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-ink">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        {sidebar}
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative">
            {sidebar}
            <button
              className="absolute right-4 top-4 p-2 text-slate-400"
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
          </div>
        </div>
      )}

      {/* Alert Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setDrawerOpen(false)} />
          <section className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-slate-800 bg-[#0b1525] shadow-2xl sm:max-w-md">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-cyan" />
                <h2 className="text-lg font-bold text-white">Alert History</h2>
              </div>
              <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition" onClick={() => setDrawerOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {alerts.length === 0 ? (
                <p className="mt-10 text-center text-sm text-slate-500">No alerts have been triggered yet.</p>
              ) : (
                alerts.map((alert, i) => {
                  let sevColor = "text-slate-400 border-slate-500/20 bg-slate-500/10";
                  if (alert.severity === "Critical") sevColor = "text-red-400 border-red-500/30 bg-red-500/10";
                  else if (alert.severity === "High") sevColor = "text-orange-400 border-orange-500/30 bg-orange-500/10";
                  else if (alert.severity === "Medium") sevColor = "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
                  else if (alert.severity === "Low") sevColor = "text-green-400 border-green-500/30 bg-green-500/10";

                  return (
                    <div key={`${alert.flow_id}-${i}`} className="relative rounded-xl border border-white/5 bg-slate-900/50 p-4 transition hover:bg-slate-800/50">
                      <div className="mb-3 flex items-start justify-between">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sevColor}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs text-slate-500">{new Date(alert.prediction_timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-white">
                          <span className="font-normal text-slate-400">Threat:</span> <span className={alert.prediction_label !== "Normal" ? "text-rose-400" : "text-white"}>{alert.predicted_class}</span>
                        </p>
                        <p className="text-xs font-medium text-white">
                          <span className="font-normal text-slate-400">Prediction:</span> <span className={alert.prediction_label !== "Normal" ? "text-red-400" : "text-emerald-400"}>{alert.prediction_label !== "Normal" ? "Attack" : "Normal"}</span>
                        </p>
                        <p className="text-xs font-medium text-white">
                          <span className="font-normal text-slate-400">Risk Score:</span> {alert.risk_score}
                        </p>
                        <p className="mt-2 truncate text-[10px] font-mono text-slate-500" title={alert.flow_id}>
                          {alert.flow_id}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}

      <main className="min-h-screen lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-[#0b1525]/80 px-5 backdrop-blur-md lg:justify-end">
          <div className="flex items-center lg:hidden">
            <button className="p-2 text-slate-300" onClick={() => setOpen(true)}>
              <Menu />
            </button>
            <span className="ml-3 font-bold text-white">NetShield AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900/50 text-slate-400 transition hover:bg-slate-800 hover:text-white" 
              onClick={() => { setDrawerOpen(true); setUnreadCount(0); }}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#0b1525]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-5 md:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}