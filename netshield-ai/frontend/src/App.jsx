import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PacketMonitoring from "./pages/PacketMonitoring.jsx";
import Training from "./pages/Training.jsx";
import Analytics from "./pages/Analytics.jsx";
import Alerts from "./pages/Alerts.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Navbar from "./components/Navbar.jsx";

function RequireAuth({ children }) {
  const token = localStorage.getItem("netshield_token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function Shell({ children }) {
  const location = useLocation();
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<RequireAuth><Shell><Dashboard /></Shell></RequireAuth>} />
      <Route path="/packets" element={<RequireAuth><Shell><PacketMonitoring /></Shell></RequireAuth>} />
      <Route path="/training" element={<RequireAuth><Shell><Training /></Shell></RequireAuth>} />
      <Route path="/analytics" element={<RequireAuth><Shell><Analytics /></Shell></RequireAuth>} />
      <Route path="/alerts" element={<RequireAuth><Shell><Alerts /></Shell></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><Shell><Reports /></Shell></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Shell><Settings /></Shell></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><Shell><Profile /></Shell></RequireAuth>} />
      <Route
        path="/users"
        element={
          <RequireAuth>
            <RequireAdmin>
              <Shell><UserManagement /></Shell>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background: "#10151f", color: "#e6edf3", border: "1px solid #1e2733", fontFamily: "var(--font-mono)" },
        }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
