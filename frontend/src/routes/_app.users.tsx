import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UsersAPI, type AppUser } from "@/lib/api";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  async function loadUsers() {
    try {
      const data = await UsersAPI.list();

      const admins = data.filter(
        (user) => user.role === "ADMIN"
      );

      setUsers(admins);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createAdmin() {
    if (!email.trim()) {
      alert("Enter admin email.");
      return;
    }

    try {
      await UsersAPI.create({
        full_name: email.split("@")[0],
        email: email.trim(),
        role: "ADMIN",
      });

      setEmail("");

      await loadUsers();

      alert(
        "Admin created successfully. Login credentials have been sent to the email."
      );
    } catch (err: any) {
      alert(
        err.response?.data?.detail ??
          "Unable to create admin."
      );
    }
  }

  async function deleteUser(id: number | string) {
    if (!confirm("Delete this admin?")) {
      return;
    }

    try {
      await UsersAPI.delete(id);

      await loadUsers();
    } catch (err: any) {
      alert(
        err.response?.data?.detail ??
          "Unable to delete admin."
      );
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div>Loading...</div>
      </main>
    );
  }

  return (
    <main className="page">

      <div className="page__header">
        <div>
          <h1 className="page__title">
            Admin Management
          </h1>

          <div className="page__subtitle">
            Create and manage administrator accounts
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 500,
          marginBottom: 25,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Admin Email
          </label>

          <input
            className="input"
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <button
            className="btn btn--primary"
            onClick={createAdmin}
          >
            Add Admin
          </button>
        </div>
      </div>

      <table className="table">

        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {users.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="table__empty"
              >
                No admins found.
              </td>
            </tr>
          )}

          {users.map((u) => (
            <tr key={u.id}>

              <td>{u.id}</td>

              <td>
                {u.full_name ?? "-"}
              </td>

              <td>
                {u.email ?? "-"}
              </td>

              <td>
                {u.role ?? "ADMIN"}
              </td>

              <td>
                <button
                  className="btn"
                  onClick={() =>
                    deleteUser(u.id)
                  }
                >
                  Delete
                </button>
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </main>
  );
}