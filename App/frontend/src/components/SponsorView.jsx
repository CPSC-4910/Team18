// App/frontend/src/components/SponsorView.jsx
import React from "react";

/**
 * SponsorView
 * - Works with current project: uses /api/signup to create a driver account
 * - Tries to load drivers from /api/sponsor/drivers, then /api/users (if mounted)
 * - Falls back to demo data so UI renders even before backend routes exist
 *
 * Usage in App.jsx:
 *   import SponsorView from "./components/SponsorView.jsx";
 *   ...
 *   <div className={view === "sponsor" ? "view active" : "view"}>
 *     <SponsorView user={user} />
 *   </div>
 */

export default function SponsorView({ user, onLogout }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [profile, setProfile] = React.useState(null);
  const [drivers, setDrivers] = React.useState([]);

  React.useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        // Try sponsor profile (optional)
        let me = null;
        try {
          const meRes = await fetch("/api/sponsor/me");
          if (meRes.ok) me = await meRes.json();
        } catch {}

        if (!me) {
          me = {
            name: user?.username || "Demo Sponsor",
            stats: { drivers: 0, activeTrips: 0, monthlySpend: 0 },
          };
        }

        // Try drivers from preferred endpoint first, then fallback to /api/users
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
              // normalize to expected shape
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
        // Demo fallback if still empty
        if (!list.length) {
          list = [
            { username: "driver_jane", email: "jane@example.com", created_at: "2025-09-10", last_login: "2025-09-18", status: "Active" },
            { username: "driver_john", email: "john@example.com", created_at: "2025-09-12", last_login: "2025-09-17", status: "Active" },
            { username: "driver_amy",  email: "amy@example.com",  created_at: "2025-09-14", last_login: "—",            status: "Invited" },
          ];
        }

        if (!ignore) {
          setProfile(me);
          setDrivers(list);
        }
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load sponsor data");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [user?.username]);

  async function inviteDriver({ username, email, password }) {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to create driver");
    // Optimistic add to roster
    setDrivers((prev) => [
      { username, email, created_at: new Date().toISOString().slice(0, 10), last_login: "—", status: "Invited" },
      ...prev,
    ]);
  }

  return (
    <div className="sponsor-view">
      <header className="sv-header">
        <h1>Sponsor Dashboard{profile?.name ? ` — ${profile.name}` : ""}</h1>
        <p className="muted">Manage your drivers and monitor activity.</p>
            {onLogout && (
                <button className="btn logout-btn" onClick={onLogout}>
                    Log Out
                </button>
            )}
      </header>

      {loading && <div className="panel">Loading…</div>}
      {error && <div className="panel error">{error}</div>}

      <section className="grid grid-3">
        <StatCard label="Drivers" value={profile?.stats?.drivers ?? drivers.length} />
        <StatCard label="Active Trips" value={profile?.stats?.activeTrips ?? 0} />
        <StatCard label="Monthly Spend" value={`$${((profile?.stats?.monthlySpend ?? 0) * 1).toFixed(2)}`} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Driver Roster</h2>
          <InviteDriver onInvite={inviteDriver} />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Status</th>
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

function InviteDriver({ onInvite }) {
  const [open, setOpen] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");

  async function submit(e) {
    e.preventDefault();
    setErr(""); setOk("");
    if (!username || !email || !password) {
      setErr("All fields required");
      return;
    }
    try {
      setLoading(true);
      await onInvite({ username, email, password });
      setOk(`Invited ${username}`);
      setUsername(""); setEmail(""); setPassword("");
      setOpen(false);
    } catch (e) {
      setErr(e.message || "Invite failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="invite">
      {!open ? (
        <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Invite Driver</button>
      ) : (
        <form className="invite-form" onSubmit={submit}>
          <input className="input" placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
          <input className="input" placeholder="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" placeholder="temp password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="btn btn-primary" disabled={loading} type="submit">{loading ? "Creating…" : "Create"}</button>
          <button className="btn" type="button" onClick={()=>{setOpen(false); setErr(""); setOk("");}}>Cancel</button>
          {err && <span className="err">{err}</span>}
          {ok && <span className="ok">{ok}</span>}
        </form>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="panel stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const css = `
.sponsor-view { display: grid; gap: 16px; }
.sv-header h1 { margin: 0; }
.sv-header .muted { color: #666; }

.grid { display: grid; gap: 16px; }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

.panel { background: #fff; border: 1px solid #eee; border-radius: 16px; padding: 16px; }
.panel-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom: 8px; }
.panel-title { margin: 0; }

.table-wrap { overflow: auto; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: left; }
.table th { background: #fafafa; font-weight: 600; }

.center { text-align: center; }
.muted { color: #777; }
.pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; border: 1px solid #eee; }
.pill.active { background: #eefbf1; color: #0a8f3d; border-color: #cef0d6; }
.pill.invited { background: #eef3ff; color: #1e4dd8; border-color: #cfdaff; }

.invite { display:flex; align-items:center; gap: 12px; }
.invite-form { display:flex; align-items:center; gap:8px; flex-wrap: wrap; }
.input { padding:8px 10px; border:1px solid #ddd; border-radius:10px; min-width: 160px; }
.btn { padding:8px 14px; border:1px solid #ddd; border-radius:999px; background:#fff; cursor:pointer; }
.btn:hover { background:#f6f6f6; }
.btn-primary { background:#000; color:#fff; border-color:#000; }
.btn-primary:hover { opacity:.9; }
.err { margin-left:8px; color:#b00020; }
.ok  { margin-left:8px; color:#0a8f3d; }

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

.logout-btn:hover {
  background: #c0392b;
}
`;