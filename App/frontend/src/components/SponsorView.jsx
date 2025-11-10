import React, { useEffect, useState } from "react";

export default function SponsorView({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [orgError, setOrgError] = useState("");
  const [orgSuccess, setOrgSuccess] = useState("");
  const [view, setView] = useState("dashboard");
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("truck");

  // Load sponsor data
  useEffect(() => {
    async function load() {
      try {
        setError("");
        const meRes = await fetch(`/api/sponsor/me`);
        const me = meRes.ok ? await meRes.json() : { name: user?.username };
        setProfile(me);

        // Load drivers
        const driverRes = await fetch(`/api/sponsor/drivers/${me.name}`);
        const driverData = driverRes.ok ? await driverRes.json() : { drivers: [] };
        setDrivers(driverData.drivers);

        // Load organizations for this sponsor
        const orgRes = await fetch(`/api/organizations/by-sponsor/${me.name}`);
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setOrganizations(orgData);
          if (orgData.length > 0) setActiveOrg(orgData[0]);
        } else {
          setOrganizations([]);
          setActiveOrg(null);
        }
      } catch (err) {
        console.error("Error loading sponsor data:", err);
        setError("Failed to load sponsor data.");
      }
    }
    load();
  }, [user?.username]);

  // Create new organization
  async function handleCreateOrganization() {
    setCreating(true);
    setOrgError("");
    setOrgSuccess("");

    try {
      const res = await fetch(`/api/organizations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName, username: profile?.name }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrganizations((prev) => [...prev, data.organization]);
        setActiveOrg(data.organization);
        setOrgSuccess("✅ Organization created successfully!");
        setOrgName("");
      } else {
        setOrgError(data.error || "Failed to create organization.");
      }
    } catch (err) {
      console.error("Error creating organization:", err);
      setOrgError("Server error while creating organization.");
    } finally {
      setCreating(false);
    }
  }

  // Load eBay catalog
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

  // === DASHBOARD VIEW ===
  if (view === "dashboard") {
    return (
      <div className="sponsor-view">
        <header className="sv-header">
          <h1>
            Sponsor Dashboard — {profile?.name}
            {activeOrg && (
              <span style={{ color: "#3498db", marginLeft: "8px" }}>
                ({activeOrg.name})
              </span>
            )}
          </h1>
          <p className="muted">Manage your drivers and organizations.</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button className="btn catalog-btn" onClick={() => setView("catalog")}>
              eBay Catalog
            </button>
            {onLogout && (
              <button className="btn logout-btn" onClick={onLogout}>
                Log Out
              </button>
            )}
          </div>
        </header>

        {error && <div className="error">{error}</div>}

        {/* 🏢 Organization Management */}
        <section className="panel">
          <h2>Organizations</h2>
          {organizations.length > 0 ? (
            <div style={{ marginBottom: "12px" }}>
              <label><strong>Active Organization:</strong></label>
              <select
                value={activeOrg?.id || ""}
                onChange={(e) => {
                  const org = organizations.find((o) => o.id === parseInt(e.target.value));
                  setActiveOrg(org);
                }}
                className="input"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="muted">You haven’t created any organizations yet.</p>
          )}

          <div style={{ marginTop: "8px" }}>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enter new organization name"
              className="input"
            />
            <button
              className="btn btn-primary"
              onClick={handleCreateOrganization}
              disabled={creating || !orgName.trim()}
            >
              {creating ? "Creating..." : "Create New Organization"}
            </button>
            {orgError && <p className="err">{orgError}</p>}
            {orgSuccess && <p className="ok">{orgSuccess}</p>}
          </div>
        </section>

        {/* 🚚 Driver Roster */}
        <section className="panel">
          <h2>Driver Roster</h2>
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
                <tr key={d.username}>
                  <td>{d.username}</td>
                  <td>{d.email}</td>
                  <td>{d.status}</td>
                </tr>
              ))}
              {!drivers.length && (
                <tr>
                  <td colSpan="3" className="muted center">
                    No drivers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <style>{css}</style>
      </div>
    );
  }

  // === CATALOG VIEW ===
  return (
    <div className="sponsor-view">
      <header className="sv-header">
        <h1>eBay Catalog — {profile?.name}</h1>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button className="btn catalog-btn" onClick={() => setView("dashboard")}>
            Back to Dashboard
          </button>
          {onLogout && (
            <button className="btn logout-btn" onClick={onLogout}>
              Log Out
            </button>
          )}
        </div>
      </header>

      <section className="panel">
        <h2>eBay Catalog</h2>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search eBay..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
          <button className="btn btn-primary" onClick={() => loadCatalog(searchTerm)}>
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

/* === STYLES === */
const css = `
.sponsor-view { display: grid; gap: 16px; }
.sv-header h1 { margin: 0; }
.panel { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 16px; }
.input { padding: 8px; border: 1px solid #ddd; border-radius: 8px; margin-right: 8px; }
.btn { padding: 8px 14px; border-radius: 8px; border: 1px solid #ddd; cursor: pointer; }
.btn-primary { background: #007bff; color: white; border: none; }
.btn-primary:hover { background: #0069d9; }
.catalog-btn { background: #3498db; color: white; border: none; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-weight: 600; }
.catalog-btn:hover { background: #2980b9; }
.err { color: #b00020; margin-top: 8px; }
.ok { color: #0a8f3d; margin-top: 8px; }
.muted { color: #777; }
.center { text-align: center; }
.logout-btn { background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 8px; }
.logout-btn:hover { background: #c0392b; }
.grid { display: grid; gap: 16px; }
.grid-3 { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.table { width: 100%; border-collapse: collapse; margin-top: 8px; }
.table th, .table td { padding: 10px 12px; border-bottom: 1px solid #eee; text-align: left; }
.table th { background: #fafafa; font-weight: 600; }
`;
