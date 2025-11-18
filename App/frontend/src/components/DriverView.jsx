// App/frontend/src/components/DriverView.jsx

import React, { useEffect, useState } from "react";
import { Users, User, Lock, Archive, ShoppingCart, Package, Award } from "lucide-react";

export default function DriverView({ user, onLogout }) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [apps, setApps] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [membershipPoints, setMembershipPoints] = useState({});
  const [catalogOrg, setCatalogOrg] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [view, setView] = useState("dashboard");

  // Account Management
  const [editEmail, setEditEmail] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [updatingAccount, setUpdatingAccount] = useState(false);

  useEffect(() => {
    loadOrganizations();
    loadMyApplications();
    loadMyMemberships();
    setEditEmail(user.email || "");
  }, [user?.username]);

  // ------------------------------------------------------------
  // Load All Organizations
  // ------------------------------------------------------------
  async function loadOrganizations() {
    try {
      const res = await fetch("/api/organizations/all");
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrganizations(data);
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
    }
  }

  // ------------------------------------------------------------
  // Load My Applications
  // ------------------------------------------------------------
  async function loadMyApplications() {
    try {
      const res = await fetch(`/api/applications/by-driver/${user.username}`);
      const data = await res.json();
      setApps(data || []);
    } catch (err) {
      console.error("Failed to load apps:", err);
    }
  }

  // ------------------------------------------------------------
  // Load My Accepted Memberships + Points
  // ------------------------------------------------------------
  async function loadMyMemberships() {
    try {
      const res = await fetch(`/api/memberships/${user.username}`);
      const data = await res.json();
      setMemberships(data || []);
      
      // Load points for each membership
      const pointsMap = {};
      for (const membership of data) {
        try {
          const pointsRes = await fetch(`/api/points/balances/${membership.organization_id}`);
          const pointsData = await pointsRes.json();
          const driverBalance = pointsData.find(b => b.driver_username === user.username);
          pointsMap[membership.organization_id] = driverBalance ? driverBalance.balance : 0;
        } catch (err) {
          console.error(`Failed to load points for org ${membership.organization_id}:`, err);
          pointsMap[membership.organization_id] = 0;
        }
      }
      setMembershipPoints(pointsMap);
    } catch (err) {
      console.error("Failed to load memberships:", err);
    }
  }

  // ------------------------------------------------------------
  // Submit Organization Application
  // ------------------------------------------------------------
  async function submitApplication() {
    if (!selectedOrg) {
      setSubmitMessage("Please select an organization.");
      return;
    }
    setSubmitMessage("");

    try {
      const res = await fetch("/api/applications/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_username: user.username,
          organization_id: selectedOrg,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitMessage("Application submitted successfully.");
        loadMyApplications();
      } else {
        setSubmitMessage(data.msg || data.error || "Server error.");
      }
    } catch (err) {
      console.error("Error submitting app:", err);
      setSubmitMessage("Server error.");
    }
  }

  // ------------------------------------------------------------
  // Load Organization Catalog
  // ------------------------------------------------------------
  async function viewCatalog(orgId, orgName) {
    setCatalogOrg({ id: orgId, name: orgName });
    setLoadingCatalog(true);
    setView("catalog");
    
    try {
      const res = await fetch(`/api/organizations/catalog/${orgId}`);
      const data = await res.json();
      setCatalog(data || []);
    } catch (err) {
      console.error("Failed to load catalog:", err);
      setCatalog([]);
    } finally {
      setLoadingCatalog(false);
    }
  }

  // ------------------------------------------------------------
  // Redeem Item
  // ------------------------------------------------------------
  async function redeemItem(item) {
    const points = membershipPoints[catalogOrg.id] || 0;
    
    if (points < item.points_cost) {
      alert(`Insufficient points. You need ${item.points_cost} points but only have ${points}.`);
      return;
    }

    if (!confirm(`Redeem ${item.title} for ${item.points_cost} points?`)) {
      return;
    }

    try {
      const res = await fetch("/api/points/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_username: user.username,
          itemId: item.id,
          organization_id: catalogOrg.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✓ ${data.message || "Item redeemed successfully!"}`);
        // Reload points
        loadMyMemberships();
      } else {
        alert(`✗ ${data.error || "Failed to redeem item"}`);
      }
    } catch (err) {
      console.error("Redeem error:", err);
      alert("✗ Server error");
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

  // ------------------------------------------------------------
  // VIEWS
  // ------------------------------------------------------------

  // Catalog View
  if (view === "catalog") {
    return (
      <div className="driver-view">
        <header className="dv-header">
          <div>
            <h1>{catalogOrg?.name} - Catalog</h1>
            <p className="org-points">
              Your Points: <span className="points-badge">{membershipPoints[catalogOrg?.id] || 0}</span>
            </p>
          </div>
          <div className="header-actions">
            <button className="btn" onClick={() => setView("dashboard")}>
              ← Back to Dashboard
            </button>
            <button className="btn btn-logout" onClick={onLogout}>
              Log Out
            </button>
          </div>
        </header>

        <section className="panel">
          <h2>
            <Package className="icon" /> Available Items
          </h2>

          {loadingCatalog ? (
            <p className="muted">Loading catalog...</p>
          ) : catalog.length === 0 ? (
            <p className="muted">No items available in this catalog yet.</p>
          ) : (
            <div className="catalog-grid">
              {catalog.map((item) => (
                <div key={item.id} className="catalog-card">
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="catalog-img"
                  />
                  <h3 className="catalog-title">{item.title}</h3>
                  <div className="catalog-details">
                    <p className="catalog-price">${item.price} {item.currency}</p>
                    <p className="catalog-points">{item.points_cost} points</p>
                  </div>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => redeemItem(item)}
                    disabled={membershipPoints[catalogOrg?.id] < item.points_cost}
                  >
                    {membershipPoints[catalogOrg?.id] < item.points_cost ? "Insufficient Points" : "Redeem"}
                  </button>
                  {item.item_url && (
                    <a 
                      href={item.item_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="catalog-link"
                    >
                      View on eBay →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <style>{css}</style>
      </div>
    );
  }

  // Account view
  if (view === "account") {
    return (
      <div className="driver-view">
        <header className="dv-header">
          <h1>Account Management</h1>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setView("history")}
              title="Application History"
            >
              <Archive className="icon" /> Application History
            </button>

            <button className="btn" onClick={() => setView("dashboard")}>
              ← Back to Dashboard
            </button>

            <button className="btn btn-logout" onClick={onLogout}>
              Log Out
            </button>
          </div>
        </header>

        <section className="panel">
          <h2>
            <User className="icon" /> Personal Information
          </h2>

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

          <div className="info-box">
            <Lock className="icon" style={{ color: "#1976d2" }} />
            <div>
              <strong>Need to change your password?</strong>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#666" }}>
                Use the "Forgot password?" link on the login page to reset your
                password securely via email.
              </p>
            </div>
          </div>
        </section>

        {accountMessage && (
          <div
            className={`message ${
              accountMessage.includes("✓") ? "success" : "error"
            }`}
          >
            {accountMessage}
          </div>
        )}

        <style>{css}</style>
      </div>
    );
  }

  // Application History view
  if (view === "history") {
    return (
      <div className="driver-view">
        <header className="dv-header">
          <h1>Application History — {user.username}</h1>
          <div className="header-actions">
            <button
              className="btn"
              onClick={() => setView("dashboard")}
              title="Back to Dashboard"
            >
              ← Dashboard
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => setView("account")}
              title="Account Management"
            >
              <User className="icon" /> Account
            </button>

            <button className="btn btn-logout" onClick={onLogout}>
              Log Out
            </button>
          </div>
        </header>

        <section className="panel">
          <h2>
            <Archive className="icon" /> My Applications
          </h2>

          {apps.length === 0 ? (
            <p className="muted">No applications yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Organization ID</th>
                  <th>Status</th>
                  <th>Applied At</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id}>
                    <td>{app.organization_id}</td>
                    <td>
                      <span className={`status-badge ${app.status}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>{new Date(app.applied_at).toLocaleString()}</td>
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

  // Dashboard View
  return (
    <div className="driver-view">
      <header className="dv-header">
        <h1>Driver Dashboard — {user.username}</h1>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setView("history")}
            title="Application History"
          >
            <Archive className="icon" /> Application History
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setView("account")}
            title="Account Management"
          >
            <User className="icon" /> Account
          </button>

          <button className="btn btn-logout" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </header>

      {/* Apply to an Organization */}
      <section className="panel">
        <h2>Apply to an Organization</h2>
        <p>Select an organization to request to join.</p>

        <select
          className="input"
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
        >
          <option value="">-- Select Organization --</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        <button className="btn btn-primary" onClick={submitApplication}>
          Submit Application
        </button>

        {submitMessage && <p className="message">{submitMessage}</p>}
      </section>

      {/* My Memberships with Points and Catalog Access */}
      <section className="panel">
        <h2>My Organizations</h2>
        {memberships.length === 0 ? (
          <p className="muted">Not a member of any organizations yet.</p>
        ) : (
          <div className="membership-list">
            {memberships.map((m) => (
              <div key={m.organization_id} className="membership-card">
                <div className="membership-info">
                  <h3>{m.organization_name}</h3>
                  <p className="membership-date">
                    Joined: {new Date(m.joined_at).toLocaleDateString()}
                  </p>
                  <div className="membership-points">
                    <Award className="icon" />
                    <span className="points-value">
                      {membershipPoints[m.organization_id] || 0} points
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => viewCatalog(m.organization_id, m.organization_name)}
                >
                  <ShoppingCart className="icon" /> View Catalog
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{css}</style>
    </div>
  );
}

const css = `
.driver-view { padding: 20px; max-width: 1000px; margin: auto; }
.dv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.header-actions { display: flex; gap: 8px; }

.panel { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

h2 { margin-top: 0; display: flex; align-items: center; gap: 8px; }

.input { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px; }
.label { display: block; font-weight: 600; margin-bottom: 6px; color: #333; }

.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
.table th { background: #f5f5f5; font-weight: 600; }

.btn { padding: 10px 16px; cursor: pointer; border-radius: 8px; border: none; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
.btn:hover { transform: translateY(-1px); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.btn-primary { background: #1976d2; color: white; }
.btn-secondary { background: #1565c0; color: white; }
.btn-logout { background: #d9534f; color: white; }
.btn-sm { padding: 6px 12px; font-size: 14px; }
.btn-full { width: 100%; justify-content: center; }

.icon { width: 18px; height: 18px; }

.message { margin-top: 10px; padding: 10px; border-radius: 6px; }
.muted { color: #777; }

.status-badge { 
  padding: 4px 12px; 
  border-radius: 12px; 
  font-size: 12px; 
  font-weight: 600;
  text-transform: uppercase;
}
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.accepted { background: #d4edda; color: #155724; }
.status-badge.denied { background: #f8d7da; color: #721c24; }

.account-section { margin-bottom: 20px; }
.help-text { font-size: 12px; color: #666; margin-top: 4px; }

.message.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; padding: 12px; border-radius: 6px; font-weight: 600; }
.message.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; padding: 12px; border-radius: 6px; font-weight: 600; }

.info-box {
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: start;
  margin-top: 20px;
}
.info-box .icon { width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; }
.info-box strong { display: block; color: #1565c0; }

/* Membership Cards */
.membership-list {
  display: grid;
  gap: 16px;
}

.membership-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
  transition: all 0.2s;
}

.membership-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.membership-info h3 {
  margin: 0 0 8px 0;
  color: #1976d2;
  font-size: 18px;
}

.membership-date {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
}

.membership-points {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2e7d32;
}

.points-value {
  font-size: 16px;
}

.org-points {
  margin: 8px 0 0 0;
  font-size: 16px;
  color: #666;
}

.points-badge {
  display: inline-block;
  background: #2e7d32;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 18px;
}

/* Catalog Grid */
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.catalog-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: white;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.catalog-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-4px);
}

.catalog-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 12px;
}

.catalog-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #333;
  line-height: 1.4;
  min-height: 44px;
}

.catalog-details {
  margin-bottom: 12px;
}

.catalog-price {
  font-size: 18px;
  font-weight: 700;
  color: #1976d2;
  margin: 0 0 4px 0;
}

.catalog-points {
  font-size: 16px;
  font-weight: 600;
  color: #2e7d32;
  margin: 0;
}

.catalog-link {
  display: block;
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #1976d2;
  text-decoration: none;
  font-weight: 600;
}

.catalog-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .membership-card {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .membership-info {
    text-align: center;
  }
  
  .catalog-grid {
    grid-template-columns: 1fr;
  }
  
  .dv-header {
    flex-direction: column;
    align-items: stretch;
  }
}
`;