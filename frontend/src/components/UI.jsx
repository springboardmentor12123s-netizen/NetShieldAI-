export function StatCard({ icon, label, value, sub, subClass = "" }) {
  return (
    <div className="panel stat-card">
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className={`stat-delta ${subClass}`}>{sub}</div>}
    </div>
  );
}

export function BarRow({ label, value, max, color, displayValue }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bar-row">
      <div className="bar-label">{label}</div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }} />
      </div>
      <div className="bar-value">{displayValue ?? value}</div>
    </div>
  );
}

export function Badge({ level, children }) {
  return <span className={`badge ${level}`}>{children ?? level}</span>;
}

export function EmptyState({ children }) {
  return <div className="empty-state">{children}</div>;
}
