// App/frontend/src/components/SponsorView.jsx
import React from "react";

export default function SponsorView({ user, onLogout }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [profile, setProfile] = React.useState(null);
  const [drivers, setDrivers] = React.useState([]);
  const [view, setView] = React.useState("dashboard");
  const [catalog, setCatalog] = React.useState([]);
  const [loadingCatalog, setLoadingCatalog] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("truck");
  const [refreshing, setRefreshing] = React.useState(false); // 🆕 for refresh button

  // Load sponsor + drivers
  React.useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
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

        // Load drivers (accepted)
        let list = [];
        try {
          const d1 = await fetch(`/api/sponsor/drivers/${me.name}`);
          if (d1.ok) {
            const j = await d1.json();
            list = j?.drivers || [];
          }
        } catch {}

        if (!list.length) {
          // fallback data
          list = [
            {
              username: "driver_jane",
              email: "jane@example.com",
              created_at: "2025-09-10",
              last_login: "2025-09-18",
              status: "Accepted",
            },
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
    return () => {
      ignore = true;
    };
  }, [user?.username]);

  // Refresh roster (manual reload)
  async function refreshDrivers() {
    if (!profile?.name) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/sponsor/drivers/${profile.name}`);
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
      }
    } catch (err) {
      console.error("Error refreshing drivers:", err);
    } finally {
      setRefreshing(false);
    }
  }

  // Load catalog when switched to "catalog"
  React.useEffect(() => {
    if (view === "catalog") {
      loadCatalog(searchTerm);
    }
  }, [view]);

  async function loadCatalog(query) {
    setLoadingCatalog(true);
    try {
      const res = await fetch(`/api/ebay/catalog?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCatalog(data);
    } catch (err) {
      console.error("Failed to load eBay catalog:", err);
    } finally {
      setLoadingCatalog(false);
    }
  }

  async function inviteDriver({ username, email, password }) {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to create driver");
    setDrivers((prev) => [
      {
        username,
        email,
        created_at: new Date().toISOString().slice(0, 10),
        last_login: "—",
        status: "Invited",
      },
      ...prev,
    ]);
  }

  // === DASHBOARD VIEW ===
  if (view === "dashboard") {
        // 🆕 Remove a driver
    async function handleRemoveDriver(driverUsername) {
      if (!profile?.name) return;

      const confirmDelete = window.confirm(
        `Are you sure you want to remove ${driverUsername} from your roster?`
      );
      if (!confirmDelete) return;

      try {
        const res = await fetch("/api/sponsor/remove-driver", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sponsor_username: profile.name,
            driver_username: driverUsername,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          alert(`✅ ${data.message}`);
          setDrivers((prev) => prev.filter((d) => d.username !== driverUsername));
        } else {
          alert(`❌ ${data.error || "Failed to remove driver"}`);
        }
      } catch (err) {
        console.error("Error removing driver:", err);
        alert("❌ Network error removing driver");
      }
    }

    return (
      <div className="sponsor-view">
        <header className="sv-header">
          <h1>Sponsor Dashboard{profile?.name ? ` — ${profile.name}` : ""}</h1>
          <p className="muted">Manage your drivers and monitor activity.</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button className="btn catalog-btn" onClick={() => setView("catalog")}>
              Catalog
            </button>
            {onLogout && (
              <button className="btn logout-btn" onClick={onLogout}>
                Log Out
              </button>
            )}
          </div>
        </header>

        {loading && <div className="panel">Loading…</div>}
        {error && <div className="panel error">{error}</div>}

        <section className="grid grid-3">
          <StatCard label="Drivers" value={drivers.length} />
          <StatCard label="Active Trips" value={profile?.stats?.activeTrips ?? 0} />
          <StatCard label="Monthly Spend" value={`$${(profile?.stats?.monthlySpend ?? 0).toFixed(2)}`} />
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Driver Roster</h2>
            <div style={{ display: "flex", gap: "8px" }}>
              <InviteDriver sponsorName={profile?.name} onInvite={refreshDrivers} />
              <button
                onClick={refreshDrivers}
                className="btn refresh-btn"
                disabled={refreshing}
              >
                {refreshing ? "Refreshing..." : "🔄 Refresh Roster"}
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={`${d.username}-${d.email}`}>
                    <td>{d.username}</td>
                    <td>{d.email}</td>
                    <td>
                      <span className={`pill ${String(d.status || "—").toLowerCase()}`}>
                        {d.status ?? "—"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn remove-btn"
                        onClick={() => handleRemoveDriver(d.username)}
                      >
                        🗑️ Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {!drivers.length && (
                  <tr>
                    <td colSpan={4} className="muted center">
                      No drivers yet.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </section>

        <style>{css}</style>
      </div>
    );
  }

  // === CATALOG VIEW ===
  return (
    <div className="sponsor-view">
      <header className="sv-header">
        <h1>eBay Catalog{profile?.name ? ` — ${profile.name}` : ""}</h1>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button className="btn catalog-btn" onClick={() => setView("dashboard")}>
            Back
          </button>
          {onLogout && (
            <button className="btn logout-btn" onClick={onLogout}>
              Log Out
            </button>
          )}
        </div>
      </header>

      <section className="panel">
        <h2 className="panel-title">eBay Catalog</h2>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search eBay..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />
          <button className="btn catalog-btn" onClick={() => loadCatalog(searchTerm)}>
            Search
          </button>
        </div>

        {loadingCatalog && <p>Loading items...</p>}

        <div className="grid grid-3">
          {catalog.map((item) => (
            <div key={item.itemId} className="panel">
              <img
                src={item.image?.imageUrl}
                alt={item.title}
                style={{
                  width: "100%",
                  height: "160px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <h3 style={{ fontSize: "1rem", marginTop: "8px" }}>{item.title}</h3>
              <p>
                <strong>${item.price?.value}</strong> {item.price?.currency}
              </p>
              <a href={item.itemWebUrl} target="_blank" rel="noopener noreferrer">
                View on eBay →
              </a>
            </div>
          ))}
        </div>
      </section>

      <style>{css}</style>
    </div>
  );
}

function InviteDriver({ sponsorName, onInvite }) {
  const [open, setOpen] = React.useState(false);
  const [drivers, setDrivers] = React.useState([]);
  const [selectedDriver, setSelectedDriver] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");

  // ✅ Safely load drivers only when dropdown is opened and sponsorName is defined
  React.useEffect(() => {
    if (open && sponsorName) {
      (async function fetchDrivers() {
        try {
          setLoading(true);
          setErr("");
          const res = await fetch(`/api/available-drivers/${encodeURIComponent(sponsorName)}`);
          if (!res.ok) {
            throw new Error(`Failed to load drivers (${res.status})`);
          }
          const data = await res.json();
          if (!Array.isArray(data)) throw new Error("Invalid data format from server");
          setDrivers(data);
        } catch (e) {
          console.error("Error loading available drivers:", e);
          setErr("Could not load available drivers. Please try again.");
          setDrivers([]);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open, sponsorName]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    if (!selectedDriver) {
      setErr("Please select a driver");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/invite-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsor_username: sponsorName,
          driver_username: selectedDriver,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Invite failed");
      setOk(`Invite sent to ${selectedDriver}`);
      setSelectedDriver("");
      setOpen(false);
      if (onInvite) onInvite(); // Refresh parent roster
    } catch (e) {
      console.error("Error sending invite:", e);
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Guard: if sponsorName is missing, show nothing to avoid crashes
  if (!sponsorName) {
    return (
      <div className="invite">
        <p className="muted">No sponsor name found. Please log in again.</p>
      </div>
    );
  }

  return (
    <div className="invite">
      {!open ? (
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          + Invite Driver
        </button>
      ) : (
        <form className="invite-form" onSubmit={submit}>
          {loading && <span className="muted">Loading drivers...</span>}
          {err && <span className="err">{err}</span>}
          {!loading && drivers.length > 0 && (
            <select
              className="input"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
            >
              <option value="">Select a driver...</option>
              {drivers.map((d) => (
                <option key={d.username} value={d.username}>
                  {d.username} ({d.email})
                </option>
              ))}
            </select>
          )}
          {!loading && !drivers.length && !err && (
            <span className="muted">No available drivers to invite.</span>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              className="btn btn-primary"
              disabled={loading || !selectedDriver}
              type="submit"
            >
              {loading ? "Inviting…" : "Send Invite"}
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setOpen(false);
                setErr("");
                setOk("");
              }}
            >
              Cancel
            </button>
          </div>

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
.grid-3 { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }

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
.pill.active, .pill.accepted { background: #eefbf1; color: #0a8f3d; border-color: #cef0d6; }
.pill.invited, .pill.pending { background: #eef3ff; color: #1e4dd8; border-color: #cfdaff; }
.pill.declined { background: #fdecec; color: #d32f2f; border-color: #f5c6cb; }

.invite { display:flex; align-items:center; gap: 12px; }
.invite-form { display:flex; align-items:center; gap:8px; flex-wrap: wrap; }
.input { padding:8px 10px; border:1px solid #ddd; border-radius:10px; min-width: 160px; }
.btn { padding:8px 14px; border:1px solid #ddd; border-radius:999px; background:#fff; cursor:pointer; }
.btn:hover { background:#f6f6f6; }
.btn-primary { background:#000; color:#fff; border-color:#000; }
.btn-primary:hover { opacity:.9; }
.refresh-btn { background:#27ae60; color:white; border:none; border-radius:999px; }
.refresh-btn:hover { background:#1e874b; }
.err { margin-left:8px; color:#b00020; }
.ok  { margin-left:8px; color:#0a8f3d; }

.logout-btn { background:#e74c3c; color:white; border:none; border-radius:8px; padding:8px 16px; cursor:pointer; margin-top:8px; font-weight:600; }
.logout-btn:hover { background:#c0392b; }

.catalog-btn { background:#3498db; color:white; border:none; border-radius:8px; padding:8px 16px; cursor:pointer; font-weight:600; }
.catalog-btn:hover { background:#2980b9; }
.remove-btn {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 999px;
}
.remove-btn:hover {
  background: #c0392b;
}

`;
