import { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/Users.css";

function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await API.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="users-page">
      <h1>👥 User Management</h1>

      <div className="users-summary">
        <div className="summary-card">
          <h3>Total Users</h3>
          <h2>{users.length}</h2>
        </div>

        <div className="summary-card">
          <h3>Administrators</h3>
          <h2>
            {users.filter((user) => user.role === "Administrator").length}
          </h2>
        </div>

        <div className="summary-card">
          <h3>Standard Users</h3>
          <h2>{users.filter((user) => user.role === "User").length}</h2>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name, username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.full_name}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <div className="status-container">
                    <span className="active-dot"></span>
                    <span>Active</span>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Users;