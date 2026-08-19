import React from "react";

function scoreOf(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const LABELS = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong", "Excellent"];
const COLORS = ["#ff5470", "#ff5470", "#ff9f43", "#ffd23f", "#4ade80", "#2dd4bf", "#2dd4bf"];

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const score = scoreOf(password);
  const pct = Math.round((score / 6) * 100);
  return (
    <div style={{ marginTop: -6, marginBottom: 10 }}>
      <div className="strength-meter">
        <div className="strength-meter-fill" style={{ width: `${pct}%`, background: COLORS[score] }} />
      </div>
      <div style={{ fontSize: "0.7rem", color: COLORS[score], marginTop: 4 }}>{LABELS[score]}</div>
    </div>
  );
}
