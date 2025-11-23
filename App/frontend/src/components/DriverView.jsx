// App/frontend/src/components/DriverView.jsx

import React, { useEffect, useState } from "react";
import { Users, User, Lock, Archive, ShoppingCart, Package, Award, Menu, X, LogOut, Activity, TrendingUp, CheckCircle, XCircle, AlertCircle, Bell } from "lucide-react";

// Stats Card Component
const StatsCard = ({ icon: Icon, title, value, color = "#3b82f6" }) => (
  <div className="stats-card">
    <div className="stats-icon" style={{ background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`, color }}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="stats-content">
      <p className="stats-title">{title}</p>
      <h3 className="stats-value">{value}</h3>
    </div>
  </div>
);

export default function DriverView({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // Alerts
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  
  // Point Alerts
  const [pointAlerts, setPointAlerts] = useState([]);
  const [loadingPointAlerts, setLoadingPointAlerts] = useState(false);
  const [pointAlertsEnabled, setPointAlertsEnabled] = useState(true);

  useEffect(() => {
    loadOrganizations();
    loadMyApplications();
    loadMyMemberships();
    loadAlerts();
    loadPointAlerts();
    loadPointAlertsPreference();
    setEditEmail(user.email || "");
  }, [user?.username]);

  // Reload alerts when view changes to dashboard
  useEffect(() => {
    if (view === "dashboard") {
      loadAlerts();
      loadPointAlerts();
    }
  }, [view]);

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

    // Check if driver is already a member
    const isMember = memberships.some(m => m.organization_id === parseInt(selectedOrg));
    if (isMember) {
      setSubmitMessage("You are already a member of this organization. You cannot re-apply.");
      return;
    }

    // Check if there's a pending application
    const hasPendingApp = apps.some(app => 
      app.organization_id === parseInt(selectedOrg) && app.status === "pending"
    );
    if (hasPendingApp) {
      setSubmitMessage("You already have a pending application for this organization. Please wait for a response.");
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
        setSelectedOrg("");
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
  // Load Alerts
  // ------------------------------------------------------------
  async function loadAlerts() {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`/api/driver/alerts/${user.username}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data || []);
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoadingAlerts(false);
    }
  }

  // Mark alert as read
  async function markAlertAsRead(alertId) {
    try {
      const res = await fetch(`/api/driver/alerts/${alertId}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        // Update local state
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        ));
      }
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  }

  // Mark all alerts as read
  async function markAllAlertsAsRead() {
    try {
      const res = await fetch(`/api/driver/alerts/${user.username}/read-all`, {
        method: "PATCH",
      });
      if (res.ok) {
        setAlerts(prev => prev.map(alert => ({ ...alert, is_read: true })));
      }
    } catch (err) {
      console.error("Failed to mark all alerts as read:", err);
    }
  }

  // ------------------------------------------------------------
  // Load Point Alerts
  // ------------------------------------------------------------
  async function loadPointAlerts() {
    setLoadingPointAlerts(true);
    try {
      const res = await fetch(`/api/driver/point-alerts/${user.username}`);
      if (res.ok) {
        const data = await res.json();
        setPointAlerts(data || []);
      }
    } catch (err) {
      console.error("Failed to load point alerts:", err);
    } finally {
      setLoadingPointAlerts(false);
    }
  }

  // Load point alerts preference
  async function loadPointAlertsPreference() {
    try {
      const res = await fetch(`/api/driver/point-alerts-preference/${user.username}`);
      if (res.ok) {
        const data = await res.json();
        setPointAlertsEnabled(data.point_alerts_enabled ?? true);
      }
    } catch (err) {
      console.error("Failed to load point alerts preference:", err);
    }
  }

  // Mark point alert as read
  async function markPointAlertAsRead(alertId) {
    try {
      const res = await fetch(`/api/driver/point-alerts/${alertId}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        setPointAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        ));
      }
    } catch (err) {
      console.error("Failed to mark point alert as read:", err);
    }
  }

  // Toggle point alerts preference
  async function togglePointAlertsPreference() {
    const newValue = !pointAlertsEnabled;
    try {
      const res = await fetch(`/api/driver/point-alerts-preference/${user.username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ point_alerts_enabled: newValue }),
      });
      if (res.ok) {
        setPointAlertsEnabled(newValue);
      } else {
        alert("Failed to update preference");
      }
    } catch (err) {
      console.error("Failed to update point alerts preference:", err);
      alert("Server error");
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

  // Calculate stats
  const totalOrganizations = memberships.length;
  const totalPoints = Object.values(membershipPoints).reduce((sum, pts) => sum + (pts || 0), 0);
  const pendingApps = apps.filter(app => app.status === "pending").length;
  const acceptedApps = apps.filter(app => app.status === "accepted").length;

  // Main render with sidebar
  return (
    <div className="driver-dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          {sidebarOpen && <h1>Driver Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {[
            { id: "dashboard", label: "Dashboard", icon: Activity },
            { id: "history", label: "Applications", icon: Archive },
            { id: "catalog", label: "Catalog", icon: ShoppingCart },
            { id: "account", label: "Account", icon: User },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                if (item.id === "catalog" && memberships.length > 0 && !catalogOrg) {
                  // Auto-select first organization if viewing catalog and none selected
                  const firstMembership = memberships[0];
                  viewCatalog(firstMembership.organization_id, firstMembership.organization_name);
                }
              }}
              className={`nav-item ${view === item.id ? "active" : ""}`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">
              {view === "dashboard" ? "Dashboard" : 
               view === "history" ? "Application History" :
               view === "catalog" ? `${catalogOrg?.name || "Catalog"}` :
               view === "account" ? "Account" : "Dashboard"}
            </h1>
            <p className="page-subtitle">
              Welcome back, {user?.username || "Driver"}
              {catalogOrg && view === "catalog" && (
                <span className="org-badge"> • {membershipPoints[catalogOrg?.id] || 0} points</span>
              )}
            </p>
          </div>
          <div className="header-actions">
            <div className="user-avatar large">
              {user?.username?.charAt(0).toUpperCase() || "D"}
            </div>
          </div>
        </header>

        <div className="content-area">
          {view === "dashboard" && (
            <>
              {/* Alerts Section - Always visible and cannot be disabled */}
              {alerts.filter(a => !a.is_read).length > 0 && (
                <div className="panel" style={{ 
                  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  border: "2px solid #f59e0b",
                  marginBottom: "24px"
                }}>
                  <div className="panel-header" style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Bell className="w-5 h-5" style={{ color: "#d97706" }} />
                      <h2 style={{ color: "#92400e", margin: 0 }}>Important Alerts</h2>
                      <span style={{ 
                        background: "#dc2626", 
                        color: "white", 
                        padding: "2px 8px", 
                        borderRadius: "12px", 
                        fontSize: "12px",
                        fontWeight: 600,
                        marginLeft: "8px"
                      }}>
                        {alerts.filter(a => !a.is_read).length}
                      </span>
                    </div>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={markAllAlertsAsRead}
                      style={{ fontSize: "12px" }}
                    >
                      Mark All as Read
                    </button>
                  </div>
                  <div className="alerts-list">
                    {alerts.filter(a => !a.is_read).map((alert) => (
                      <div 
                        key={alert.id} 
                        className="alert-item"
                        style={{
                          background: "white",
                          padding: "16px",
                          borderRadius: "8px",
                          marginBottom: "12px",
                          border: "1px solid #fbbf24",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                              <AlertCircle className="w-5 h-5" style={{ color: "#d97706", flexShrink: 0 }} />
                              <h3 style={{ margin: 0, color: "#92400e", fontSize: "16px", fontWeight: 600 }}>
                                Removed from {alert.organization_name}
                              </h3>
                            </div>
                            <p style={{ margin: 0, color: "#78350f", fontSize: "14px", lineHeight: "1.5", marginLeft: "28px" }}>
                              {alert.message}
                            </p>
                            <p style={{ margin: "8px 0 0 28px", color: "#a16207", fontSize: "12px" }}>
                              {new Date(alert.created_at).toLocaleString()}
                            </p>
                          </div>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => markAlertAsRead(alert.id)}
                            style={{ marginLeft: "12px", flexShrink: 0 }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Point Alerts Section - Only shown if enabled */}
              {pointAlertsEnabled && pointAlerts.filter(a => !a.is_read).length > 0 && (
                <div className="panel" style={{ 
                  background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                  border: "2px solid #3b82f6",
                  marginBottom: "24px"
                }}>
                  <div className="panel-header" style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Award className="w-5 h-5" style={{ color: "#2563eb" }} />
                      <h2 style={{ color: "#1e40af", margin: 0 }}>Point Changes</h2>
                      <span style={{ 
                        background: "#2563eb", 
                        color: "white", 
                        padding: "2px 8px", 
                        borderRadius: "12px", 
                        fontSize: "12px",
                        fontWeight: 600,
                        marginLeft: "8px"
                      }}>
                        {pointAlerts.filter(a => !a.is_read).length}
                      </span>
                    </div>
                  </div>
                  <div className="alerts-list">
                    {pointAlerts.filter(a => !a.is_read).map((alert) => (
                      <div 
                        key={alert.id} 
                        className="alert-item"
                        style={{
                          background: "white",
                          padding: "16px",
                          borderRadius: "8px",
                          marginBottom: "12px",
                          border: "1px solid #60a5fa",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                              {alert.type === "award" ? (
                                <Award className="w-5 h-5" style={{ color: "#10b981", flexShrink: 0 }} />
                              ) : (
                                <TrendingUp className="w-5 h-5" style={{ color: "#dc2626", flexShrink: 0 }} />
                              )}
                              <h3 style={{ margin: 0, color: "#1e40af", fontSize: "16px", fontWeight: 600 }}>
                                {alert.type === "award" ? `+${alert.points} points` : `${alert.points} points deducted`} from {alert.organization_name}
                              </h3>
                            </div>
                            <p style={{ margin: 0, color: "#1e3a8a", fontSize: "14px", lineHeight: "1.5", marginLeft: "28px" }}>
                              <strong>Reason:</strong> {alert.reason}
                            </p>
                            {alert.sponsor_username && (
                              <p style={{ margin: "4px 0 0 28px", color: "#3b82f6", fontSize: "12px" }}>
                                By sponsor: {alert.sponsor_username}
                              </p>
                            )}
                            <p style={{ margin: "8px 0 0 28px", color: "#60a5fa", fontSize: "12px" }}>
                              {new Date(alert.created_at).toLocaleString()}
                            </p>
                          </div>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => markPointAlertAsRead(alert.id)}
                            style={{ marginLeft: "12px", flexShrink: 0 }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="stats-grid">
                <StatsCard
                  icon={Package}
                  title="My Organizations"
                  value={totalOrganizations}
                  color="#3b82f6"
                />
                <StatsCard
                  icon={Award}
                  title="Total Points"
                  value={totalPoints.toLocaleString()}
                  color="#10b981"
                />
                <StatsCard
                  icon={TrendingUp}
                  title="Pending Applications"
                  value={pendingApps}
                  color="#f59e0b"
                />
                <StatsCard
                  icon={CheckCircle}
                  title="Accepted Applications"
                  value={acceptedApps}
                  color="#10b981"
                />
              </div>

              {/* Apply to an Organization */}
              <div className="panel">
                <h2>Apply to an Organization</h2>
                <p style={{ color: "#6b7280", marginBottom: "20px" }}>Select an organization to request to join.</p>
                
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Organization</label>
                    <select
                      className="form-input"
                      value={selectedOrg}
                      onChange={(e) => setSelectedOrg(e.target.value)}
                    >
                      <option value="">-- Select Organization --</option>
                      {organizations
                        .filter((org) => {
                          // Filter out organizations the driver is already a member of
                          const isMember = memberships.some(m => m.organization_id === org.id);
                          // Filter out organizations with pending applications
                          const hasPendingApp = apps.some(app => 
                            app.organization_id === org.id && app.status === "pending"
                          );
                          return !isMember && !hasPendingApp;
                        })
                        .map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                    </select>
                    {organizations.filter((org) => {
                      const isMember = memberships.some(m => m.organization_id === org.id);
                      const hasPendingApp = apps.some(app => 
                        app.organization_id === org.id && app.status === "pending"
                      );
                      return isMember || hasPendingApp;
                    }).length > 0 && (
                      <p className="form-help" style={{ marginTop: "8px", color: "#6b7280", fontSize: "13px" }}>
                        Some organizations are hidden because you're already a member or have a pending application.
                      </p>
                    )}
                  </div>
                  <button className="btn btn-primary" onClick={submitApplication} disabled={!selectedOrg}>
                    Submit Application
                  </button>
                </div>

                {submitMessage && (
                  <div className={`alert ${submitMessage.includes("successfully") ? "alert-success" : "alert-error"}`} style={{ marginTop: "16px" }}>
                    {submitMessage.includes("successfully") ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    <p>{submitMessage}</p>
                  </div>
                )}
              </div>

              {/* My Memberships */}
              <div className="panel">
                <div className="panel-header">
                  <h2>My Organizations</h2>
                </div>
                {memberships.length === 0 ? (
                  <div className="empty-state">
                    <Package className="w-12 h-12" />
                    <p>Not a member of any organizations yet.</p>
                  </div>
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
                            <Award className="w-5 h-5" />
                            <span className="points-value">
                              {membershipPoints[m.organization_id] || 0} points
                            </span>
                          </div>
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setView("catalog");
                            viewCatalog(m.organization_id, m.organization_name);
                          }}
                        >
                          <ShoppingCart className="w-4 h-4" /> View Catalog
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {view === "history" && (
            <div className="panel">
              <div className="panel-header">
                <h2>Application History</h2>
              </div>
              {apps.length === 0 ? (
                <div className="empty-state">
                  <Archive className="w-12 h-12" />
                  <p>No applications or removals yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Organization</th>
                        <th>Status</th>
                        <th>Removed By</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apps.map((app) => (
                        <tr key={app.id}>
                          <td>
                            <strong>{app.organization_name || `Organization ${app.organization_id}`}</strong>
                          </td>
                          <td>
                            <span className={`badge ${
                              app.status === "pending" ? "pending" : 
                              app.status === "accepted" || app.status === "approved" ? "accepted" : 
                              app.status === "removed" ? "removed" : 
                              "denied"
                            }`}>
                              {app.status === "approved" ? "accepted" : app.status}
                            </span>
                          </td>
                          <td>
                            {app.type === "removal" && app.removed_by_username ? (
                              <span style={{ color: "#6b7280", fontSize: "14px" }}>
                                {app.removed_by_role === "admin" ? "Admin" : "Sponsor"}: <strong>{app.removed_by_username}</strong>
                              </span>
                            ) : (
                              <span style={{ color: "#9ca3af" }}>—</span>
                            )}
                          </td>
                          <td>{new Date(app.applied_at || app.date).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {view === "catalog" && (
            <div className="panel">
              <div className="panel-header">
                <h2>
                  <Package className="w-5 h-5" style={{ display: "inline", marginRight: "8px" }} />
                  Available Items
                </h2>
                {catalogOrg && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ color: "#6b7280", fontSize: "14px" }}>Your Points:</span>
                    <span className="points-badge">{membershipPoints[catalogOrg?.id] || 0}</span>
                  </div>
                )}
              </div>

              {loadingCatalog ? (
                <div className="loading-state">
                  <Activity className="w-8 h-8 animate-spin" />
                  <p>Loading catalog...</p>
                </div>
              ) : catalog.length === 0 ? (
                <div className="empty-state">
                  <Package className="w-12 h-12" />
                  <p>No items available in this catalog yet.</p>
                </div>
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
            </div>
          )}

          {view === "account" && (
            <>
              <div className="panel">
                <h2><User className="w-5 h-5" style={{ display: "inline", marginRight: "8px" }} /> Personal Information</h2>
                
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-input"
                    value={user.username}
                    disabled
                    style={{ background: "#f5f5f5", cursor: "not-allowed" }}
                  />
                  <p className="form-help">Username cannot be changed</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <input
                      type="email"
                      className="form-input"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      disabled={updatingAccount}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={updateEmail}
                      disabled={updatingAccount}
                    >
                      {updatingAccount ? "Updating..." : "Update Email"}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input
                    type="text"
                    className="form-input"
                    value={user.role}
                    disabled
                    style={{ background: "#f5f5f5", cursor: "not-allowed" }}
                  />
                </div>

                <div className="info-box">
                  <Lock className="w-5 h-5" style={{ color: "#3b82f6" }} />
                  <div>
                    <strong>Need to change your password?</strong>
                    <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#6b7280" }}>
                      Use the "Forgot password?" link on the login page to reset your password securely via email.
                    </p>
                  </div>
                </div>
              </div>

              {accountMessage && (
                <div className={`alert ${accountMessage.includes("✓") ? "alert-success" : "alert-error"}`}>
                  {accountMessage.includes("✓") ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  <p>{accountMessage}</p>
                </div>
              )}

              <div className="panel">
                <h2><Bell className="w-5 h-5" style={{ display: "inline", marginRight: "8px" }} /> Notification Preferences</h2>
                
                <div className="form-group">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
                    <div>
                      <label className="form-label" style={{ marginBottom: "4px" }}>Point Change Alerts</label>
                      <p className="form-help" style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                        Receive notifications when points are added or deducted from your account
                      </p>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={pointAlertsEnabled}
                        onChange={togglePointAlertsPreference}
                        style={{ width: "20px", height: "20px", cursor: "pointer", marginRight: "8px" }}
                      />
                      <span style={{ fontWeight: 600, color: pointAlertsEnabled ? "#10b981" : "#6b7280" }}>
                        {pointAlertsEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <style>{css}</style>
    </div>
  );
}

const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }

.driver-dashboard {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* ===== SIDEBAR ===== */
.sidebar {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: white;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1);
}

.sidebar.open { width: 260px; }
.sidebar.closed { width: 80px; }

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar h1 {
  font-size: 20px;
  font-weight: 700;
}

.sidebar-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.2);
  color: white;
  border-left: 3px solid #3b82f6;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.2);
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}

/* ===== MAIN CONTENT ===== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.page-header {
  background: white;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.page-subtitle {
  color: #6b7280;
  font-size: 14px;
}

.org-badge {
  color: #3b82f6;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.user-avatar.large {
  width: 48px;
  height: 48px;
  font-size: 18px;
}

.content-area {
  padding: 32px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

/* ===== STATS GRID ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stats-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
}

.stats-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stats-content {
  flex: 1;
}

.stats-title {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 4px;
}

.stats-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

/* ===== PANEL ===== */
.panel {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
}

.panel h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.panel-header h2 {
  margin: 0;
}

/* ===== FORMS ===== */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.form-help {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

/* ===== BUTTONS ===== */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
}

.btn-full {
  width: 100%;
  justify-content: center;
}

/* ===== TABLES ===== */
.table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.data-table thead {
  background: #f9fafb;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e5e7eb;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* ===== ALERTS ===== */
.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

/* ===== BADGES ===== */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
}

.badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.badge.accepted {
  background: #dcfce7;
  color: #166534;
}

.badge.denied {
  background: #fee2e2;
  color: #991b1b;
}

.badge.removed {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.points-badge {
  display: inline-block;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

/* ===== EMPTY STATE ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #6b7280;
  text-align: center;
}

.empty-state svg {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  font-weight: 500;
}

/* ===== LOADING STATE ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #6b7280;
}

.loading-state svg {
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* ===== MEMBERSHIP CARDS ===== */
.membership-list {
  display: grid;
  gap: 16px;
}

.membership-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  transition: all 0.2s;
}

.membership-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #3b82f6;
}

.membership-info h3 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
}

.membership-date {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 12px 0;
}

.membership-points {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #10b981;
}

.points-value {
  font-size: 18px;
  font-weight: 700;
}

/* ===== CATALOG ===== */
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.catalog-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.catalog-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.catalog-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
}

.catalog-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #1f2937;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 44px;
}

.catalog-details {
  margin-bottom: 12px;
}

.catalog-price {
  font-size: 18px;
  font-weight: 700;
  color: #3b82f6;
  margin: 0 0 4px 0;
}

.catalog-points {
  font-size: 16px;
  font-weight: 600;
  color: #10b981;
  margin: 0;
}

.catalog-link {
  display: block;
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
}

.catalog-link:hover {
  text-decoration: underline;
}

/* ===== INFO BOX ===== */
.info-box {
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: start;
  margin-top: 24px;
}

.info-box strong {
  display: block;
  color: #1e40af;
  margin-bottom: 4px;
}

.info-box p {
  margin: 0;
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
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
`;