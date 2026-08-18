"use client";
import { useState, useEffect, useCallback } from 'react';
import AppShell from "../../components/AppShell";

export default function UserManagementDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [teamMembers, setTeamMembers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({ role: 'Security Analyst' });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'Security Analyst'
  });

  // Extracted fetch function so we can re-run it after adding a new user
  const fetchUserData = useCallback(async () => {
    try {
      const [usersRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/api/users`),
        fetch(`${API_URL}/api/audit-logs`)
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setTeamMembers(usersData.data || []);
      }
      
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch user management data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Handle Form Submission
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false); // Close Modal
        setFormData({ username: '', password: '', role: 'Security Analyst' }); // Reset Form
        fetchUserData(); // Refresh the table automatically!
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const openEditModal = (member) => {
    setEditingUserId(member.id);
    setEditFormData({ role: member.role });
    setIsEditModalOpen(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/users/${editingUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData)
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchUserData(); // Refresh the table to show the new role!
      } else {
        alert("Failed to update user.");
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (id, name) => {
    // Add a confirmation pop-up so you don't accidentally delete someone
    if (!window.confirm(`Are you sure you want to completely delete ${name}?`)) {
      return; 
    }

    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUserData(); // Instantly refresh the table!
      } else {
        alert("Failed to delete user.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <AppShell role="Admin" title="User Management Module" activePath="/users" onLogout={() => window.location.assign("/login")}>
      <div className="relative">
      <h1 className="text-3xl font-bold mb-6">User Management Module</h1>
      
      {isLoading ? (
        <div className="text-blue-400 font-semibold animate-pulse">Loading system records...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Section: Team Management & RBAC */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Team Management & Access Control</h2>
              {/* TRIGGER MODAL HERE */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                + Add User
              </button>
            </div>
            
            {/* Responsive users table: table for large screens, stacked cards for small screens */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-700 text-gray-300">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role (RBAC)</th>
                    <th className="p-3 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {teamMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">No users found in database.</td>
                    </tr>
                  ) : (
                    teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-750 transition-colors">
                        <td className="p-3 font-medium">{member.name}</td>
                        <td className="p-3 text-gray-400">{member.email}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border
                            ${member.role === 'Admin' || member.role === 'Administrator' ? 'bg-purple-900/40 text-purple-300 border-purple-800' : 
                              member.role === 'Security Analyst' ? 'bg-blue-900/40 text-blue-300 border-blue-800' : 
                              member.role === 'Enterprise' ? 'bg-green-900/40 text-green-300 border-green-800' : 
                              'bg-gray-700 text-gray-300 border-gray-600'}`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="p-3 text-right w-36">
                                                  <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                            <button
                              onClick={() => openEditModal(member)}
                                                      className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-md border border-gray-600"
                                                      aria-label={`Edit ${member.name}`}
                                                    >
                                                      Edit
                                                    </button>

                                                    <button
                                                      onClick={() => handleDeleteUser(member.id, member.name)}
                                                      className="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded-md border border-red-600"
                                                      aria-label={`Delete ${member.name}`}
                                                    >
                                                      Delete
                                                    </button>
                                                  </div>
                                                </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile-friendly stacked view */}
            <div className="lg:hidden space-y-4">
              {teamMembers.length === 0 ? (
                <div className="p-4 bg-gray-800 rounded-md border border-gray-700 text-center text-gray-500">No users found in database.</div>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold truncate">{member.name}</h3>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{member.email}</p>

                        <div className="mt-3">
                          <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold border
                            ${member.role === 'Admin' || member.role === 'Administrator' ? 'bg-purple-900/40 text-purple-300 border-purple-800' : 
                              member.role === 'Security Analyst' ? 'bg-blue-900/40 text-blue-300 border-blue-800' : 
                              member.role === 'Enterprise' ? 'bg-green-900/40 text-green-300 border-green-800' : 
                              'bg-gray-700 text-gray-300 border-gray-600'}`}>{member.role}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => openEditModal(member)}
                          className="w-28 text-sm px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md border border-gray-600"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteUser(member.id, member.name)}
                          className="w-28 text-sm px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md border border-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Audit Logging & Security Logins */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Audit Logging</h2>
            <p className="text-sm text-gray-400 mb-4">Recent authentication and system events.</p>
            
            <div className="space-y-4">
              {auditLogs.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent events.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="border-l-4 pl-3 py-1 border-gray-600 hover:bg-gray-750 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium">{log.user}</span>
                      <span className="text-xs text-gray-500">{log.time.split(' ')[1]}</span>
                    </div>
                    <p className={`text-xs mt-1 ${
                      log.severity === 'Critical' ? 'text-red-400' : 
                      log.severity === 'Warning' ? 'text-yellow-400' : 
                      'text-gray-300'
                    }`}>
                      {log.event}
                    </p>
                  </div>
                ))
              )}
            </div>
            
            <button className="w-full mt-6 text-sm text-gray-400 hover:text-white border border-gray-600 rounded py-2 transition-colors hover:bg-gray-700">
              View Full Audit Trail
            </button>
          </div>
        </div>
      )}

      {/* --- ADD USER MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Alice Vanguard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Temporary Password</label>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Security Analyst">Security Analyst</option>
                  <option value="Admin">Admin</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="SOC User">SOC User</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors font-medium"
                >
                  Create User
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    {/* --- EDIT USER MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Edit User Role</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                <select 
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ role: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Security Analyst">Security Analyst</option>
                  <option value="Admin">Admin</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="SOC User">SOC User</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}