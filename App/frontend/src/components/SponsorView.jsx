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
  Menu,
  X,
  LogOut,
  Activity,
  ShoppingCart,
  Trash2,
  FileText,
  Download,
  UserPlus,
  Edit,
  Shield,
} from "lucide-react";

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

export default function SponsorView({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Organization state
  const [allOrganizations, setAllOrganizations] = useState([]); // All available organizations
  const [joinedOrganizations, setJoinedOrganizations] = useState([]); // Organizations sponsor has joined
  const [activeOrg, setActiveOrg] = useState(null);
  const [selectedOrgToJoin, setSelectedOrgToJoin] = useState("");

  // Applications
  const [applications, setApplications] = useState([]);

  // Catalog
  const [catalog, setCatalog] = useState([]);
  const [myCatalog, setMyCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("truck parts");

  // Award/Deduct Points
  const [drivers, setDrivers] = useState([]);
  const [driverPoints, setDriverPoints] = useState({});
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [pointsToAward, setPointsToAward] = useState("");
  const [pointsToDeduct, setPointsToDeduct] = useState("");
  const [pointsReason, setPointsReason] = useState("");
  const [deductReason, setDeductReason] = useState("");
  const [awardingPoints, setAwardingPoints] = useState(false);
  const [deductingPoints, setDeductingPoints] = useState(false);

  // Driver Management
  const [organizationDrivers, setOrganizationDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [newDriver, setNewDriver] = useState({ username: "", email: "", password: "" });
  const [editDriverForm, setEditDriverForm] = useState({ email: "", newPassword: "", point_alerts_enabled: true });
  const [driverFormError, setDriverFormError] = useState("");
  const [driverFormSuccess, setDriverFormSuccess] = useState("");

  // Account Management
  const [editEmail, setEditEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [updatingAccount, setUpdatingAccount] = useState(false);

  // Sponsor Management
  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);
  const [newSponsor, setNewSponsor] = useState({ username: "", email: "", password: "" });
  const [sponsorFormError, setSponsorFormError] = useState("");
  const [sponsorFormSuccess, setSponsorFormSuccess] = useState("");

  // Reports
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    driver_username: "all",
    startDate: "",
    endDate: "",
  });

  // UI view
  const [view, setView] = useState("dashboard");

  // Errors
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const me = { name: user.username };
      setProfile(me);
      setEditEmail(user.email || "");

      await loadAllOrganizations();
      await loadJoinedOrganizations(me.name);
    }
    load();
  }, [user.username]);

  // Load all available organizations
  async function loadAllOrganizations() {
    try {
      const res = await fetch("/api/organizations/all");
      if (!res.ok) {
        console.error("Failed to load all organizations");
        return;
      }
      const data = await res.json();
      setAllOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load all organizations:", err);
    }
  }

  // Load organizations the sponsor has joined
  async function loadJoinedOrganizations(sponsorUsername) {
    try {
      console.log(`Loading joined organizations for sponsor: ${sponsorUsername}`);
      const res = await fetch(`/api/organizations/by-sponsor/${sponsorUsername}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to load joined organizations - response not ok:", res.status, errorData);
        setJoinedOrganizations([]);
        return;
      }
      
      const data = await res.json();
      console.log(`Loaded ${data.length} joined organizations for sponsor ${sponsorUsername}:`, data);
      setJoinedOrganizations(data);

      const active = data.find((o) => o.is_active) || data[0];
      setActiveOrg(active);

      if (active) {
        await loadApplications(active.id);
        await loadOrgCatalog(active.id);
        await loadDriverPoints(active.id);
        await loadDrivers(active.id);
        // Also load organization drivers for the enhanced table
        await loadOrganizationDrivers();
      }
    } catch (err) {
      console.error("Failed to load joined organizations:", err);
      setJoinedOrganizations([]);
    }
  }

  // Join an organization
  async function joinOrganization(organizationId) {
    if (!organizationId || !profile) {
      setError("Please select an organization to join.");
      return;
    }

    try {
      const res = await fetch("/api/organizations/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsor_username: profile.name,
          organization_id: parseInt(organizationId),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(errorData.error || "Failed to join organization");
        return;
      }

      // Reload joined organizations
      await loadJoinedOrganizations(profile.name);
      setSelectedOrgToJoin("");
      setError("");
    } catch (err) {
      console.error("Error joining organization:", err);
      setError(`Failed to join organization: ${err.message}`);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsor_username: profile?.name || null,
          reason: "Application approved by sponsor",
        }),
      });

      if (res.ok) {
        alert("Application approved.");
        loadApplications(activeOrg.id);
        loadDrivers(activeOrg.id);
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        alert(errorData.error || "Error approving application.");
      }
    } catch (err) {
      console.error("Error approving:", err);
      alert("Error approving application.");
    }
  }

  async function denyApplication(appId) {
    try {
      const res = await fetch(`/api/applications/${appId}/deny`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsor_username: profile?.name || null,
          reason: "Application denied by sponsor",
        }),
      });

      if (res.ok) {
        alert("Application denied.");
        loadApplications(activeOrg.id);
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        alert(errorData.error || "Error denying application.");
      }
    } catch (err) {
      console.error("Error denying:", err);
      alert("Error denying application.");
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

  // Load organization drivers for the Drivers tab
  async function loadOrganizationDrivers() {
    if (!profile || !activeOrg) return;
    setLoadingDrivers(true);
    try {
      const res = await fetch(`/api/sponsor/organization-drivers/${profile.name}`);
      if (!res.ok) throw new Error("Failed to load drivers");
      const data = await res.json();
      setOrganizationDrivers(data.drivers || []);
    } catch (err) {
      console.error("Failed to load organization drivers:", err);
      setOrganizationDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  }

  // Load organization drivers when activeOrg changes (for dashboard table)
  useEffect(() => {
    if (activeOrg && profile) {
      loadOrganizationDrivers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrg, profile]);

  // Create new driver
  async function handleCreateDriver() {
    setDriverFormError("");
    setDriverFormSuccess("");
    if (!newDriver.username || !newDriver.email || !newDriver.password) {
      setDriverFormError("All fields are required.");
      return;
    }
    if (newDriver.password.length < 8) {
      setDriverFormError("Password must be at least 8 characters.");
      return;
    }
    setLoadingDrivers(true);
    try {
      const res = await fetch("/api/sponsor/create-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsor_username: profile.name,
          ...newDriver
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDriverFormSuccess(`Driver '${data.driver?.username || newDriver.username}' created!`);
        // Refresh both driver lists
        await loadOrganizationDrivers();
        if (activeOrg) {
          await loadDrivers(activeOrg.id);
          await loadDriverPoints(activeOrg.id);
        }
        setTimeout(() => {
          setShowAddDriverModal(false);
          setNewDriver({ username: "", email: "", password: "" });
        }, 1200);
      } else {
        setDriverFormError(data.error || "Failed to create driver");
      }
    } catch (err) {
      setDriverFormError("Server error");
    } finally {
      setLoadingDrivers(false);
    }
  }

  // Fetch driver details for editing
  async function fetchDriverDetails(username) {
    setLoadingDrivers(true);
    setDriverFormError("");
    setDriverFormSuccess("");
    try {
      const res = await fetch(`/api/sponsor/driver/${username}?sponsor_username=${profile.name}`);
      if (!res.ok) throw new Error("Failed to fetch driver details");
      const driverData = await res.json();
      setEditingDriver(driverData);
      setEditDriverForm({
        email: driverData.email || "",
        newPassword: "",
        point_alerts_enabled: driverData.point_alerts_enabled !== undefined ? driverData.point_alerts_enabled : true,
      });
      setShowEditDriverModal(true);
    } catch (error) {
      console.error("Error fetching driver details:", error);
      setDriverFormError("Failed to load driver details");
    } finally {
      setLoadingDrivers(false);
    }
  }

  // Create new sponsor
  async function handleCreateSponsor() {
    setSponsorFormError("");
    setSponsorFormSuccess("");
    if (!newSponsor.username || !newSponsor.email || !newSponsor.password) {
      setSponsorFormError("All fields are required.");
      return;
    }
    if (newSponsor.password.length < 8) {
      setSponsorFormError("Password must be at least 8 characters.");
      return;
    }
    setUpdatingAccount(true);
    try {
      const res = await fetch("/api/sponsor/create-sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSponsor),
      });
      const data = await res.json();
      if (res.ok) {
        setSponsorFormSuccess(`Sponsor '${data.sponsor?.username || newSponsor.username}' created successfully!`);
        setTimeout(() => {
          setShowAddSponsorModal(false);
          setNewSponsor({ username: "", email: "", password: "" });
        }, 1500);
      } else {
        setSponsorFormError(data.error || "Failed to create sponsor");
      }
    } catch (err) {
      setSponsorFormError("Server error");
    } finally {
      setUpdatingAccount(false);
    }
  }

  // Update driver
  async function handleUpdateDriver() {
    if (!editingDriver) return;
    setDriverFormError("");
    setDriverFormSuccess("");
    setLoadingDrivers(true);
    try {
      const updateData = {
        sponsor_username: profile.name,
      };
      if (editDriverForm.email && editDriverForm.email !== editingDriver.email) {
        updateData.email = editDriverForm.email;
      }
      if (editDriverForm.newPassword) {
        if (editDriverForm.newPassword.length < 8) {
          setDriverFormError("Password must be at least 8 characters");
          setLoadingDrivers(false);
          return;
        }
        updateData.newPassword = editDriverForm.newPassword;
      }
      if (editDriverForm.point_alerts_enabled !== editingDriver.point_alerts_enabled) {
        updateData.point_alerts_enabled = editDriverForm.point_alerts_enabled;
      }
      if (Object.keys(updateData).length === 1) {
        setDriverFormError("No changes to save");
        setLoadingDrivers(false);
        return;
      }
      const res = await fetch(`/api/sponsor/driver/${editingDriver.username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (res.ok) {
        setDriverFormSuccess("Driver updated successfully!");
        // Refresh both driver lists
        await loadOrganizationDrivers();
        if (activeOrg) {
          await loadDrivers(activeOrg.id);
        }
        setTimeout(() => {
          setShowEditDriverModal(false);
          setEditDriverForm({ email: "", newPassword: "", point_alerts_enabled: true });
          setEditingDriver(null);
        }, 1500);
      } else {
        setDriverFormError(data.error || "Failed to update driver");
      }
    } catch (error) {
      console.error("Error updating driver:", error);
      setDriverFormError("Server error");
    } finally {
      setLoadingDrivers(false);
    }
  }

  async function removeDriverFromOrganization(driverUsername) {
    if (!activeOrg) {
      alert("No active organization selected.");
      return;
    }

    const confirmMessage = `Are you sure you want to remove ${driverUsername} from ${activeOrg.name}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await fetch(`/api/memberships/remove-driver`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_username: driverUsername,
          organization_id: activeOrg.id,
          removed_by_username: user.username,
          removed_by_role: "sponsor",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Driver ${driverUsername} has been removed from ${activeOrg.name}.`);
        // Reload drivers and points
        loadDrivers(activeOrg.id);
        loadDriverPoints(activeOrg.id);
      } else {
        alert(data.error || "Failed to remove driver from organization.");
      }
    } catch (err) {
      console.error("Error removing driver:", err);
      alert("Server error while removing driver.");
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

  // -------- REPORTS --------
  async function loadReport() {
    if (!activeOrg) {
      alert("Please select an organization first.");
      return;
    }

    setLoadingReport(true);
    try {
      const params = new URLSearchParams({
        organization_id: activeOrg.id.toString(),
        driver_username: reportFilters.driver_username || "all",
      });

      if (reportFilters.startDate) {
        params.append("startDate", reportFilters.startDate);
      }
      if (reportFilters.endDate) {
        params.append("endDate", reportFilters.endDate);
      }

      const res = await fetch(`/api/reports/sponsor/driver-points?${params}`);
      const data = await res.json();

      if (res.ok) {
        setReportData(data || []);
      } else {
        alert(data.error || "Failed to load report");
      }
    } catch (err) {
      console.error("Failed to load report:", err);
      alert("Server error while loading report");
    } finally {
      setLoadingReport(false);
    }
  }

  function exportReportToCSV() {
    if (reportData.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Driver Name", "Total Points", "Point Change", "Date", "Sponsor", "Reason", "Type"];
    const rows = [];

    reportData.forEach((driver) => {
      if (driver.transactions.length === 0) {
        // Include drivers with no transactions
        rows.push([
          driver.driver_username,
          driver.total_points,
          "",
          "",
          "",
          "",
          "",
        ]);
      } else {
        driver.transactions.forEach((trans) => {
          rows.push([
            driver.driver_username,
            driver.total_points,
            trans.points > 0 ? `+${trans.points}` : trans.points.toString(),
            new Date(trans.date).toLocaleString(),
            trans.sponsor_username || "N/A",
            trans.reason || "",
            trans.type,
          ]);
        });
      }
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driver-points-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Load drivers when view changes to reports
  useEffect(() => {
    if (view === "reports" && activeOrg) {
      loadDrivers(activeOrg.id);
      loadReport();
    }
  }, [view, activeOrg?.id]);

  async function awardPoints() {
    if (!selectedDriver || !pointsToAward || !activeOrg) {
      alert("Missing required fields.");
      return;
    }

    if (!pointsReason || pointsReason.trim() === "") {
      alert("Reason is required for awarding points.");
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
          reason: pointsReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Points awarded! New balance: ${data.newBalance} points.`);
        loadDriverPoints(activeOrg.id);
        setPointsToAward("");
        setPointsReason("");
        setSelectedDriver("");
      } else {
        alert(data.error || "Error awarding points.");
      }
    } catch (err) {
      console.error("Award points error:", err);
      alert("Server error while awarding points.");
    } finally {
      setAwardingPoints(false);
    }
  }

  async function deductPoints() {
    if (!selectedDriver || !pointsToDeduct || !activeOrg) {
      alert("Missing required fields.");
      return;
    }

    if (!deductReason || deductReason.trim() === "") {
      alert("Reason is required for deducting points.");
      return;
    }

    const points = parseInt(pointsToDeduct);
    if (isNaN(points) || points <= 0) {
      alert("Enter a positive number.");
      return;
    }

    const currentBalance = driverPoints[selectedDriver] || 0;
    if (points > currentBalance) {
      alert(`Cannot deduct ${points} points. Driver only has ${currentBalance} points.`);
      return;
    }

    if (!confirm(`Are you sure you want to deduct ${points} points from ${selectedDriver}?`)) {
      return;
    }

    setDeductingPoints(true);

    try {
      const res = await fetch("/api/points/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_username: selectedDriver,
          sponsor_username: profile.name,
          organization_id: activeOrg.id,
          points,
          reason: deductReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Points deducted! New balance: ${data.newBalance} points.`);
        loadDriverPoints(activeOrg.id);
        setPointsToDeduct("");
        setDeductReason("");
        setSelectedDriver("");
      } else {
        alert(data.error || "Error deducting points.");
      }
    } catch (err) {
      console.error("Deduct points error:", err);
      alert("Server error while deducting points.");
    } finally {
      setDeductingPoints(false);
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
  // All views are now handled in the main return statement below

  // Calculate stats
  const totalDrivers = drivers.length;
  const totalPointsAwarded = Object.values(driverPoints).reduce((sum, pts) => sum + (pts || 0), 0);
  const pendingApplications = applications.filter(app => app.status === "pending").length;
  const catalogItems = myCatalog.length;

  // -------- DASHBOARD --------
    return (
    <div className="sponsor-dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          {sidebarOpen && <h1>Sponsor Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {[
            { id: "dashboard", label: "Dashboard", icon: Activity },
            { id: "applications", label: "Applications", icon: Users },
            { id: "catalog", label: "Catalog", icon: ShoppingCart },
            { id: "points", label: "Award Points", icon: Award },
            { id: "reports", label: "Reports", icon: FileText },
            { id: "account", label: "Account", icon: User },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
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
              {               view === "dashboard" ? "Dashboard" : 
               view === "applications" ? "Applications" :
               view === "catalog" ? "Catalog" :
               view === "points" ? "Award Points" :
               view === "reports" ? "Driver Points Report" :
               view === "account" ? "Account" : "Dashboard"}
            </h1>
            <p className="page-subtitle">
              Welcome back, {profile?.name || user?.username || "Sponsor"}
              {activeOrg && <span className="org-badge"> • {activeOrg.name}</span>}
            </p>
          </div>
          <div className="header-actions">
            <div className="user-avatar large">
              {profile?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "S"}
            </div>
          </div>
        </header>

        <div className="content-area">

          {view === "dashboard" && (
            <>
              {error && (
                <div className="alert alert-error">
                  <XCircle className="w-5 h-5" />
                  <p>{error}</p>
          </div>
              )}

              {/* Stats Cards */}
              {activeOrg && (
                <div className="stats-grid">
                  <StatsCard
                    icon={Users}
                    title="Total Drivers"
                    value={totalDrivers}
                    color="#3b82f6"
                  />
                  <StatsCard
                    icon={Award}
                    title="Points Awarded"
                    value={totalPointsAwarded.toLocaleString()}
                    color="#10b981"
                  />
                  <StatsCard
                    icon={Package}
                    title="Catalog Items"
                    value={catalogItems}
                    color="#f59e0b"
                  />
                  <StatsCard
                    icon={TrendingUp}
                    title="Pending Applications"
                    value={pendingApplications}
                    color="#ef4444"
                  />
                </div>
              )}

              {/* Join an Organization */}
              {joinedOrganizations.length === 0 && (
                <div className="panel">
                  <h2>Join an Organization</h2>
                  <p style={{ color: "#6b7280", marginBottom: "20px" }}>Select an organization to join:</p>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Organization</label>
                      <select
                        className="form-input"
                        value={selectedOrgToJoin}
                        onChange={(e) => setSelectedOrgToJoin(e.target.value)}
                      >
                        <option value="">-- Select Organization --</option>
                        {allOrganizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
            <button
              className="btn btn-primary"
                      onClick={() => joinOrganization(selectedOrgToJoin)}
                      disabled={!selectedOrgToJoin}
            >
                      Join Organization
            </button>
          </div>
                </div>
              )}

              {/* Active Organization (if joined) */}
              {joinedOrganizations.length > 0 && (
                <div className="panel">
                  <div className="panel-header">
                    <h2>Active Organization</h2>
          </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Switch Organization</label>
                      <select
                        className="form-input"
                        value={activeOrg?.id || ""}
                        onChange={async (e) => {
                          const org = joinedOrganizations.find((o) => o.id == e.target.value);
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
                        {joinedOrganizations.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} {o.is_active ? "(Active)" : ""}
                          </option>
                        ))}
                      </select>
          </div>
          </div>
          </div>
              )}

              {/* Join Additional Organizations */}
              {joinedOrganizations.length > 0 && allOrganizations.filter((org) => !joinedOrganizations.some((joined) => joined.id === org.id)).length > 0 && (
                <div className="panel">
                  <h2>Join Another Organization</h2>
                  <p style={{ color: "#6b7280", marginBottom: "20px" }}>Select an organization to join:</p>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Organization</label>
                      <select
                        className="form-input"
                        value={selectedOrgToJoin}
                        onChange={(e) => setSelectedOrgToJoin(e.target.value)}
                      >
                        <option value="">-- Select Organization --</option>
                        {allOrganizations
                          .filter((org) => !joinedOrganizations.some((joined) => joined.id === org.id))
                          .map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                      </select>
                    </div>
          <button
            className="btn btn-primary"
                      onClick={() => joinOrganization(selectedOrgToJoin)}
                      disabled={!selectedOrgToJoin}
          >
                      Join Organization
          </button>
                  </div>
          </div>
        )}

              {/* Drivers & Points */}
              {activeOrg && (
                <div className="panel">
                  <div className="panel-header">
                    <h2>Drivers & Points</h2>
                    <button onClick={() => setShowAddDriverModal(true)} className="btn btn-primary">
                      <UserPlus className="w-5 h-5" /> Add Driver
                    </button>
                  </div>
                  {drivers.length === 0 ? (
                    <div className="empty-state">
                      <Users className="w-12 h-12" />
                      <p>No drivers linked to this organization.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Driver Username</th>
                            <th>Email</th>
                            <th>Current Points</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drivers.map((driver) => {
                            // Find driver details from organizationDrivers if available
                            const driverDetails = organizationDrivers.find(d => d.username === driver.driver_username);
                            return (
                              <tr key={driver.driver_username}>
                                <td>
                                  <div className="user-cell">
                                    <div className="user-avatar">{driver.driver_username.charAt(0).toUpperCase()}</div>
                                    <span className="user-name">{driver.driver_username}</span>
                                  </div>
                                </td>
                                <td>{driverDetails?.email || driver.email || "N/A"}</td>
                                <td className="text-green">{driverPoints[driver.driver_username] || 0} pts</td>
                                <td>
                                  <div className="action-group">
                                    <button
                                      onClick={() => fetchDriverDetails(driver.driver_username)}
                                      className="btn btn-secondary btn-sm"
                                      disabled={loadingDrivers}
                                    >
                                      <Edit className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => removeDriverFromOrganization(driver.driver_username)}
                                      title={`Remove ${driver.driver_username} from ${activeOrg.name}`}
                                    >
                                      <Trash2 className="w-4 h-4" /> Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {view === "applications" && (
            <div className="panel">
              <div className="panel-header">
          <h2>Pending Applications</h2>
              </div>
          {applications.length === 0 ? (
                <div className="empty-state">
                  <Users className="w-12 h-12" />
                  <p>No pending applications.</p>
                </div>
          ) : (
                <div className="table-container">
                  <table className="data-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Applied At</th>
                        <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">{app.driver_username.charAt(0).toUpperCase()}</div>
                              <span className="user-name">{app.driver_username}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${app.status === "pending" ? "pending" : app.status === "accepted" ? "accepted" : "denied"}`}>
                              {app.status}
                            </span>
                          </td>
                    <td>{new Date(app.applied_at).toLocaleString()}</td>
                    <td>
                            <div className="action-group">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => approveApplication(app.id)}
                      >
                                <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => denyApplication(app.id)}
                      >
                                <XCircle className="w-4 h-4" /> Deny
                      </button>
                            </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
                </div>
          )}
      </div>
          )}

          {view === "points" && (
            <>
              <div className="panel">
                <h2><Award className="w-5 h-5" style={{ display: "inline", marginRight: "8px" }} /> Award Points</h2>
                <div className="form-group">
                  <label className="form-label">Select Driver</label>
                  <select
                    className="form-input"
                    value={selectedDriver || ""}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                  >
                    <option value="">-- Select Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.driver_username} value={d.driver_username}>
                        {d.driver_username} — {driverPoints[d.driver_username] || 0} pts
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Points</label>
                  <input
                    className="form-input"
                    type="number"
                    value={pointsToAward}
                    onChange={(e) => setPointsToAward(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason <span style={{ color: "#dc2626" }}>*</span></label>
                  <input
                    className="form-input"
                    value={pointsReason}
                    onChange={(e) => setPointsReason(e.target.value)}
                    placeholder="Reason for awarding points (required)"
                    required
                  />
                </div>

                <button className="btn btn-primary" onClick={awardPoints} disabled={awardingPoints || !selectedDriver || !pointsToAward || !pointsReason}>
                  {awardingPoints ? "Awarding..." : "Award Points"}
                </button>
              </div>

              <div className="panel" style={{ borderTop: "2px solid #fee2e2", marginTop: "24px" }}>
                <h2 style={{ color: "#dc2626" }}><TrendingUp className="w-5 h-5" style={{ display: "inline", marginRight: "8px" }} /> Deduct Points</h2>
                <div className="form-group">
                  <label className="form-label">Select Driver</label>
                  <select
                    className="form-input"
                    value={selectedDriver || ""}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                  >
                    <option value="">-- Select Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.driver_username} value={d.driver_username}>
                        {d.driver_username} — {driverPoints[d.driver_username] || 0} pts
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Points to Deduct</label>
                  <input
                    className="form-input"
                    type="number"
                    value={pointsToDeduct}
                    onChange={(e) => setPointsToDeduct(e.target.value)}
                    placeholder="e.g. 50"
                  />
                  {selectedDriver && driverPoints[selectedDriver] !== undefined && (
                    <p className="form-help">
                      Current balance: {driverPoints[selectedDriver]} points
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Reason <span style={{ color: "#dc2626" }}>*</span></label>
                  <input
                    className="form-input"
                    value={deductReason}
                    onChange={(e) => setDeductReason(e.target.value)}
                    placeholder="Reason for deducting points (required)"
                    required
                  />
                </div>

                <button 
                  className="btn btn-danger" 
                  onClick={deductPoints} 
                  disabled={deductingPoints || !selectedDriver || !pointsToDeduct || !deductReason}
                >
                  {deductingPoints ? "Deducting..." : "Deduct Points"}
                </button>
              </div>
            </>
          )}

          {view === "catalog" && (
            <>
              <div className="panel">
          <h2>Search eBay</h2>
          <div className="search-bar">
            <input
                    className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for items..."
            />
            <button className="btn btn-primary" onClick={() => loadEbayCatalog(searchTerm)}>
              Search
            </button>
          </div>

          {loadingCatalog ? (
                  <div className="loading-state">
                    <Activity className="w-8 h-8 animate-spin" />
                    <p>Loading eBay items...</p>
                  </div>
          ) : (
            <div className="catalog-grid">
              {catalog.map((item) => (
                <div key={item.itemId} className="catalog-card">
                        <img src={item.image?.imageUrl} alt={item.title} />
                  <h3>{item.title}</h3>
                        <p className="price">${item.price?.value} {item.price?.currency}</p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const points = prompt("Enter points cost:", "100");
                      if (points) addToCatalog(item, parseInt(points));
                    }}
                  >
                          + Add to Catalog
                  </button>
                </div>
              ))}
            </div>
          )}
              </div>

              <div className="panel">
          <h2>My Catalog</h2>
                {myCatalog.length === 0 ? (
                  <div className="empty-state">
                    <Package className="w-12 h-12" />
                    <p>No items in catalog yet.</p>
                  </div>
                ) : (
          <div className="catalog-grid">
            {myCatalog.map((item) => (
              <div key={item.id} className="catalog-card">
                        <img src={item.image_url} alt={item.title} />
                <h3>{item.title}</h3>
                        <p className="price">${item.price}</p>
                        <p style={{ color: "#10b981", fontWeight: 600 }}>{item.points_cost} pts</p>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removeFromCatalog(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
                )}
      </div>
            </>
          )}

          {view === "reports" && (
            <div className="panel">
              <div className="panel-header">
                <h2><FileText className="w-5 h-5" style={{ display: "inline", marginRight: "8px" }} /> Driver Points Report</h2>
                <button onClick={exportReportToCSV} className="btn btn-secondary" disabled={reportData.length === 0}>
                  <Download className="w-4 h-4" style={{ marginRight: "8px" }} />
                  Export CSV
                </button>
              </div>

              {!activeOrg ? (
                <div className="empty-state">
                  <FileText className="w-12 h-12" />
                  <p>Please select an organization to view reports.</p>
                </div>
              ) : (
                <>
                  <div className="filter-section" style={{ marginBottom: "24px", padding: "20px", background: "#f9fafb", borderRadius: "8px" }}>
                    <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: 600 }}>Filters</h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div className="form-group">
                        <label className="form-label">Driver</label>
                        <select
                          className="form-input"
                          value={reportFilters.driver_username}
                          onChange={(e) => setReportFilters({ ...reportFilters, driver_username: e.target.value })}
                        >
                          <option value="all">All Drivers</option>
                          {drivers.map((d) => (
                            <option key={d.driver_username} value={d.driver_username}>
                              {d.driver_username}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Start Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={reportFilters.startDate}
                          onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">End Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={reportFilters.endDate}
                          onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <button className="btn btn-primary" onClick={loadReport} disabled={loadingReport}>
                      {loadingReport ? "Loading..." : "Generate Report"}
                    </button>
                  </div>

                  {loadingReport ? (
                    <div className="loading-state">
                      <Activity className="w-8 h-8 animate-spin" />
                      <p>Loading report...</p>
                    </div>
                  ) : reportData.length === 0 ? (
                    <div className="empty-state">
                      <FileText className="w-12 h-12" />
                      <p>No data found. Adjust your filters and try again.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Driver Name</th>
                            <th>Total Points</th>
                            <th>Point Change</th>
                            <th>Date</th>
                            <th>Sponsor</th>
                            <th>Reason</th>
                            <th>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((driver) => {
                            if (driver.transactions.length === 0) {
                              return (
                                <tr key={driver.driver_username}>
                                  <td><strong>{driver.driver_username}</strong></td>
                                  <td>{driver.total_points}</td>
                                  <td colSpan="5" style={{ color: "#9ca3af", fontStyle: "italic" }}>
                                    No transactions in selected date range
                                  </td>
                                </tr>
                              );
                            }
                            return driver.transactions.map((trans, idx) => (
                              <tr key={`${driver.driver_username}-${trans.id}-${idx}`}>
                                {idx === 0 && (
                                  <>
                                    <td rowSpan={driver.transactions.length}>
                                      <strong>{driver.driver_username}</strong>
                                    </td>
                                    <td rowSpan={driver.transactions.length}>
                                      <span style={{ fontWeight: 600, color: "#3b82f6" }}>
                                        {driver.total_points}
                                      </span>
                                    </td>
                                  </>
                                )}
                                <td style={{ color: trans.points > 0 ? "#10b981" : "#dc2626", fontWeight: 600 }}>
                                  {trans.points > 0 ? `+${trans.points}` : trans.points}
                                </td>
                                <td>{new Date(trans.date).toLocaleString()}</td>
                                <td>{trans.sponsor_username || "N/A"}</td>
                                <td>{trans.reason || "—"}</td>
                                <td>
                                  <span className={`badge ${
                                    trans.type === "award" ? "accepted" :
                                    trans.type === "deduct" ? "denied" :
                                    "pending"
                                  }`}>
                                    {trans.type}
                                  </span>
                                </td>
                              </tr>
                            ));
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
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
              </div>

              <div className="panel">
                <h2><Lock className="w-5 h-5" style={{ display: "inline", marginRight: "8px" }} /> Change Password</h2>

                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={updatingAccount}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={updatingAccount}
                    placeholder="At least 8 characters"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
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
              </div>

              {accountMessage && (
                <div className={`alert ${accountMessage.includes("✓") ? "alert-success" : "alert-error"}`}>
                  {accountMessage.includes("✓") ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  <p>{accountMessage}</p>
                </div>
              )}

              <div className="panel" style={{ marginTop: "24px", borderTop: "2px solid #e5e7eb", paddingTop: "24px" }}>
                <div className="panel-header">
                  <h2><UserPlus className="w-5 h-5" style={{ display: "inline", marginRight: "8px" }} /> Create New Sponsor</h2>
                </div>
                <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "14px" }}>
                  Create a new sponsor account. Sponsors are self-managed and do not require an application process.
                </p>
                <button
                  onClick={() => setShowAddSponsorModal(true)}
                  className="btn btn-primary"
                  disabled={updatingAccount}
                >
                  <UserPlus className="w-5 h-5" /> Create New Sponsor
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Add Driver Modal */}
      {showAddDriverModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddDriverModal(false);
            setDriverFormError("");
            setDriverFormSuccess("");
            setNewDriver({ username: "", email: "", password: "" });
          }
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add New Driver</h3>
              <button
                onClick={() => {
                  setShowAddDriverModal(false);
                  setDriverFormError("");
                  setDriverFormSuccess("");
                  setNewDriver({ username: "", email: "", password: "" });
                }}
                className="modal-close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  className="form-input"
                  value={newDriver.username}
                  onChange={(e) => setNewDriver({ ...newDriver, username: e.target.value })}
                  disabled={loadingDrivers}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={newDriver.email}
                  onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                  disabled={loadingDrivers}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={newDriver.password}
                  onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
                  disabled={loadingDrivers}
                  placeholder="Minimum 8 characters"
                />
              </div>
              {driverFormError && (
                <div className="alert alert-error">
                  <XCircle className="w-5 h-5" />
                  <p>{driverFormError}</p>
                </div>
              )}
              {driverFormSuccess && (
                <div className="alert alert-success">
                  <CheckCircle className="w-5 h-5" />
                  <p>{driverFormSuccess}</p>
                </div>
              )}
              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowAddDriverModal(false);
                    setDriverFormError("");
                    setDriverFormSuccess("");
                    setNewDriver({ username: "", email: "", password: "" });
                  }}
                  className="btn btn-secondary"
                  disabled={loadingDrivers}
                >
                  Cancel
                </button>
                <button onClick={handleCreateDriver} className="btn btn-primary" disabled={loadingDrivers}>
                  {loadingDrivers ? "Creating..." : "Create Driver"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {showEditDriverModal && editingDriver && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowEditDriverModal(false);
            setEditingDriver(null);
            setEditDriverForm({ email: "", newPassword: "", point_alerts_enabled: true });
            setDriverFormError("");
            setDriverFormSuccess("");
          }
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Driver: {editingDriver.username}</h3>
              <button
                onClick={() => {
                  setShowEditDriverModal(false);
                  setEditingDriver(null);
                  setEditDriverForm({ email: "", newPassword: "", point_alerts_enabled: true });
                  setDriverFormError("");
                  setDriverFormSuccess("");
                }}
                className="modal-close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingDriver.username}
                  disabled
                  style={{ background: "#f5f5f5", cursor: "not-allowed" }}
                />
                <p className="form-help">Username cannot be changed</p>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={editDriverForm.email}
                  onChange={(e) => setEditDriverForm({ ...editDriverForm, email: e.target.value })}
                  disabled={loadingDrivers}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  className="form-input"
                  value={editDriverForm.newPassword}
                  onChange={(e) => setEditDriverForm({ ...editDriverForm, newPassword: e.target.value })}
                  disabled={loadingDrivers}
                  placeholder="Enter new password (min 8 characters)"
                />
                <p className="form-help">Only enter if you want to reset the password</p>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={editDriverForm.point_alerts_enabled}
                    onChange={(e) =>
                      setEditDriverForm({ ...editDriverForm, point_alerts_enabled: e.target.checked })
                    }
                    disabled={loadingDrivers}
                  />
                  Point Alerts Enabled
                </label>
              </div>
              {driverFormError && (
                <div className="alert alert-error">
                  <XCircle className="w-5 h-5" />
                  <p>{driverFormError}</p>
                </div>
              )}
              {driverFormSuccess && (
                <div className="alert alert-success">
                  <CheckCircle className="w-5 h-5" />
                  <p>{driverFormSuccess}</p>
                </div>
              )}
              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowEditDriverModal(false);
                    setEditingDriver(null);
                    setEditDriverForm({ email: "", newPassword: "", point_alerts_enabled: true });
                    setDriverFormError("");
                    setDriverFormSuccess("");
                  }}
                  className="btn btn-secondary"
                  disabled={loadingDrivers}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateDriver}
                  className="btn btn-primary"
                  disabled={loadingDrivers || !editingDriver}
                >
                  {loadingDrivers ? "Updating..." : "Update Driver"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Sponsor Modal */}
      {showAddSponsorModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddSponsorModal(false);
            setSponsorFormError("");
            setSponsorFormSuccess("");
            setNewSponsor({ username: "", email: "", password: "" });
          }
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create New Sponsor</h3>
              <button
                onClick={() => {
                  setShowAddSponsorModal(false);
                  setSponsorFormError("");
                  setSponsorFormSuccess("");
                  setNewSponsor({ username: "", email: "", password: "" });
                }}
                className="modal-close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  className="form-input"
                  value={newSponsor.username}
                  onChange={(e) => setNewSponsor({ ...newSponsor, username: e.target.value })}
                  disabled={updatingAccount}
                  placeholder="Enter username"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={newSponsor.email}
                  onChange={(e) => setNewSponsor({ ...newSponsor, email: e.target.value })}
                  disabled={updatingAccount}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={newSponsor.password}
                  onChange={(e) => setNewSponsor({ ...newSponsor, password: e.target.value })}
                  disabled={updatingAccount}
                  placeholder="Minimum 8 characters"
                />
                <p className="form-help">Password must be at least 8 characters long</p>
              </div>
              {sponsorFormError && (
                <div className="alert alert-error">
                  <XCircle className="w-5 h-5" />
                  <p>{sponsorFormError}</p>
                </div>
              )}
              {sponsorFormSuccess && (
                <div className="alert alert-success">
                  <CheckCircle className="w-5 h-5" />
                  <p>{sponsorFormSuccess}</p>
                </div>
              )}
              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowAddSponsorModal(false);
                    setSponsorFormError("");
                    setSponsorFormSuccess("");
                    setNewSponsor({ username: "", email: "", password: "" });
                  }}
                  className="btn btn-secondary"
                  disabled={updatingAccount}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSponsor}
                  className="btn btn-primary"
                  disabled={updatingAccount}
                >
                  {updatingAccount ? "Creating..." : "Create Sponsor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{css}</style>
    </div>
  );
}

// -------- STYLE --------
const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }

.sponsor-dashboard {
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

.btn-danger {
  background: #fee2e2;
  color: #dc2626;
}

.btn-danger:hover:not(:disabled) {
  background: #fecaca;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
}

.action-group {
  display: flex;
  gap: 12px;
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
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
}

.catalog-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.catalog-card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
}

.catalog-card h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.catalog-card .price {
  font-size: 18px;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 8px;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-bar .form-input {
  flex: 1;
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

.text-green {
  color: #16a34a;
  font-weight: 600;
}

.text-red {
  color: #dc2626;
  font-weight: 600;
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

/* ===== MODALS ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
  position: relative;
  margin: auto;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 32px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 20px 20px 0 0;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title::before {
  content: "";
  width: 4px;
  height: 28px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 2px;
}

.modal-close {
  background: #f3f4f6;
  border: none;
  color: #6b7280;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.modal-close:hover {
  background: #e5e7eb;
  color: #374151;
  transform: rotate(90deg);
}

.modal-body {
  padding: 32px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.modal-actions .btn {
  flex: 1;
  padding: 14px 24px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s;
  font-size: 15px;
}

.modal-actions .btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  color: white;
}

.modal-actions .btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.modal-actions .btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.modal-actions .btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.form-help {
  font-size: 13px;
  color: #6b7280;
  margin-top: 6px;
  font-style: italic;
}
`;