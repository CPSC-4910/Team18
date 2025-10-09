// App/frontend/src/components/SponsorView.jsx
import React from "react";

/**
 * SponsorView
 * - Visible toolbar (Back, Invite Driver)
 * - Lists drivers (tries /api/sponsor/drivers then /api/users; demo fallback)
 * - Invite Driver posts to /api/signup (works with current backend)
 */

export default function SponsorView({ user, show }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [profile, setProfile] = React.useState(null);
  const [drivers, setDrivers] = React.useState([]);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [invite, setInvite] = React.useState({ username: "", email: "", password: "" });
  const [inviting, setInviting] = React.useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      // profile (optional)
      let me = null;
      try {
        const meRes = await fetch("/api/sponsor/me");
        if (meRes.ok) me = await meRes.json();
      } catch {}
      if (!me) me = { name: user?.username || "Demo Sponsor", stats: { drivers: 0, activeTrips: 0, monthlySpend: 0 } };

      // drivers
      let list = [];
      try {
        const d1 = await fetch("/api/sponsor/drivers");
        if (d1.ok) {
          const j = await d1.json();
          list = j?.drivers || [];
        }
      } catch {}
      if (!list.length) {
        try {
          const d2 = await fetch("/api/users");
          if (d2.ok) {
            const j = await d2.json();
            const arr = j?.users || j || [];
            list = arr.map((u) => ({
              username: u.username || u.name || "unknown",
              email: u.email || "—",
              created_at: u.created_at || u.createdAt || "—",
              last_login: u.last_login || u.lastLogin || "—",
              status: "Active",
            }));
          }
        } catch {}
      }
      if (!list.length) {
        list = [
          { username: "driver_jane", email: "jane@example.com", created_at: "2025-09-10", last_login: "2025-09-18", status: "Active" },
          { username: "driver_john", email: "john@example.com", created_at: "2025-09-12", last_login: "2025-09-17", status: "Active" },
          { username: "driver_amy",  email: "amy@example.com",  created_at: "2025-09-14", last_login: "—",            status: "Invited" },
        ];
      }

      setProfile(me);
      setDrivers(list);
    } catch (e) {
      setError(e.message || "Failed to load sponsor data");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function onInvite() {
    if (!invite.username || !invite.email || !invite.password) return;
    setInviting(true);
    setError("");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invite),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to create driver");
      // optimistic add
      setDrivers((prev) => [
        { username: invite.username, email: invite.email, created_at: new Date().toISOString().slice(0, 10), last_login: "—", status: "Invited" },
        ...prev,
      ]);
      setInvite({ username: "", email: "", password: "" });
      setInviteOpen(false);
    } catch (e) {
      setError(e.message || "Invite failed");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="sv">
      <header className="sv-header">
        <div className="sv-headline">
          <h1>Sponsor Dashboard{profile?.name ? ` — ${profile.name}` : ""}</h1>
          <p className="muted">Manage your drivers and monitor activity.</p>
        </div>

        <div className="sv-toolbar">
          {typeof show === "function" && (
            <button className="btn" type="button" onClick={() => show("about")}>← Back</button>
          )}
          {!inviteOpen ? (
            <button className="btn btn-primary" type="button" onClick={() => setInviteOpen(true)}>+ Invite Driver</button>
          ) : (
            <div className="invite">
              <input className="input" placeholder="username" value={invite.username} onChange={(e)=>setInvite(v=>({...v,username:e.target.value}))} />
              <input className="input" placeholder="email" type="email" value={invite.email} onChange={(e)=>setInvite(v=>({...v,email:e.target.value}))} />
              <input className="input" placeholder="temp password" type="password" value={invite.password} onChange={(e)=>setInvite(v=>({...v,password:e.target.value}))} />
              <button className="btn btn-primary" type="button" disabled={inviting} onClick={onInvite}>{inviting ? "Creating…" : "Create"}</button>
              <button className="btn" type="button" onClick={() => { setInviteOpen(false); setInvite({ username:"", email:"", password:""}); }}>Cancel</button>
            </div>
          )}
        </div>
      </header>

      {loading && <div className="panel">Loading…</div>}
      {error && <div className="panel error">{error}</div>}

      <section className="grid grid-3">
        <Stat label="Drivers" value={profile?.stats?.drivers ?? drivers.length} />
        <Stat label="Active Trips" value={profile?.stats?.activeTrips ?? 0} />
        <Stat label="Monthly Spend" value={`$${((profile?.stats?.monthlySpend ?? 0) * 1).toFixed(2)}`} />
      </section>

      <section className="panel">
        <h2 className="panel-title">Driver Roster</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th><th>Email</th><th>Created</th><th>Last Login</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={`${d.username}-${d.email}`}>
                  <td>{d.username}</td>
                  <td>{d.email}</td>
                  <td>{d.created_at ?? "—"}</td>
                  <td>{d.last_login ?? "—"}</td>
                  <td><span className={`pill ${String(d.status || "—").toLowerCase()}`}>{d.status ?? "—"}</span></td>
                </tr>
              ))}
              {!drivers.length && (
                <tr><td colSpan={5} className="muted center">No drivers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style>{css}</style>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="panel stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const css = `
.sv { display:grid; gap:16px; }
.sv-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.sv-headline h1 { margin:0; }
.muted { color:#666; }

.sv-toolbar { display:flex; gap:8px; flex-wrap:wrap; }
.invite { display:flex; gap:8px; flex-wrap:wrap; }
.input { padding:8px 10px; border:1px solid #ddd; border-radius:10px; min-width: 160px; }

.btn { padding:8px 14px; border:1px solid #ddd; border-radius:999px; background:#fff; cursor:pointer; }
.btn:hover { background:#f6f6f6; }
.btn-primary { background:#000; color:#fff; border-color:#000; }
.btn-primary:hover { opacity:.9; }

.grid { display:grid; gap:16px; }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

.panel { background:#fff; border:1px solid #eee; border-radius:16px; padding:16px; }
.panel-title { margin:0 0 12px; }

.table-wrap { overflow:auto; }
.table { width:100%; border-collapse:collapse; }
.table th, .table td { padding:10px 12px; border-bottom:1px solid #f0f0f0; text-align:left; }
.table th { background:#fafafa; font-weight:600; }

.center { text-align:center; }
.pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; border:1px solid #eee; }
.pill.active { background:#eefbf1; color:#0a8f3d; border-color:#cef0d6; }
.pill.invited { background:#eef3ff; color:#1e4dd8; border-color:#cfdaff; }
`;

