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
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

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
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
            className="absolute inset-0 bg-black/70"
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

      <main className="min-h-screen lg:pl-72">
        <div className="flex h-16 items-center border-b border-slate-800 px-5 lg:hidden">
          <button className="p-2 text-slate-300" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <span className="ml-3 font-bold">NetShield AI</span>
        </div>

        <div className="mx-auto max-w-[1500px] p-5 md:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}