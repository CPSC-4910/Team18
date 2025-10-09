// App/frontend/src/components/DriverView.jsx
import React from "react";

/**
 * DriverView
 * - Clean toolbar with visible buttons (Back, Refresh)
 * - Reads user from prop or localStorage
 * - Uses existing endpoints (/api/health, /api/test-db) so it works now
 */

export default function DriverView({ user, show }) {
  const [health, setHealth] = React.useState({ ok: null, msg: "" });
  const [db, setDb] = React.useState({ ok: null, msg: "" });
  const [loading, setLoading] = React.useState(true);

  const effectiveUser = React.useMemo(() => {
    if (user) return user;
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [user]);

  async function refresh() {
    setLoading(true);
    try {
      const h = await fetch("/api/health").catch(() => null);
      if (h?.ok) {
        const j = await h.json().catch(() => ({}));
        setHealth({ ok: true, msg: j?.message || "Server is running" });
      } else {
        setHealth({ ok: false, msg: "Unable to reach backend" });
      }

      const d = await fetch("/api/test-db").catch(() => null);
      if (d?.ok) {
        const j = await d.json().catch(() => ({}));
        setDb({ ok: true, msg: j?.message || "Database connection successful" });
      } else {
        let errMsg = "Database connection failed";
        if (d) {
          try {
            const j = await d.json();
            errMsg = j?.error || errMsg;
          } catch {}
        }
        setDb({ ok: false, msg: errMsg });
      }
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="dv">
      <header className="dv-header">
        <div className="dv-headline">
          <h1>Driver Dashboard{effectiveUser?.username ? ` — ${effectiveUser.username}` : ""}</h1>
          <p className="muted">Welcome back! System status and your account at a glance.</p>
        </div>

        <div className="dv-toolbar">
          {typeof show === "function" && (
            <button className="btn" type="button" onClick={() => show("about")}>← Back</button>
          )}
          <button className="btn btn-primary" type="button" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      <section className="grid grid-3">
        <Stat label="Backend" value={health.ok === null ? "…" : health.ok ? "Online" : "Offline"} tone={health.ok} />
        <Stat label="Database" value={db.ok === null ? "…" : db.ok ? "Connected" : "Error"} tone={db.ok} />
        <Stat label="Account" value={effectiveUser?.email || "Not set"} />
      </section>

      <section className="panel">
        <h2 className="panel-title">Details</h2>
        <ul className="kv">
          <li><span>Username</span><strong>{effectiveUser?.username ?? "—"}</strong></li>
          <li><span>Email</span><strong>{effectiveUser?.email ?? "—"}</strong></li>
          <li><span>Backend</span><strong>{health.ok === null ? "…" : health.msg}</strong></li>
          <li><span>Database</span><strong>{db.ok === null ? "…" : db.msg}</strong></li>
        </ul>
        {!effectiveUser && (
          <p className="muted">
            Tip: Log in first to populate account info. (Login stores your profile in <code>localStorage</code>.)
          </p>
        )}
      </section>

      <style>{css}</style>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`panel stat ${tone === true ? "ok" : tone === false ? "bad" : ""}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const css = `
.dv { display: grid; gap: 16px; }
.dv-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
.dv-headline h1 { margin: 0; }
.muted { color:#666; }

.dv-toolbar { display:flex; gap:8px; }
.btn { padding:8px 14px; border:1px solid #ddd; border-radius:999px; background:#fff; cursor:pointer; }
.btn:hover { background:#f6f6f6; }
.btn-primary { background:#000; color:#fff; border-color:#000; }
.btn-primary:hover { opacity:.9; }

.grid { display:grid; gap:16px; }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

.panel { background:#fff; border:1px solid #eee; border-radius:16px; padding:16px; }
.panel-title { margin:0 0 12px; }

.stat { text-align:center; }
.stat-value { font-size:24px; font-weight:700; }
.stat-label { color:#666; }
.stat.ok .stat-value { color:#0a8f3d; }
.stat.bad .stat-value { color:#b00020; }

.kv { list-style:none; padding:0; margin:0; display:grid; grid-template-columns: 1fr 2fr; row-gap:10px; column-gap:12px; }
.kv li { display: contents; }
.kv span { color:#666; }
.kv strong { font-weight:600; }
`;

