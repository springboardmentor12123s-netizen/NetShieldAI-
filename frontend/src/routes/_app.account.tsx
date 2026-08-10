import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Save, UserRound } from "lucide-react";
import { AuthAPI, type AppUser } from "@/lib/api";

export const Route = createFileRoute("/_app/account")({
  component: AccountPage,
});

function AccountPage() {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await AuthAPI.profile();

        setProfile(data);
        setFullName(data.full_name ?? "");
        setEmail(data.email ?? "");
      } catch (e: any) {
        setProfileError(
          e?.response?.data?.detail ??
            "Unable to load account details."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();

    setProfileError("");
    setProfileSuccess("");

    try {
      setSavingProfile(true);

      const data = await AuthAPI.updateProfile({
        full_name: fullName,
        email,
      });

      setProfile(data);
      setProfileSuccess("Profile updated successfully.");
    } catch (e: any) {
      setProfileError(
        e?.response?.data?.detail ??
          "Unable to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation must match.");
      return;
    }

    try {
      setSavingPassword(true);

      await AuthAPI.changePassword(
        currentPassword,
        newPassword,
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password changed successfully.");
    } catch (e: any) {
      setPasswordError(
        e?.response?.data?.detail ??
          "Unable to change password."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return <main className="page">Loading account...</main>;
  }

  return (
    <main className="page page--narrow">
      <div className="page__header">
        <div>
          <h1 className="page__title">
            Account
          </h1>

          <div className="page__subtitle">
            Manage your profile and password.
          </div>
        </div>
      </div>

      <div className="account-grid">
        <section className="card">
          <div className="card__head">
            <div className="card__title">
              <UserRound size={14} />
              Profile
            </div>
          </div>

          <form
            className="card__body account-form"
            onSubmit={saveProfile}
          >
            <label className="account-field">
              <span>Full Name</span>

              <input
                className="input"
                required
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
              />
            </label>

            <label className="account-field">
              <span>Email</span>

              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </label>

            <label className="account-field">
              <span>Role</span>

              <input
                className="input"
                value={profile?.role ?? ""}
                readOnly
              />
            </label>

            {profileError && (
              <div className="form-message form-message--error">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="form-message form-message--success">
                {profileSuccess}
              </div>
            )}

            <button
              className="btn btn--primary account-action"
              disabled={savingProfile}
            >
              <Save size={13} />
              {savingProfile
                ? "Saving..."
                : "Save Changes"}
            </button>
          </form>
        </section>

        <section className="card">
          <div className="card__head">
            <div className="card__title">
              <KeyRound size={14} />
              Security
            </div>
          </div>

          <form
            className="card__body account-form"
            onSubmit={changePassword}
          >
            <label className="account-field">
              <span>Current Password</span>

              <input
                className="input"
                type="password"
                required
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
              />
            </label>

            <label className="account-field">
              <span>New Password</span>

              <input
                className="input"
                type="password"
                required
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
              />
            </label>

            <label className="account-field">
              <span>Confirm Password</span>

              <input
                className="input"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
              />
            </label>

            {passwordError && (
              <div className="form-message form-message--error">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="form-message form-message--success">
                {passwordSuccess}
              </div>
            )}

            <button
              className="btn btn--primary account-action"
              disabled={savingPassword}
            >
              <KeyRound size={13} />
              {savingPassword
                ? "Saving..."
                : "Change Password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default AccountPage;
