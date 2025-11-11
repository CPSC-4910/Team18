// App/frontend/src/components/DriverView.jsx
import React from "react";

export default function DriverView({ user, onLogout }) {
  const [health, setHealth] = React.useState({ ok: null, msg: "" });
  const [db, setDb] = React.useState({ ok: null, msg: "" });
  const [loading, setLoading] = React.useState(true);
  const [invitations, setInvitations] = React.useState([]);

  // === NEW STATE ===
  const [organization, setOrganization] = React.useState(null);
  const [points, setPoints] = React.useState(0);
  const [catalog, setCatalog] = React.useState([]);
  const [loadingCatalog, setLoadingCatalog] = React.useState(false);
  // =================

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

  // Check backend + DB (existing logic)
  React.useEffect(() => {
    let ignore = false;
    async function check() {
      setLoading(true);
      try {
        const h = await fetch("/api/health").catch(() => null);
        if (!ignore && h && h.ok) setHealth({ ok: true, msg: "Server is running" });
        else setHealth({ ok: false, msg: "Unable to reach backend" });

        const d = await fetch("/api/test-db").catch(() => null);
        if (!ignore && d && d.ok) setDb({ ok: true, msg: "Database connected" });
        else setDb({ ok: false, msg: "Database connection failed" });
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    check();
    return () => (ignore = true);
  }, []);

  // Load invitations + NEW: Load organization, points, and catalog
  React.useEffect(() => {
    if (effectiveUser?.username) {
      loadInvitations();
      loadOrganizationAndPoints();
    }
  }, [effectiveUser?.username]);

  // NEW: Load organization, points, and catalog
  async function loadOrganizationAndPoints() {
    if (!effectiveUser?.username) return;
    try {
      setLoadingCatalog(true);
      const res = await fetch(`/api/driver/my-organization/${effectiveUser.username}`);
      if (res.ok) {
        const data = await res.json();
        setOrganization(data.organization);
        setPoints(data.points);
        // If org was found, load its catalog
        if (data.organization?.id) {
          loadCatalog(data.organization.id);
        }
      } else {
        setOrganization(null); // No active org
      }
    } catch (err) {
      console.error("Failed to load organization info:", err);
    } finally {
      setLoadingCatalog(false);
    }
  }

  // NEW: Load catalog for a specific org
  async function loadCatalog(orgId) {
    try {
      const res = await fetch(`/api/organizations/catalog/${orgId}`);
      if (res.ok) {
        setCatalog(await res.json());
      }
    } catch (err) {
      console.error("Failed to load catalog:", err);
    }
  }
  
  // (Existing) Load sponsor invitations
  async function loadInvitations() {
    try {
      const res = await fetch(`/api/driver/invitations/${effectiveUser.username}`);
      if (res.ok) setInvitations(await res.json());
    } catch (err) {
      console.error("Failed to load invitations:", err);
    }
  }

  // (Existing) Respond to invitation
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
        if (accept) loadOrganizationAndPoints(); // NEW: Refresh org if accepted
      } else {
        console.error("Failed to respond to invitation");
      }
    } catch (err) {
      console.error("Error responding to invite:", err);
    }
  }

  // === NEW: REDEEM ITEM ===
  async function redeemItem(item) {
    if (!organization) return;
    
    if (!confirm(`Redeem "${item.title}" for ${item.points_cost} points?`)) return;

    try {
      const res = await fetch("/api/points/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_username: effectiveUser.username,
          itemId: item.id,
          organization_id: organization.id
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Success! Redeemed "${data.itemTitle}".\nYour new balance is ${data.newBalance} points.`);
        setPoints(data.newBalance); // Update points in UI
      } else {
        alert(`Error: ${data.error || "Failed to redeem item"}`);
      }
    } catch (err) {
      console.error("Error redeeming item:", err);
      alert("A server error occurred.");
    }
  }
  // ==========================

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
        {/* NEW: Points StatCard */}
        <StatCard
          label="My Points"
          value={organization ? points : "N/A"}
          good={organization ? points > 0 : null}
        />
      </section>

      {/* NEW: Organization and Catalog Section */}
      {organization ? (
        <section className="panel">
          <h2 className="panel-title">
            Organization Catalog ({organization.name})
          </h2>
          {loadingCatalog && <p className="muted">Loading catalog...</p>}
          
          <div className="catalog-grid">
            {catalog.length > 0 ? (
              catalog.map((item) => (
                <div key={item.id} className="catalog-card">
                  <img src={item.image_url} alt={item.title} />
                  <h3>{item.title}</h3>
                  <p className="price">${item.price}</p>
                  <p className="points">{item.points_cost} points</p>
                  <a href={item.item_url} target="_blank" rel="noopener noreferrer" className="link">
                    View on eBay →
                  </a>
                  <button
                    className="btn btn-primary"
                    onClick={() => redeemItem(item)}
                    disabled={points < item.points_cost}
                  >
                    {points < item.points_cost ? "Need Points" : "Redeem"}
                  </button>
                </div>
              ))
            ) : (
              !loadingCatalog && <p className="muted">No items in this catalog yet.</p>
            )}
          </div>
        </section>
      ) : (
        !loading && <p className="muted">You are not yet linked to an organization. Please accept a sponsor invitation.</p>
      )}


      {/* Sponsor Invitations Panel (Existing) */}
      <section className="panel">
        <h2 className="panel-title">Sponsor Invitations</h2>
        {invitations.length === 0 ? (
          <p className="muted">No pending invitations.</p>
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
                <span className="status-badge">{inv.status}</span>
              )}
            </div>
          ))
        )}
      </section>

      {/* Details Panel (Existing) */}
      <section className="panel">
        <h2 className="panel-title">Details</h2>
        <ul className="kv">
          <li><span>Username</span><strong>{effectiveUser?.username ?? "—"}</strong></li>
          <li><span>Email</span><strong>{effectiveUser?.email ?? "—"}</strong></li>
          <li><span>Backend</span><strong>{health.msg}</strong></li>
          <li><span>Database</span><strong>{db.msg}</strong></li>
        </ul>
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
.driver-view { display: grid; gap: 16px; max-width: 1200px; margin: 0 auto; }
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

.btn { padding: 6px 12px; border-radius: 8px; border: 1px solid #ddd; background: #fff; cursor: pointer; font-weight: 500; }
.btn:hover { background: #f0f0f0; }
.btn:disabled { background: #f5f5f5; color: #aaa; cursor: not-allowed; }
.btn-primary { background: #007bff; color: white; border-color: #007bff; }
.btn-primary:hover { background: #0069d9; }
.btn-primary:disabled { background: #a9d6ff; border-color: #a9d6ff; }
.logout-btn { background: #e74c3c; color: white; border: none; padding: 8px 16px; cursor: pointer; margin-top: 8px; font-weight: 600; }
.logout-btn:hover { background: #c0392b; }

/* Invitation list styles */
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.gap-2 { gap: 8px; }
.mb-2 { margin-bottom: 8px; }
.pb-2 { padding-bottom: 8px; }
.border-b { border-bottom: 1px solid #eee; }
.text-gray-600 { color: #666; }
.text-sm { font-size: 0.875rem; }

/* NEW CATALOG STYLES */
.catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.catalog-card { border: 1px solid #e0e0e0; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; }
.catalog-card img { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; }
.catalog-card h3 { font-size: 14px; margin: 8px 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; flex-grow: 1; }
.catalog-card .price { font-weight: 600; color: #666; margin: 4px 0; }
.catalog-card .points { font-weight: 700; color: #0a8f3d; font-size: 1.1rem; margin: 4px 0; }
.catalog-card .link { color: #007bff; font-size: 13px; display: block; margin: 8px 0; }
.catalog-card .btn { width: 100%; margin-top: auto; }
`;