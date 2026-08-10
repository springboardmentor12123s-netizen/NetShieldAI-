import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { AuthAPI } from "@/lib/api";
import "@/styles/app.css";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search,
    );

    setToken(params.get("token") ?? "");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation must match.");
      return;
    }

    try {
      setBusy(true);

      const res = await AuthAPI.resetPassword(
        token,
        newPassword,
      );

      setNewPassword("");
      setConfirmPassword("");
      setSuccess(
        res.message ??
          "Password reset successfully."
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ??
          "Unable to reset password."
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
              Reset Password
            </div>

            <div className="login__sub">
              Choose a new account password.
            </div>
          </div>
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

        {success && (
          <div className="login__success">
            {success}
          </div>
        )}

        <button
          className="btn btn--primary login__btn"
          disabled={busy}
        >
          {busy
            ? "Saving..."
            : "Reset Password"}
        </button>

        <div className="login__foot">
          <Link to="/login">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ResetPasswordPage;
