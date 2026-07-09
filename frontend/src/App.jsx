import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Alerts from "./pages/Alerts";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Login from "./pages/Login";
import Predict from "./pages/Predict";
import Train from "./pages/Train";
import Upload from "./pages/Upload";

function ProtectedLayout() {
  return localStorage.getItem("netshield_auth") ? <Layout /> : <Navigate replace to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/train" element={<Train />} />
        <Route path="/predict" element={<Predict />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/history" element={<History />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}
