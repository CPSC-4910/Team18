// App/frontend/src/components/DriverView.jsx
import React from "react";

export default function DriverView({ user, onLogout }) {
  const [health, setHealth] = React.useState({ ok: null, msg: "" });
  const [db, setDb] = React.useState({ ok: null, msg: "" });
  const [loading, setLoading] = React.useState(true);
  const [invitations, setInvitations] = React.useState([]);

  // Load user info (from props or localStorage)
  const effectiveUser = React.useMemo(() => {
    if (user) return user;
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [user]);

  // Check backend + DB
  React.useEffect(() => {
    let ignore = false;
    async function check() {
      setLoading(true);
      try {
        const h = await fetch("/api/health").catch(() => null);
        if (!ignore && h && h.ok) {
          const j = await h.json();
          setHealth({ ok: true, msg: j?.message || "Server is running" });
        } else {
          setHealth({ ok: false, msg: "Unable to reach backend" });
        }

        const d = await fetch("/api/test-db").catch(() => null);
        if (!ignore && d && d.ok) {
          const j = await d.json();
          setDb({ ok: true, msg: j?.message || "Database connection successful" });
        } else {
          setDb({ ok: false, msg: "Database connection failed" });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    check();
    return () => (ignore = true);
  }, []);

  // Load sponsor invitations
  React.useEffect(() => {
    if (effectiveUser?.username) loadInvitations();
  }, [effectiveUser?.username]);

  async function loadInvitations() {
    try {
      const res = await fetch(`/api/driver/invitations/${effectiveUser.username}`);
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch (err) {
      console.error("Failed to load invitations:", err);
    }
  }

  async function respond(sponsor_username, accept) {
    try {
      const res = await fetch("/api/driver/respond-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsor_username,
          driver_username: effectiveUser.username,
          accept,
        }),
      });
      if (res.ok) {
        loadInvitations(); // refresh list
      } else {
        console.error("Failed to respond to invitation");
      }
    } catch (err) {
      console.error("Error responding to invite:", err);
    }
  }

  return (
    <div className="driver-view">
      <header className="dv-header">
        <h1>
          Driver Dashboard
          {effectiveUser?.username ? ` — ${effectiveUser.username}` : ""}
        </h1>
        <p className="muted">Welcome back! Here’s your current system status.</p>
        {onLogout && (
          <button className="btn logout-btn" onClick={onLogout}>
            Log Out
          </button>
        )}
      </header>

      {loading && <div className="panel">Loading…</div>}

      <section className="grid grid-3">
        <StatCard
          label="Backend"
          value={health.ok === null ? "…" : health.ok ? "Online" : "Offline"}
          good={health.ok === true}
        />
        <StatCard
          label="Database"
          value={db.ok === null ? "…" : db.ok ? "Connected" : "Error"}
          good={db.ok === true}
        />
        <StatCard label="Account" value={effectiveUser?.email || "Not set"} />
      </section>

      {/* NEW: Sponsor Invitations Panel */}
      <section className="panel">
        <h2 className="panel-title">Sponsor Invitations</h2>
        {invitations.length === 0 ? (
          <p className="muted">No invitations yet.</p>
        ) : (
          invitations.map((inv) => (
            <div
              key={inv.sponsor_username}
              className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2"
            >
              <span>
                <strong>{inv.sponsor_username}</strong>{" "}
                <span className="text-gray-600 text-sm">({inv.sponsor_email})</span>
              </span>
              {inv.status === "pending" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(inv.sponsor_username, true)}
                    className="btn btn-primary"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respond(inv.sponsor_username, false)}
                    className="btn"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <span
                  className={`text-sm font-medium ${
                    inv.status === "accepted"
                      ? "text-green-600"
                      : inv.status === "declined"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {inv.status}
                </span>
              )}
            </div>
          ))
        )}
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
      </section>

      <style>{css}</style>
    </div>
  );
}

function StatCard({ label, value, good }) {
  return (
    <div
      className={`panel stat ${
        good === true ? "ok" : good === false ? "bad" : ""
      }`}
    >
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
.panel-title { margin: 0 0 12px; font-weight: 600; }

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

.btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  font-weight: 500;
}
.btn:hover { background: #f0f0f0; }
.btn-primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}
.btn-primary:hover { background: #0069d9; }

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  margin-top: 8px;
  font-weight: 600;
}
.logout-btn:hover { background: #c0392b; }
`;
