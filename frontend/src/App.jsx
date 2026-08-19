import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// ============================================================
// PUBLIC PAGES
// ============================================================

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

// ============================================================
// APPLICATION PAGES
// ============================================================

import Dashboard from "./pages/Dashboard.jsx";
import PacketMonitoring from "./pages/PacketMonitoring.jsx";
import Training from "./pages/Training.jsx";
import Analytics from "./pages/Analytics.jsx";
import Alerts from "./pages/Alerts.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";
import UserManagement from "./pages/UserManagement.jsx";

// ============================================================
// LAYOUT
// ============================================================

import Sidebar from "./components/Sidebar.jsx";
import Navbar from "./components/Navbar.jsx";

// ============================================================
// AUTH PROTECTION
// ============================================================

function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  // Do not render the application while we are still
  // determining the logged-in user's identity and role.
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-dim)",
          fontFamily: "var(--font-mono)",
        }}
      >
        Loading...
      </div>
    );
  }

  const token = localStorage.getItem("netshield_token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ============================================================
// ADMIN PROTECTION
// ============================================================

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();

  // Wait until AuthContext knows the user's role.
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-dim)",
          fontFamily: "var(--font-mono)",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ============================================================
// APPLICATION SHELL
// ============================================================

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
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================
// ROUTES
// ============================================================

function AppRoutes() {
  return (
    <Routes>

      {/* ======================================================
          PUBLIC ROUTES
          ====================================================== */}

      <Route
        path="/"
        element={<Landing />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* ======================================================
          AUTHENTICATED USER ROUTES
          ====================================================== */}

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Shell>
              <Dashboard />
            </Shell>
          </RequireAuth>
        }
      />

      <Route
        path="/packets"
        element={
          <RequireAuth>
            <Shell>
              <PacketMonitoring />
            </Shell>
          </RequireAuth>
        }
      />

      <Route
        path="/analytics"
        element={
          <RequireAuth>
            <Shell>
              <Analytics />
            </Shell>
          </RequireAuth>
        }
      />

      <Route
        path="/alerts"
        element={
          <RequireAuth>
            <Shell>
              <Alerts />
            </Shell>
          </RequireAuth>
        }
      />

      <Route
        path="/reports"
        element={
          <RequireAuth>
            <Shell>
              <Reports />
            </Shell>
          </RequireAuth>
        }
      />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Shell>
              <Profile />
            </Shell>
          </RequireAuth>
        }
      />

      {/* ======================================================
          ADMIN-ONLY ROUTES
          ====================================================== */}

      <Route
        path="/training"
        element={
          <RequireAuth>
            <RequireAdmin>
              <Shell>
                <Training />
              </Shell>
            </RequireAdmin>
          </RequireAuth>
        }
      />

      <Route
        path="/settings"
        element={
          <RequireAuth>
            <RequireAdmin>
              <Shell>
                <Settings />
              </Shell>
            </RequireAdmin>
          </RequireAuth>
        }
      />

      <Route
        path="/users"
        element={
          <RequireAuth>
            <RequireAdmin>
              <Shell>
                <UserManagement />
              </Shell>
            </RequireAdmin>
          </RequireAuth>
        }
      />

      {/* ======================================================
          UNKNOWN ROUTES
          ====================================================== */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#10151f",
              color: "#e6edf3",
              border: "1px solid #1e2733",
              fontFamily: "var(--font-mono)",
            },
          }}
        />

        <AppRoutes />

      </AuthProvider>
    </BrowserRouter>
  );
}