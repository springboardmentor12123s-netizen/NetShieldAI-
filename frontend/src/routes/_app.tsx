import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import "@/styles/app.css";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("auth_token");
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <Outlet />
    </div>
  );
}