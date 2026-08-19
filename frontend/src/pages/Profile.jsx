import React, { useState } from "react";
import toast from "react-hot-toast";
import api from "../api.js";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put("/users/me", { full_name: fullName, email });
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.post("/users/me/change-password", { current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div>
      <div className="section-title">Profile</div>
      <div className="grid grid-2">
        <div className="glass-card">
          <div className="section-title" style={{ fontSize: "1rem" }}>Account Details</div>
          <form onSubmit={saveProfile}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              Username
              <input className="input-field" style={{ marginTop: 4, marginBottom: 12 }} value={user.username} disabled />
            </label>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              Role
              <input className="input-field" style={{ marginTop: 4, marginBottom: 12 }} value={user.role} disabled />
            </label>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              Full Name
              <input className="input-field" style={{ marginTop: 4, marginBottom: 12 }} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              Email
              <input className="input-field" style={{ marginTop: 4, marginBottom: 12 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button className="btn-primary" type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save Profile"}</button>
          </form>
        </div>

        <div className="glass-card">
          <div className="section-title" style={{ fontSize: "1rem" }}>Change Password</div>
          <form onSubmit={changePassword}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              Current Password
              <input className="input-field" style={{ marginTop: 4, marginBottom: 12 }} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </label>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              New Password
              <input className="input-field" style={{ marginTop: 4 }} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </label>
            <PasswordStrengthMeter password={newPassword} />
            <button className="btn-primary" type="submit" disabled={savingPassword}>{savingPassword ? "Updating…" : "Change Password"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
