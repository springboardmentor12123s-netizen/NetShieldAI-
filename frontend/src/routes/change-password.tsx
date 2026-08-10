import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Shield } from "lucide-react";
import { AuthAPI } from "@/lib/api";
import "@/styles/app.css";

export const Route = createFileRoute("/change-password")({
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setBusy(true);

      await AuthAPI.changePassword(
        oldPassword,
        newPassword,
      );

      alert("Password changed successfully.");

      router.navigate({
        to: "/",
      });
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ??
          "Unable to change password."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form
        className="login__card"
        onSubmit={handleSubmit}
      >
        <div className="login__brand">
          <span className="navbar__brand-mark">
            <Shield
              size={13}
              strokeWidth={2.4}
            />
          </span>

          <div>
            <div className="login__title">
              Change Password
            </div>

            <div className="login__sub">
              Please change your temporary password.
            </div>
          </div>
        </div>

        <div className="login__field">
          <label>Current Password</label>

          <input
            className="input"
            type="password"
            required
            value={oldPassword}
            onChange={(e) =>
              setOldPassword(e.target.value)
            }
          />
        </div>

        <div className="login__field">
          <label>New Password</label>

          <input
            className="input"
            type="password"
            required
            value={newPassword}
            onChange={(e) =>
              setNewPassword(e.target.value)
            }
          />
        </div>

        <div className="login__field">
          <label>Confirm Password</label>

          <input
            className="input"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
          />
        </div>

        {error && (
          <div className="login__error">
            {error}
          </div>
        )}

        <button
          className="btn btn--primary login__btn"
          disabled={busy}
        >
          {busy
            ? "Saving..."
            : "Change Password"}
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordPage;