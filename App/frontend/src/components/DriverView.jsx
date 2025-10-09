// App/frontend/src/components/DriverView.jsx
import React from "react";

/**
 * DriverView
 * Minimal driver dashboard that works with current backend:
 * - Uses existing /api/health and /api/test-db (no new routes required)
 * - Shows logged-in user's basic info passed from App.jsx (or from localStorage)
 */

export default function DriverView({ user }) {
  const [health, setHealth] = React.useState({ ok: null, msg: "" });
  const [db, setDb] = React.useState({ ok: null, msg: "" });
  const [loading, setLoading] = React.useState(true);

  // In case parent didn't pass user (e.g., on refresh), read from localStorage
  const effectiveUser = React.useMemo(() => {
    if (user) return user;
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [user]);

  React.useEffect(() => {
    let ignore = false;

    async function check() {
      setLoading(true);
      try {
        // Backend health
        const h = await fetch("/api/health").catch(() => null);
        if (!ignore) {
          if (h && h.ok) {
            const j = await h.json().catch(() => ({}));
            setHealth({ ok: true, msg: j?.message || "Server is running" });
          } else {
            setHealth({ ok: false, msg: "Unable to reach backend" });
          }
        }

        // DB connectivity
        const d = await fetch("/api/test-db").catch(() => null);
        if (!ignore) {
          if (d && d.ok) {
            const j = await d.json().catch(() => ({}));
            setDb({ ok: true, msg: j?.message || "Database connection successful" });
          } else {
            // Try to read error from JSON if present
            let errMsg = "Database connection failed";
            if (d) {
              try {
                const j = await d.json();
                errMsg = j?.error || errMsg;
              } catch {}
            }
            setDb({ ok: false, msg: errMsg });
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    check();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="driver-view">
      <header className="dv-header">
        <h1>
          Driver Dashboard
          {effectiveUser?.username ? ` — ${effectiveUser.username}` : ""}
        </h1>
        <p className="muted">Welcome back! Here’s the current system status.</p>
      </header>

      {loading && <div className="panel">Loading…</div>}

      <section className="grid grid-3">
        <StatCard label="Backend" value={health.ok === null ? "…" : health.ok ? "Online" : "Offline"} good={health.ok === true} />
        <StatCard label="Database" value={db.ok === null ? "…" : db.ok ? "Connected" : "Error"} good={db.ok === true} />
        <StatCard label="Account" value={effectiveUser?.email || "Not set"} />
      </section>

      <section className="panel">
        <h2 className="panel-title">Details</h2>
        <ul className="kv">
          <li>
            <span>Username</span>
            <strong>{effectiveUser?.username ?? "—"}</strong>
          </li>
          <li>
            <span>Email</span>
            <strong>{effectiveUser?.email ?? "—"}</strong>
          </li>
          <li>
            <span>Backend</span>
            <strong>{health.ok === null ? "…" : health.msg}</strong>
          </li>
          <li>
            <span>Database</span>
            <strong>{db.ok === null ? "…" : db.msg}</strong>
          </li>
        </ul>
        {!effectiveUser && (
          <p className="muted">
            Tip: Log in first to see your account info. (The login flow stores your
            profile in <code>localStorage</code>.)
          </p>
        )}
      </section>

      <style>{css}</style>
    </div>
  );
}

function StatCard({ label, value, good }) {
  return (
    <div className={`panel stat ${good === true ? "ok" : good === false ? "bad" : ""}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const css = `
.driver-view { display: grid; gap: 16px; }
.dv-header h1 { margin: 0; }
.dv-header .muted { color: #666; }

.grid { display: grid; gap: 16px; }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

.panel { background: #fff; border: 1px solid #eee; border-radius: 16px; padding: 16px; }
.panel-title { margin: 0 0 12px; }

.stat { text-align: center; }
.stat-value { font-size: 24px; font-weight: 700; }
.stat-label { color: #666; }

.kv { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 2fr; row-gap: 10px; column-gap: 12px; }
.kv li { display: contents; }
.kv span { color: #666; }
.kv strong { font-weight: 600; }

.muted { color: #777; }
.stat.ok .stat-value { color: #0a8f3d; }
.stat.bad .stat-value { color: #b00020; }
`;
