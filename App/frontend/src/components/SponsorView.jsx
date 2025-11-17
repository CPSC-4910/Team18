// App/frontend/src/components/SponsorView.jsx
// WITH ACCOUNT MANAGEMENT TAB

import React, { useEffect, useState } from "react";
import {
  Award,
  Package,
  Users,
  TrendingUp,
  XCircle,
  CheckCircle,
  Mail,
  User,
  Lock,
} from "lucide-react";

export default function SponsorView({ user, onLogout }) {
  const [profile, setProfile] = useState(null);

  // Organization state
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);

  // Applications
  const [applications, setApplications] = useState([]);

  // Catalog
  const [catalog, setCatalog] = useState([]);
  const [myCatalog, setMyCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("truck parts");

  // Award Points
  const [drivers, setDrivers] = useState([]);
  const [driverPoints, setDriverPoints] = useState({});
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [pointsToAward, setPointsToAward] = useState("");
  const [pointsReason, setPointsReason] = useState("");
  const [awardingPoints, setAwardingPoints] = useState(false);

  // Account Management
  const [editEmail, setEditEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [updatingAccount, setUpdatingAccount] = useState(false);

  // UI view
  const [view, setView] = useState("dashboard");

  // Errors
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const me = { name: user.username };
      setProfile(me);
      setEditEmail(user.email || "");

      await loadOrganizations(me.name);
    }
    load();
  }, [user.username]);

  async function loadOrganizations(sponsorUsername) {
    try {
      const res = await fetch(`/api/organizations/by-sponsor/${sponsorUsername}`);
      const data = await res.json();
      setOrganizations(data);

      const active = data.find((o) => o.is_active) || data[0];
      setActiveOrg(active);

      if (active) {
        await loadApplications(active.id);
        await loadOrgCatalog(active.id);
        await loadDriverPoints(active.id);
        await loadDrivers(active.id);
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
      setError("Failed to load organization data.");
    }
  }

  // -------- APPLICATION MANAGEMENT --------
  async function loadApplications(orgId) {
    try {
      const res = await fetch(`/api/applications/${orgId}`);
      const apps = await res.json();
      setApplications(apps || []);
    } catch (err) {
      console.error("Error loading apps:", err);
    }
  }

  async function approveApplication(appId) {
    try {
      const res = await fetch(`/api/applications/${appId}/approve`, {
        method: "PATCH",
      });

      if (res.ok) {
        alert("Application approved.");
        loadApplications(activeOrg.id);
        loadDrivers(activeOrg.id);
      } else {
        alert("Error approving application.");
      }
    } catch (err) {
      console.error("Error approving:", err);
    }
  }

  async function denyApplication(appId) {
    try {
      const res = await fetch(`/api/applications/${appId}/deny`, {
        method: "PATCH",
      });

      if (res.ok) {
        alert("Application denied.");
        loadApplications(activeOrg.id);
      } else {
        alert("Error denying application.");
      }
    } catch (err) {
      console.error("Error denying:", err);
    }
  }

  // -------- DRIVERS + POINTS --------
  async function loadDrivers(orgId) {
    try {
      const res = await fetch(`/api/memberships/by-org/${orgId}`);
      const data = await res.json();
      setDrivers(data || []);
    } catch (err) {
      console.error("Failed to load drivers:", err);
    }
  }

  async function loadDriverPoints(orgId) {
    try {
      const res = await fetch(`/api/points/balances/${orgId}`);
      const data = await res.json();

      const map = {};
      data.forEach((b) => {
        map[b.driver_username] = b.balance;
      });

      setDriverPoints(map);
    } catch (err) {
      console.error("Failed to load points:", err);
    }
  }

  async function awardPoints() {
    if (!selectedDriver || !pointsToAward || !activeOrg) {
      alert("Missing required fields.");
      return;
    }

    const points = parseInt(pointsToAward);
    if (isNaN(points) || points <= 0) {
      alert("Enter a positive number.");
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
          reason: pointsReason || "Points awarded",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Points awarded!");
        loadDriverPoints(activeOrg.id);
        setPointsToAward("");
        setPointsReason("");
        setSelectedDriver("");
      } else {
        alert(data.error || "Error awarding points.");
      }
    } catch (err) {
      console.error("Award points error:", err);
    } finally {
      setAwardingPoints(false);
    }
  }

  // -------- CATALOG --------
  async function loadEbayCatalog(query) {
    setLoadingCatalog(true);
    try {
      const res = await fetch(`/api/ebay/catalog?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCatalog(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("eBay error:", err);
      setCatalog([]);
    } finally {
      setLoadingCatalog(false);
    }
  }

  async function loadOrgCatalog(orgId) {
    try {
      const res = await fetch(`/api/organizations/catalog/${orgId}`);
      const data = await res.json();
      setMyCatalog(data || []);
    } catch (err) {
      console.error("Failed loading catalog:", err);
    }
  }

  async function addToCatalog(item, pointsCost) {
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
            itemWebUrl: item.itemWebUrl,
          },
          points_cost: pointsCost,
        }),
      });

      if (res.ok) {
        alert("Added to catalog!");
        loadOrgCatalog(activeOrg.id);
      } else {
        alert("Failed to add item.");
      }
    } catch (err) {
      console.error("Add to catalog error:", err);
    }
  }

  async function removeFromCatalog(itemId) {
    if (!confirm("Remove this item?")) return;

    try {
      const res = await fetch(`/api/organizations/catalog/${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Removed.");
        loadOrgCatalog(activeOrg.id);
      }
    } catch (err) {
      console.error("Remove catalog error:", err);
    }
  }

  // -------- ACCOUNT MANAGEMENT --------
  async function updateEmail() {
    if (!editEmail || editEmail === user.email) {
      setAccountMessage("No changes to save.");
      return;
    }

    setUpdatingAccount(true);
    setAccountMessage("");

    try {
      const res = await fetch("/api/users/update-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          newEmail: editEmail,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAccountMessage("✓ Email updated successfully!");
        // Update local user object
        user.email = editEmail;
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        setAccountMessage(`✗ ${data.error || "Failed to update email"}`);
      }
    } catch (err) {
      setAccountMessage("✗ Server error");
    } finally {
      setUpdatingAccount(false);
    }
  }

  async function updatePassword() {
    setAccountMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setAccountMessage("✗ All password fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      setAccountMessage("✗ New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setAccountMessage("✗ New passwords do not match.");
      return;
    }

    setUpdatingAccount(true);

    try {
      const res = await fetch("/api/users/update-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAccountMessage("✓ Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setAccountMessage(`✗ ${data.error || "Failed to update password"}`);
      }
    } catch (err) {
      setAccountMessage("✗ Server error");
    } finally {
      setUpdatingAccount(false);
    }
  }

  // ============= VIEWS =============

  if (view === "account") {
    return (
      <div className="sponsor-view">
        <header className="sv-header">
          <h1>Account Management</h1>
          <button className="btn" onClick={() => setView("dashboard")}>
            ← Back to Dashboard
          </button>
        </header>

        <section className="panel">
          <h2><User className="icon" /> Personal Information</h2>
          
          <div className="account-section">
            <label className="label">Username</label>
            <input
              type="text"
              className="input"
              value={user.username}
              disabled
              style={{ background: "#f5f5f5", cursor: "not-allowed" }}
            />
            <p className="help-text">Username cannot be changed</p>
          </div>

          <div className="account-section">
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              disabled={updatingAccount}
            />
            <button
              className="btn btn-primary"
              onClick={updateEmail}
              disabled={updatingAccount}
            >
              {updatingAccount ? "Updating..." : "Update Email"}
            </button>
          </div>

          <div className="account-section">
            <label className="label">Role</label>
            <input
              type="text"
              className="input"
              value={user.role}
              disabled
              style={{ background: "#f5f5f5", cursor: "not-allowed" }}
            />
          </div>
        </section>

        <section className="panel">
          <h2><Lock className="icon" /> Change Password</h2>

          <div className="account-section">
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={updatingAccount}
              placeholder="Enter current password"
            />
          </div>

          <div className="account-section">
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={updatingAccount}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="account-section">
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={updatingAccount}
              placeholder="Re-enter new password"
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={updatePassword}
            disabled={updatingAccount}
          >
            {updatingAccount ? "Updating..." : "Update Password"}
          </button>
        </section>

        {accountMessage && (
          <div className={`message ${accountMessage.includes("✓") ? "success" : "error"}`}>
            {accountMessage}
          </div>
        )}

        <style>{css}</style>
      </div>
    );
  }

  if (view === "applications") {
    return (
      <div className="sponsor-view">
        <header className="sv-header">
          <h1>Manage Applications</h1>
          <button className="btn" onClick={() => setView("dashboard")}>
            ← Back
          </button>
        </header>

        <section className="panel">
          <h2>Pending Applications</h2>

          {applications.length === 0 ? (
            <p className="muted">No pending applications.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Applied At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.driver_username}</td>
                    <td>{app.status}</td>
                    <td>{new Date(app.applied_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => approveApplication(app.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => denyApplication(app.id)}
                        style={{ marginLeft: "6px" }}
                      >
                        Deny
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <style>{css}</style>
      </div>
    );
  }

  if (view === "points") {
    return (
      <div className="sponsor-view">
        <header className="sv-header">
          <h1>Award Points</h1>
          <button className="btn" onClick={() => setView("dashboard")}>
            ← Back
          </button>
        </header>

        <section className="panel">
          <h2>Select Driver</h2>

          <select
            className="input"
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
          >
            <option value="">-- Select Driver --</option>
            {drivers.map((d) => (
              <option key={d.driver_username} value={d.driver_username}>
                {d.driver_username} — {driverPoints[d.driver_username] || 0} pts
              </option>
            ))}
          </select>

          <h2>Points</h2>
          <input
            className="input"
            type="number"
            value={pointsToAward}
            onChange={(e) => setPointsToAward(e.target.value)}
            placeholder="e.g. 100"
          />

          <h2>Reason</h2>
          <input
            className="input"
            value={pointsReason}
            onChange={(e) => setPointsReason(e.target.value)}
            placeholder="Reason (optional)"
          />

          <button className="btn btn-primary" onClick={awardPoints} disabled={awardingPoints}>
            {awardingPoints ? "Awarding..." : "Award Points"}
          </button>
        </section>

        <style>{css}</style>
      </div>
    );
  }

  if (view === "catalog") {
    return (
      <div className="sponsor-view">
        <header className="sv-header">
          <h1>Manage Catalog</h1>
          <button className="btn" onClick={() => setView("dashboard")}>
            ← Back
          </button>
        </header>

        <section className="panel">
          <h2>Search eBay</h2>
          <div className="search-bar">
            <input
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-primary" onClick={() => loadEbayCatalog(searchTerm)}>
              Search
            </button>
          </div>

          {loadingCatalog ? (
            <p>Loading…</p>
          ) : (
            <div className="catalog-grid">
              {catalog.map((item) => (
                <div key={item.itemId} className="catalog-card">
                  <img src={item.image.imageUrl} />
                  <h3>{item.title}</h3>
                  <p>${item.price.value}</p>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const points = prompt("Enter points cost:", "100");
                      if (points) addToCatalog(item, parseInt(points));
                    }}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <h2>My Catalog</h2>

          <div className="catalog-grid">
            {myCatalog.map((item) => (
              <div key={item.id} className="catalog-card">
                <img src={item.image_url} />
                <h3>{item.title}</h3>
                <p>${item.price}</p>
                <p>{item.points_cost} pts</p>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removeFromCatalog(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <style>{css}</style>
      </div>
    );
  }

  // -------- DASHBOARD --------
  return (
    <div className="sponsor-view">
      <header className="sv-header">
        <h1>Sponsor Dashboard — {profile?.name}</h1>
        {activeOrg && <p className="org-badge">Organization: {activeOrg.name}</p>}

        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setView("applications")}>
            <Users className="icon" /> Manage Applications
          </button>
          <button className="btn btn-secondary" onClick={() => setView("catalog")}>
            <Package className="icon" /> Manage Catalog
          </button>
          <button className="btn btn-secondary" onClick={() => setView("points")}>
            <Award className="icon" /> Award Points
          </button>
          <button className="btn btn-secondary" onClick={() => setView("account")}>
            <User className="icon" /> Account
          </button>
          <button className="btn btn-logout" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </header>

      <section className="panel">
        <h2>Active Organization</h2>

        <select
          className="input"
          value={activeOrg?.id || ""}
          onChange={async (e) => {
            const org = organizations.find((o) => o.id == e.target.value);
            setActiveOrg(org);

            try {
              await fetch(`/api/organizations/set-active/${org.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sponsor_username: profile.name }),
              });
            } catch {}

            loadApplications(org.id);
            loadOrgCatalog(org.id);
            loadDriverPoints(org.id);
            loadDrivers(org.id);
          }}
        >
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </section>

      <section className="panel">
        <h2>Drivers & Points</h2>

        {drivers.length === 0 ? (
          <p className="muted">No drivers linked to this organization.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Driver Username</th>
                <th>Current Points</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.driver_username}>
                  <td>{driver.driver_username}</td>
                  <td>{driverPoints[driver.driver_username] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <style>{css}</style>
    </div>
  );
}

// -------- STYLE --------
const css = `
.sponsor-view { padding: 20px; max-width: 1400px; margin: auto; }
.sv-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.panel { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.input { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px; }
.label { display: block; font-weight: 600; margin-bottom: 6px; color: #333; }

.btn { padding: 10px 14px; border-radius: 8px; cursor: pointer; border: none; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
.btn:hover { transform: translateY(-1px); }
.btn-secondary { background: #1976d2; color: white; }
.btn-primary { background: #1565c0; color: white; }
.btn-danger { background: #c62828; color: white; }
.btn-logout { background: #d32f2f; color: white; }
.btn-sm { padding: 6px 12px; font-size: 14px; }

.icon { width: 18px; height: 18px; }

.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
.table th { background: #f5f5f5; font-weight: 600; }

.catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 16px; }
.catalog-card { border: 1px solid #ccc; padding: 10px; border-radius: 8px; }
.catalog-card img { width: 100%; height: 150px; object-fit: cover; border-radius: 6px; margin-bottom: 8px; }
.catalog-card h3 { font-size: 14px; margin: 8px 0; }

.org-badge { background: #e3f2fd; padding: 6px 10px; border-radius: 8px; font-size: 14px; }
.muted { color: #777; }

.account-section { margin-bottom: 20px; }
.help-text { font-size: 12px; color: #666; margin-top: 4px; }

.message { padding: 12px 16px; border-radius: 8px; margin-top: 16px; font-weight: 600; }
.message.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.message.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

.search-bar { display: flex; gap: 10px; }
.search-bar .input { flex: 1; }
`;