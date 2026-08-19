import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Skeleton from "../components/Skeleton.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [prefs, setPrefs] = useState({ theme: "dark", notifications_enabled: true, notify_on_critical: true, ai_confidence_threshold: 70 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await api.get("/settings");
    setSettings(res.data);
    setPrefs(res.data.preferences);
  };

  useEffect(() => { load(); }, []);

  const savePrefs = async () => {
    setSaving(true);
    try {
      const res = await api.put("/settings/preferences", prefs);
      setPrefs(res.data);
      toast.success("Preferences saved");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Only admins can update settings");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="glass-card"><Skeleton height={300} /></div>;

  return (
    <div>
      <div className="section-title">Settings</div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card">
          <div className="section-title" style={{ fontSize: "1rem" }}>MongoDB Configuration</div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div>Connection: <code>{settings.mongodb.uri}</code></div>
            <div>Database: <code>{settings.mongodb.db_name}</code></div>
            <div>Status: <StatusBadge status={settings.mongodb.connected ? "healthy" : "critical"} label={settings.mongodb.connected ? "Connected" : "Disconnected"} /></div>
          </div>
        </div>

        <div className="glass-card">
          <div className="section-title" style={{ fontSize: "1rem" }}>PostgreSQL Configuration</div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div>Connection: <code>{settings.postgresql.uri}</code></div>
            <div>Status: <StatusBadge status={settings.postgresql.connected ? "healthy" : "waiting"} label={settings.postgresql.configured ? (settings.postgresql.connected ? "Connected" : "Configured, unreachable") : "Not configured"} /></div>
            <p style={{ marginTop: 4 }}>Set <code>POSTGRES_URI</code> in backend/.env when ready — MongoDB stays primary either way.</p>
          </div>
        </div>

        <div className="glass-card">
          <div className="section-title" style={{ fontSize: "1rem" }}>SMTP / Email Alerts</div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div>Server: <code>{settings.smtp.server}{settings.smtp.configured ? `:${settings.smtp.port}` : ""}</code></div>
            <div>From: <code>{settings.smtp.from_email}</code></div>
            <div>Status: <StatusBadge status={settings.smtp.configured ? "healthy" : "waiting"} label={settings.smtp.configured ? "Configured" : "Not configured (emails logged to console)"} /></div>
            <div>Critical alert threshold: <code>{settings.smtp.critical_alert_risk_threshold}%</code> risk or Critical severity</div>
            <p style={{ marginTop: 4 }}>Set <code>SMTP_SERVER</code>, <code>SMTP_EMAIL</code>, <code>SMTP_PASSWORD</code> in backend/.env to send real emails.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="glass-card">
          <div className="section-title" style={{ fontSize: "1rem" }}>AI Configuration</div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div>Model path: <code>{settings.ai.model_path}</code></div>
            <div>Dataset path: <code>{settings.ai.dataset_path}</code></div>
          </div>
          <label style={{ display: "block", marginTop: 14, fontSize: "0.78rem", color: "var(--text-dim)" }}>
            Alert confidence threshold ({prefs.ai_confidence_threshold}%)
            <input
              type="range" min="0" max="100" value={prefs.ai_confidence_threshold}
              onChange={(e) => setPrefs({ ...prefs, ai_confidence_threshold: Number(e.target.value) })}
              style={{ width: "100%", marginTop: 6 }}
              disabled={user?.role !== "admin"}
            />
          </label>
        </div>

        <div className="glass-card">
          <div className="section-title" style={{ fontSize: "1rem" }}>Notifications & Theme</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", marginBottom: 10 }}>
            <input type="checkbox" checked={prefs.notifications_enabled} disabled={user?.role !== "admin"}
              onChange={(e) => setPrefs({ ...prefs, notifications_enabled: e.target.checked })} />
            Enable notifications
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", marginBottom: 10 }}>
            <input type="checkbox" checked={prefs.notify_on_critical} disabled={user?.role !== "admin"}
              onChange={(e) => setPrefs({ ...prefs, notify_on_critical: e.target.checked })} />
            Notify on critical alerts only
          </label>
          <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>Theme: dark (enterprise cybersecurity default)</div>
        </div>
      </div>

      {user?.role === "admin" ? (
        <button className="btn-primary" style={{ width: "auto", padding: "10px 24px" }} onClick={savePrefs} disabled={saving}>
          {saving ? "Saving…" : "Save Preferences"}
        </button>
      ) : (
        <p style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>Only administrators can change these settings.</p>
      )}
    </div>
  );
}
