import { Navigate, Route, Routes } from "react-router-dom";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Layout from "./components/Layout";
import Alerts from "./pages/Alerts";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Login from "./pages/Login";
import Predict from "./pages/Predict";
import ThreatReport from "./pages/ThreatReport";
import Train from "./pages/Train";
import Upload from "./pages/Upload";

function ProtectedLayout() {
  return localStorage.getItem("netshield_auth") === "true" ? (
    <Layout />
  ) : (
    <Navigate replace to="/login" />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route
          path="/dashboard"
          element={
            <RoleProtectedRoute permission="dashboard">
              <Dashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <RoleProtectedRoute permission="upload">
              <Upload />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/train"
          element={
            <RoleProtectedRoute permission="train">
              <Train />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/predict"
          element={
            <RoleProtectedRoute permission="predict">
              <Predict />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <RoleProtectedRoute permission="alerts">
              <Alerts />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <RoleProtectedRoute permission="history">
              <History />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/threat-report"
          element={
            <RoleProtectedRoute permission="reports">
              <ThreatReport />
            </RoleProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}