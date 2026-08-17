import { BrowserRouter, Routes, Route } from "react-router-dom";
import HealthValidation from "./pages/HealthValidation";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Teams from "./pages/Teams";
import Monitoring from "./pages/Monitoring";
import Analytics from "./pages/Analytics";
import AIDashboard from "./pages/AIDashboard";
import Alerts from "./pages/Alerts";
import NotFound from "./pages/NotFound";
import ThreatReport from "./pages/ThreatReport";
import ProtectedRoute from "./components/ProtectedRoute";
import AuditLogs from "./pages/AuditLogs";
function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Users */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* Teams */}
        <Route
          path="/teams"
          element={
            <ProtectedRoute>
              <Teams />
            </ProtectedRoute>
          }
        />

        {/* Monitoring */}
        <Route
          path="/monitoring"
          element={
            <ProtectedRoute>
              <Monitoring />
            </ProtectedRoute>
          }
        />

        {/* Analytics */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* AI Dashboard */}
        <Route
          path="/ai"
          element={
            <ProtectedRoute>
              <AIDashboard />
            </ProtectedRoute>
          }
        />
        {/* Health Validation */}
<Route
  path="/health-validation"
  element={
    <ProtectedRoute>
      <HealthValidation />
    </ProtectedRoute>
  }
/>
<Route
        path="/audit"
        element={<AuditLogs />}
    />

        {/* Alerts */}
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />
        {/* Threat Report */}
<Route
  path="/report"
  element={
    <ProtectedRoute>
      <ThreatReport />
    </ProtectedRoute>
  }
/>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>

    </BrowserRouter>
        
  );

}

export default App;