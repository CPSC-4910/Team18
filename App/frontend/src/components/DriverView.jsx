// App/frontend/src/components/DriverView.jsx (FINAL CLEAN VERSION)
import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";

export default function DriverView({ user, onLogout }) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [apps, setApps] = useState([]);
  const [memberships, setMemberships] = useState([]);

  useEffect(() => {
    loadOrganizations();
    loadMyApplications();
    loadMyMemberships();
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
      const res = await fetch(`/api/applications/my/${user.username}`);
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
        setSubmitMessage(data.error || "Server error.");
      }
    } catch (err) {
      console.error("Error submitting app:", err);
      setSubmitMessage("Server error.");
    }
  }

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div className="driver-view">
      <header className="dv-header">
        <h1>Driver Dashboard — {user.username}</h1>
        <button className="btn btn-logout" onClick={onLogout}>
          Log Out
        </button>
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
      {/* My Applications */}
      {/* -------------------------------------------------- */}
      <section className="panel">
        <h2>My Applications</h2>
        {apps.length === 0 ? (
          <p className="muted">No applications yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Status</th>
                <th>Applied At</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.id}>
                  <td>{app.organization_name}</td>
                  <td>{app.status}</td>
                  <td>{new Date(app.applied_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* -------------------------------------------------- */}
      {/* My Memberships */}
      {/* -------------------------------------------------- */}
      <section className="panel">
        <h2>Joined Organizations</h2>
        {memberships.length === 0 ? (
          <p className="muted">Not a member of any organizations yet.</p>
        ) : (
          <ul>
            {memberships.map((m) => (
              <li key={m.organization_id}>
                {m.organization_name} (joined:{" "}
                {new Date(m.joined_at).toLocaleDateString()})
              </li>
            ))}
          </ul>
        )}
      </section>

      <style>{css}</style>
    </div>
  );
}

const css = `
.driver-view { padding: 20px; max-width: 1000px; margin: auto; }
.dv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }

.panel { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }

h2 { margin-top: 0; }

.input { width: 100%; padding: 10px; margin-bottom: 10px; }

.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 10px; border-bottom: 1px solid #ddd; }

.btn { padding: 10px 16px; cursor: pointer; border-radius: 8px; }
.btn-primary { background: #1976d2; color: white; }
.btn-logout { background: #d9534f; color: white; }

.message { margin-top: 10px; color: green; }
.muted { color: #777; }
`;
