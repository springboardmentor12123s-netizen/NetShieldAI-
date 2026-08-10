import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield } from "lucide-react";
import { AuthAPI } from "@/lib/api";
import "@/styles/app.css";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setBusy(true);

      const res = await AuthAPI.forgotPassword(email);

      setSuccess(
        res.message ??
          "If an account exists, a reset email has been sent."
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ??
          "Unable to request password reset."
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
              Forgot Password
            </div>

            <div className="login__sub">
              Request a secure reset link.
            </div>
          </div>
        </div>

        <div className="login__field">
          <label>Email</label>

          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
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
            ? "Sending..."
            : "Send Reset Link"}
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

export default ForgotPasswordPage;
