import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Skeleton from "../components/Skeleton.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function UserManagement() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    try {
      await api.put(`/users/${id}/role`, { role });
      toast.success("Role updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not update role");
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await api.put(`/users/${id}/active`, { is_active: !isActive });
      toast.success(!isActive ? "User enabled" : "User disabled");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not update user");
    }
  };

  const removeUser = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not delete user");
    }
  };

  return (
    <div>
      <div className="section-title">User Management</div>
      <div className="glass-card">
        {loading ? (
          <Skeleton height={260} />
        ) : (
          <table>
            <thead>
              <tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email || "—"}</td>
                  <td>
                    <select
                      className="input-field"
                      style={{ width: 160 }}
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      disabled={u.username === me?.username}
                    >
                      <option value="security_analyst">Security Analyst</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td><StatusBadge status={u.is_active ? "healthy" : "critical"} label={u.is_active ? "Active" : "Disabled"} /></td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="logout-btn" disabled={u.username === me?.username} onClick={() => toggleActive(u.id, u.is_active)}>
                      {u.is_active ? "Disable" : "Enable"}
                    </button>
                    <button className="logout-btn" disabled={u.username === me?.username} onClick={() => removeUser(u.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
