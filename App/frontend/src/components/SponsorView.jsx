// App/frontend/src/components/SponsorView.jsx - UPDATED with Points Display
import React, { useEffect, useState } from "react";
import { Award, Package, Users, TrendingUp, UserPlus, Coins } from "lucide-react";
import EbayApiTest from "./EbayApiTest";

// Invite Drivers Component
function InviteDriversView({ profile, setView }) {
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [invitedDrivers, setInvitedDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  async function loadDrivers() {
    setLoading(true);
    try {
      const availRes = await fetch(`/api/available-drivers/${profile.name}`);
      if (availRes.ok) {
        const availData = await availRes.json();
        setAvailableDrivers(availData);
      }

      const invitedRes = await fetch(`/api/sponsor/invited-drivers/${profile.name}`);
      if (invitedRes.ok) {
        const invitedData = await invitedRes.json();
        setInvitedDrivers(invitedData);
      }
    } catch (err) {
      console.error("Error loading drivers:", err);
    } finally {
      setLoading(false);
    }
  }

  async function inviteDriver(driverUsername) {
    try {
      const res = await fetch("/api/invite-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsor_username: profile.name,
          driver_username: driverUsername,
        }),
      });

      if (res.ok) {
        alert(`✅ Invitation sent to ${driverUsername}`);
        loadDrivers();
      } else {
        const data = await res.json();
        alert(`❌ ${data.error || "Failed to send invitation"}`);
      }
    } catch (err) {
      console.error("Error inviting driver:", err);
      alert("❌ Server error");
    }
  }

  async function removeDriver(driverUsername) {
    if (!confirm(`Remove ${driverUsername} from your roster?`)) return;

    try {
      const res = await fetch("/api/sponsor/remove-driver", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsor_username: profile.name,
          driver_username: driverUsername,
        }),
      });

      if (res.ok) {
        alert(`✅ Removed ${driverUsername}`);
        loadDrivers();
      } else {
        alert("❌ Failed to remove driver");
      }
    } catch (err) {
      console.error("Error removing driver:", err);
      alert("❌ Server error");
    }
  }

  return (
    <div className="sponsor-view">
      <header className="sv-header">
        <h1><UserPlus className="icon-inline" /> Invite Drivers</h1>
        <button className="btn" onClick={() => setView("dashboard")}>
          ← Back to Dashboard
        </button>
      </header>

      {loading && <div className="panel">Loading drivers...</div>}

      <section className="panel">
        <h2>Available Drivers</h2>
        {availableDrivers.length === 0 ? (
          <p className="muted">No available drivers to invite.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {availableDrivers.map((driver) => (
                <tr key={driver.username}>
                  <td>{driver.username}</td>
                  <td>{driver.email}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => inviteDriver(driver.username)}
                    >
                      Send Invitation
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2>Your Drivers</h2>
        {invitedDrivers.length === 0 ? (
          <p className="muted">No drivers invited yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invitedDrivers.map((driver) => (
                <tr key={driver.driver_username}>
                  <td>{driver.driver_username}</td>
                  <td>{driver.driver_email}</td>
                  <td>
                    <span className={`badge ${driver.status}`}>{driver.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeDriver(driver.driver_username)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default function SponsorView({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [driverPoints, setDriverPoints] = useState({});
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [view, setView] = useState("dashboard");
  const [catalog, setCatalog] = useState([]);
  const [myCatalog, setMyCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("truck parts");
  const [error, setError] = useState("");
  
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [pointsToAward, setPointsToAward] = useState("");
  const [pointsReason, setPointsReason] = useState("");
  const [awardingPoints, setAwardingPoints] = useState(false);
  
  const [editingItemId, setEditingItemId] = useState(null);
  const [tempPointsCost, setTempPointsCost] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const me = { name: user?.username };
        setProfile(me);

        const driverRes = await fetch(`/api/sponsor/drivers/${me.name}`);
        const driverData = driverRes.ok ? await driverRes.json() : { drivers: [] };
        setDrivers(driverData.drivers);

        const orgRes = await fetch(`/api/organizations/by-sponsor/${me.name}`);
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setOrganizations(orgData);
          const active = orgData.find((o) => o.is_active) || orgData[0];
          setActiveOrg(active);
          if (active) {
            loadMyCatalog(active.id);
            loadDriverPoints(active.id);
          }
        }
      } catch (err) {
        console.error("Error loading sponsor data:", err);
        setError("Failed to load sponsor data.");
      }
    }
    load();
  }, [user?.username]);

  async function loadDriverPoints(orgId) {
    if (!orgId) return;
    
    try {
      const res = await fetch(`/api/points/balances/${orgId}`);
      if (res.ok) {
        const data = await res.json();
        const pointsMap = {};
        data.forEach(balance => {
          pointsMap[balance.driver_username] = balance.balance;
        });
        setDriverPoints(pointsMap);
      }
    } catch (err) {
      console.error("Failed to load driver points:", err);
    }
  }

  async function loadEbayCatalog(query) {
    setLoadingCatalog(true);
    setError("");
    try {
      console.log("Searching eBay for:", query);
      const res = await fetch(`/api/ebay/catalog?q=${encodeURIComponent(query)}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch eBay catalog");
      }
      
      const data = await res.json();
      console.log("eBay results:", data.length, "items");
      
      if (Array.isArray(data) && data.length === 0) {
        setError("No results found. Try a different search term.");
      }
      
      setCatalog(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load eBay catalog:", err);
      setError(`eBay search failed: ${err.message}`);
      setCatalog([]);
    } finally {
      setLoadingCatalog(false);
    }
  }

  async function loadMyCatalog(orgId) {
    try {
      const res = await fetch(`/api/organizations/catalog/${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setMyCatalog(data);
      }
    } catch (err) {
      console.error("Failed to load organization catalog:", err);
    }
  }

  async function addToCatalog(item, pointsCost = 0) {
    if (!activeOrg) {
      alert("❌ Please select an organization first");
      return;
    }

    const points = parseInt(pointsCost);
    if (isNaN(points) || points < 0) {
      alert("❌ Please enter a valid points cost (0 or greater)");
      return;
    }

    try {
      const res = await fetch("/api/organizations/catalog/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: activeOrg.id,
          sponsor_username: profile.name,
          item: {
            itemId: item.itemId,
            title: item.title,
            price: item.price,
            image: item.image,
            itemWebUrl: item.itemWebUrl
          },
          points_cost: points,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ Added "${item.title}" to your catalog with ${points} points cost`);
        await loadMyCatalog(activeOrg.id);
      } else {
        console.error("Failed to add item:", data);
        alert(`❌ ${data.error || "Failed to add item"}`);
      }
    } catch (err) {
      console.error("Error adding to catalog:", err);
      alert("❌ Server error adding item");
    }
  }

  async function updateItemPoints(itemId, newPointsCost) {
    try {
      const res = await fetch(`/api/organizations/catalog/${itemId}/points`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points_cost: newPointsCost }),
      });

      if (res.ok) {
        alert("✅ Points cost updated");
        loadMyCatalog(activeOrg.id);
        setEditingItemId(null);
      } else {
        alert("❌ Failed to update points cost");
      }
    } catch (err) {
      console.error("Error updating points:", err);
      alert("❌ Server error");
    }
  }

  async function removeFromCatalog(itemId) {
    if (!confirm("Remove this item from the catalog?")) return;

    try {
      const res = await fetch(`/api/organizations/catalog/${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("✅ Item removed");
        setMyCatalog((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        alert("❌ Failed to remove item");
      }
    } catch (err) {
      console.error("Error removing item:", err);
      alert("❌ Server error");
    }
  }

  async function awardPoints() {
    if (!selectedDriver || !pointsToAward || !activeOrg) {
      alert("❌ Please select a driver, enter points, and ensure you have an active organization");
      return;
    }

    const points = parseInt(pointsToAward);
    if (isNaN(points) || points <= 0) {
      alert("❌ Please enter a valid positive number");
      return;
    }

    setAwardingPoints(true);
    try {
      const res = await fetch("/api/points/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_username: selectedDriver,
          sponsor_username: profile.name,
          organization_id: activeOrg.id,
          points,
          reason: pointsReason || "Points awarded by sponsor",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ Awarded ${points} points to ${selectedDriver}! New balance: ${data.newBalance}`);
        setPointsToAward("");
        setPointsReason("");
        setSelectedDriver(null);
        loadDriverPoints(activeOrg.id);
      } else {
        console.error("Failed to award points:", data);
        alert(`❌ ${data.error || "Failed to award points"}`);
      }
    } catch (err) {
      console.error("Error awarding points:", err);
      alert("❌ Server error");
    } finally {
      setAwardingPoints(false);
    }
  }

  // === DASHBOARD VIEW ===
  if (view === "dashboard") {
    return (
      <div className="sponsor-view">
        <header className="sv-header">
          <h1>Sponsor Dashboard — {profile?.name}</h1>
          {activeOrg && <p className="org-badge">Organization: {activeOrg.name}</p>}
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setView("invite")}>
              <Users className="icon" /> Invite Drivers
            </button>
            <button className="btn btn-secondary" onClick={() => setView("catalog")}>
              <Package className="icon" /> Manage Catalog
            </button>
            <button className="btn btn-secondary" onClick={() => setView("points")}>
              <Award className="icon" /> Award Points
            </button>
            <button className="btn btn-logout" onClick={onLogout}>
              Log Out
            </button>
          </div>
        </header>

        {error && <div className="error">{error}</div>}

        <section className="panel">
          <h2><Package className="icon-inline" /> Active Organization</h2>
          {organizations.length > 0 ? (
            <select
              value={activeOrg?.id || ""}
              onChange={(e) => {
                const org = organizations.find((o) => o.id === parseInt(e.target.value));
                setActiveOrg(org);
                if (org) {
                  loadMyCatalog(org.id);
                  loadDriverPoints(org.id);
                }
              }}
              className="input"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="muted">No organizations found</p>
          )}
        </section>

        <section className="panel">
          <h2><Users className="icon-inline" /> Driver Roster with Points</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
                <th><Coins className="icon-inline" /> Points Balance</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length > 0 ? (
                drivers.map((d) => (
                  <tr key={d.username}>
                    <td>{d.username}</td>
                    <td>{d.email}</td>
                    <td><span className="badge">{d.status}</span></td>
                    <td className="points-cell">
                      <strong>{driverPoints[d.username] !== undefined ? driverPoints[d.username] : 0}</strong> points
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="muted center">No drivers yet. Click "Invite Drivers" to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <style>{css}</style>
      </div>
    );
  }

  if (view === "invite") {
    return <InviteDriversView profile={profile} setView={setView} />;
  }

  if (view === "points") {
    return (
      <div className="sponsor-view">
        <header className="sv-header">
          <h1><Award className="icon-inline" /> Award Points to Drivers</h1>
          <button className="btn" onClick={() => setView("dashboard")}>
            ← Back to Dashboard
          </button>
        </header>

        {!activeOrg && (
          <div className="panel error">
            ⚠️ Please select or create an organization first
          </div>
        )}

        <section className="panel">
          <h2>Select Driver and Award Points</h2>
          {activeOrg && <p className="muted">Awarding points for: <strong>{activeOrg.name}</strong></p>}
          
          <div className="form-grid">
            <div className="form-group">
              <label>Driver</label>
              <select
                value={selectedDriver || ""}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="input"
              >
                <option value="">-- Select Driver --</option>
                {drivers.filter(d => d.status === 'accepted').map((d) => (
                  <option key={d.username} value={d.username}>
                    {d.username} ({d.email}) - Current: {driverPoints[d.username] || 0} pts
                  </option>
                ))}
              </select>
              {drivers.filter(d => d.status === 'accepted').length === 0 && (
                <p className="muted small">No accepted drivers. Invite drivers first.</p>
              )}
            </div>

            <div className="form-group">
              <label>Points to Award</label>
              <input
                type="number"
                value={pointsToAward}
                onChange={(e) => setPointsToAward(e.target.value)}
                placeholder="e.g. 100"
                className="input"
                min="1"
              />
            </div>

            <div className="form-group full-width">
              <label>Reason (optional)</label>
              <input
                type="text"
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                placeholder="e.g. Safe driving bonus"
                className="input"
              />
            </div>

            <button
              className="btn btn-primary full-width"
              onClick={awardPoints}
              disabled={awardingPoints || !selectedDriver || !pointsToAward || !activeOrg}
            >
              {awardingPoints ? "Awarding..." : "Award Points"}
            </button>
          </div>
        </section>

        <style>{css}</style>
      </div>
    );
  }

  return (
    <div className="sponsor-view">
      <header className="sv-header">
        <h1><Package className="icon-inline" /> Catalog Management</h1>
        <button className="btn" onClick={() => setView("dashboard")}>
          ← Back to Dashboard
        </button>
      </header>
      
      <EbayApiTest />

      <section className="panel">
        <h2>Search eBay Products</h2>
        <div className="search-bar">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search eBay..."
            className="input"
          />
          <button className="btn btn-primary" onClick={() => loadEbayCatalog(searchTerm)}>
            Search
          </button>
        </div>

        {loadingCatalog && <p>Loading items...</p>}

        <div className="catalog-grid">
          {catalog.map((item) => (
            <div key={item.itemId} className="catalog-card">
              <img src={item.image?.imageUrl} alt={item.title} />
              <h3>{item.title}</h3>
              <p className="price">${item.price?.value} {item.price?.currency}</p>
              <a href={item.itemWebUrl} target="_blank" rel="noopener noreferrer" className="link">
                View on eBay →
              </a>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const points = prompt("Enter points cost for this item:", "100");
                  if (points !== null && points !== "") {
                    addToCatalog(item, parseInt(points) || 0);
                  }
                }}
              >
                + Add to Catalog
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>My Organization Catalog</h2>
        <p className="muted">Items in <strong>{activeOrg?.name}</strong> catalog</p>
        <button
          className="btn btn-secondary"
          onClick={() => activeOrg && loadMyCatalog(activeOrg.id)}
        >
          🔄 Refresh
        </button>

        <div className="catalog-grid">
          {myCatalog.length > 0 ? (
            myCatalog.map((item) => (
              <div key={item.id} className="catalog-card">
                <img src={item.image_url} alt={item.title} />
                <h3>{item.title}</h3>
                <p className="price">${item.price} {item.currency}</p>
                
                {editingItemId === item.id ? (
                  <div className="points-editor">
                    <input
                      type="number"
                      value={tempPointsCost}
                      onChange={(e) => setTempPointsCost(e.target.value)}
                      className="input-sm"
                      placeholder="Points"
                    />
                    <button
                      className="btn btn-primary btn-xs"
                      onClick={() => updateItemPoints(item.id, parseInt(tempPointsCost) || 0)}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => setEditingItemId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="points-display">
                    <strong>{item.points_cost} points</strong>
                    <button
                      className="btn-icon"
                      onClick={() => {
                        setEditingItemId(item.id);
                        setTempPointsCost(item.points_cost);
                      }}
                    >
                      ✏️
                    </button>
                  </div>
                )}

                <a href={item.item_url} target="_blank" rel="noopener noreferrer" className="link">
                  View on eBay →
                </a>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removeFromCatalog(item.id)}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="muted">No items in catalog yet</p>
          )}
        </div>
      </section>

      <style>{css}</style>
    </div>
  );
}

const css = `
.sponsor-view { padding: 20px; max-width: 1400px; margin: 0 auto; }
.sv-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.sv-header h1 { margin: 0; display: flex; align-items: center; gap: 8px; }
.org-badge { background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 16px; font-weight: 600; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.panel { background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
.panel h2 { margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }

.input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
.input-sm { width: 80px; padding: 6px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; }

.btn { padding: 10px 16px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
.btn:hover { transform: translateY(-1px); }
.btn-primary { background: #1976d2; color: white; }
.btn-primary:hover { background: #1565c0; }
.btn-secondary { background: #2196f3; color: white; }
.btn-secondary:hover { background: #1976d2; }
.btn-danger { background: #f44336; color: white; }
.btn-danger:hover { background: #d32f2f; }
.btn-logout { background: #e74c3c; color: white; }
.btn-logout:hover { background: #c0392b; }
.btn-ghost { background: transparent; border: 1px solid #ddd; }
.btn-ghost:hover { background: #f5f5f5; }
.btn-sm { padding: 6px 12px; font-size: 13px; }
.btn-xs { padding: 4px 8px; font-size: 12px; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 16px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.icon { width: 20px; height: 20px; }
.icon-inline { width: 22px; height: 22px; vertical-align: middle; }

.search-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.search-bar .input { flex: 1; }

.catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-top: 16px; }
.catalog-card { border: 1px solid #e0e0e0; border-radius: 12px; padding: 12px; transition: transform 0.2s, box-shadow 0.2s; }
.catalog-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.catalog-card img { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; }
.catalog-card h3 { font-size: 14px; margin: 8px 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; min-height: 40px; }
.catalog-card .price { font-weight: 600; color: #1976d2; margin: 4px 0; }
.catalog-card .link { color: #1976d2; font-size: 13px; display: block; margin: 8px 0; }

.points-display { display: flex; align-items: center; justify-content: space-between; margin: 8px 0; }
.points-editor { display: flex; gap: 4px; align-items: center; margin: 8px 0; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; }
.form-group label { font-weight: 600; margin-bottom: 6px; }
.full-width { grid-column: 1 / -1; }

.table { width: 100%; border-collapse: collapse; margin-top: 12px; }
.table th, .table td { padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: left; }
.table th { background: #f5f5f5; font-weight: 600; }
.points-cell { font-family: monospace; color: #0a8f3d; }
.badge { background: #4caf50; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.badge.pending { background: #ff9800; }
.badge.declined { background: #f44336; }

.muted { color: #757575; }
.muted.small { font-size: 12px; margin-top: 4px; }
.center { text-align: center; }
.error { background: #ffebee; color: #c62828; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
`;