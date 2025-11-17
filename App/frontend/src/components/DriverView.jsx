// App/frontend/src/components/DriverView.jsx

import React, { useEffect, useState } from "react";
import { Users, User, Lock, Archive } from "lucide-react";

export default function DriverView({ user, onLogout }) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [apps, setApps] = useState([]);
  const [memberships, setMemberships] = useState([]);
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
  // Load My Accepted Memberships
  // ------------------------------------------------------------
  async function loadMyMemberships() {
    try {
      const res = await fetch(`/api/memberships/${user.username}`);
      const data = await res.json();
      setMemberships(data || []);
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

  // Account view (unchanged except for keeping the same styling/structure)
  if (view === "account") {
    return (
      <div className="driver-view">
        <header className="dv-header">
          <h1>Account Management</h1>
          <div className="header-actions">
            {/* Application History button (to the left of Account) */}
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

  // Application History view - new tab (left of Account)
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

  // -------- DASHBOARD (no Applications section here anymore) --------
  return (
    <div className="driver-view">
      <header className="dv-header">
        <h1>Driver Dashboard — {user.username}</h1>
        <div className="header-actions">
          {/* Application History button left of Account as requested */}
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

      {/* -------------------------------------------------- */}
      {/* Apply to an Organization */}
      {/* -------------------------------------------------- */}
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

      {/* -------------------------------------------------- */}
      {/* My Memberships */}
      {/* -------------------------------------------------- */}
      <section className="panel">
        <h2>Joined Organizations</h2>
        {memberships.length === 0 ? (
          <p className="muted">Not a member of any organizations yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Organization Name</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((m) => (
                <tr key={m.organization_id}>
                  <td>{m.organization_name}</td>
                  <td>{new Date(m.joined_at).toLocaleDateString()}</td>
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
.btn-primary { background: #1976d2; color: white; }
.btn-secondary { background: #1565c0; color: white; }
.btn-logout { background: #d9534f; color: white; }

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
`;
