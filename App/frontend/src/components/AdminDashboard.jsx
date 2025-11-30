// App/frontend/src/components/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { 
  Users, Package, Award, Activity, Settings, LogOut, Menu, X, 
  TrendingUp, AlertCircle, ShoppingCart, UserPlus, CheckCircle, 
  XCircle, Trash2, Download, FileText, User, Lock, Edit, Shield
} from 'lucide-react';

// Modal Component
const AddUserModal = ({
  onClose,
  newUser,
  handleInputChange,
  handleAddUser,
  loading,
  formError,
  formSuccess,
  roleLabel,
}) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h3 className="modal-title">Add New {roleLabel}</h3>
        <button onClick={onClose} className="modal-close">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            name="username"
            value={newUser.username}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g. jdoe"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            value={newUser.email}
            onChange={handleInputChange}
            className="form-input"
            placeholder={`${roleLabel.toLowerCase()}@example.com`}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            value={newUser.password}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Min. 8 characters"
            disabled={loading}
          />
          <p className="form-help">Must be at least 8 characters long</p>
        </div>

        {formError && (
          <div className="alert alert-error">
            <XCircle className="w-5 h-5" />
            <p>{formError}</p>
          </div>
        )}

        {formSuccess && (
          <div className="alert alert-success">
            <CheckCircle className="w-5 h-5" />
            <p>{formSuccess}</p>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button onClick={handleAddUser} className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Stats Card Component
const StatsCard = ({ icon: Icon, title, value, trend, trendUp }) => (
  <div className="stats-card">
    <div className="stats-icon">
      <Icon className="w-6 h-6" />
    </div>
    <div className="stats-content">
      <p className="stats-title">{title}</p>
      <h3 className="stats-value">{value}</h3>
      {trend && (
        <p className={`stats-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
          <TrendingUp className="w-4 h-4" />
          {trend}
        </p>
      )}
    </div>
  </div>
);

export default function AdminDashboard({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  
  // Data states
  const [drivers, setDrivers] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // User edit modal state
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    email: "",
    newPassword: "",
    point_alerts_enabled: true,
  });
  const [editUserError, setEditUserError] = useState("");
  const [editUserSuccess, setEditUserSuccess] = useState("");
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  
  // Form states
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "" });
  const [newSponsor, setNewSponsor] = useState({ username: "", email: "", password: "" });
  const [newAdmin, setNewAdmin] = useState({ username: "", email: "", password: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [sponsorFormError, setSponsorFormError] = useState("");
  const [sponsorFormSuccess, setSponsorFormSuccess] = useState("");
  const [adminFormError, setAdminFormError] = useState("");
  const [adminFormSuccess, setAdminFormSuccess] = useState("");
  
  // Catalog states
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("truck");
  
  // Report filters
  const [reportFilter, setReportFilter] = useState({
    startDate: "",
    endDate: "",
    type: "all",
    username: ""
  });

  // Sales by Sponsor report state
  const [salesBySponsorFilter, setSalesBySponsorFilter] = useState({
    sponsor_username: "all",
    startDate: "",
    endDate: "",
    view: "summary" // "summary" or "detailed"
  });
  const [salesBySponsorData, setSalesBySponsorData] = useState([]);
  const [loadingSalesBySponsor, setLoadingSalesBySponsor] = useState(false);
  
  // Sales by Driver report state
  const [salesByDriverFilter, setSalesByDriverFilter] = useState({
    sponsor_username: "all",
    driver_username: "all",
    startDate: "",
    endDate: "",
    view: "summary" // "summary" or "detailed"
  });
  const [salesByDriverData, setSalesByDriverData] = useState([]);
  const [loadingSalesByDriver, setLoadingSalesByDriver] = useState(false);
  
  // Invoice generation state
  const [invoiceFilter, setInvoiceFilter] = useState({
    sponsor_username: "all",
    startDate: "",
    endDate: "",
  });
  const [invoiceData, setInvoiceData] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  
  // Audit log state
  const [auditLogFilter, setAuditLogFilter] = useState({
    event_type: "all",
    startDate: "",
    endDate: "",
  });
  const [auditLogData, setAuditLogData] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  
  const [reportView, setReportView] = useState("transactions"); // "transactions", "salesBySponsor", "salesByDriver", "invoices", or "auditLogs"

  // Account Management
  const [editEmail, setEditEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [updatingAccount, setUpdatingAccount] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalSponsors: 0,
    totalPointsAwarded: 0,
    totalRedemptions: 0,
    activeOrganizations: 0
  });

  // Load initial data
  useEffect(() => {
    if (activeTab === "overview") {
      loadStats();
      loadRecentTransactions();
    }
    if (activeTab === "drivers") fetchDrivers();
    if (activeTab === "sponsors") fetchSponsors();
    if (activeTab === "admins") fetchAdmins();
    if (activeTab === "reports") {
      loadAllTransactions();
    }
    if (activeTab === "catalog") loadCatalog(searchTerm);
    if (activeTab === "settings") {
      setEditEmail(user?.email || "");
    }
  }, [activeTab, user]);

  // Load sales by sponsor when view changes
  useEffect(() => {
    if (activeTab === "reports" && reportView === "salesBySponsor") {
      loadSalesBySponsor();
    }
    if (activeTab === "reports" && reportView === "salesByDriver") {
      loadSalesByDriver();
    }
    if (activeTab === "reports" && reportView === "invoices") {
      loadInvoices();
    }
    if (activeTab === "reports" && reportView === "auditLogs") {
      loadAuditLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportView, activeTab]);

  // ===== Data Loaders =====
  const loadStats = async () => {
    try {
      const [driversRes, sponsorsRes] = await Promise.all([
        fetch("/api/drivers"),
        fetch("/api/sponsors")
      ]);
      
      const driversData = await driversRes.json();
      const sponsorsData = await sponsorsRes.json();
      
      setStats(prev => ({
        ...prev,
        totalDrivers: driversData.drivers?.length || 0,
        totalSponsors: sponsorsData.sponsors?.length || 0
      }));
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const loadRecentTransactions = async () => {
    // Simulated transaction data - replace with actual API call
    const mockTransactions = [
      {
        id: 1,
        type: "award",
        driver: "driver1",
        sponsor: "sponsor1",
        points: 100,
        reason: "Safe driving bonus",
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        type: "redeem",
        driver: "driver2",
        sponsor: "sponsor1",
        points: -50,
        item: "Truck Parts Kit",
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    setTransactions(mockTransactions.slice(0, 5));
  };

  const loadAllTransactions = async () => {
    // Load all transactions for reports
    const mockTransactions = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      type: i % 3 === 0 ? "redeem" : "award",
      driver: `driver${(i % 5) + 1}`,
      sponsor: `sponsor${(i % 3) + 1}`,
      points: i % 3 === 0 ? -(50 + i * 5) : (100 + i * 10),
      reason: i % 3 === 0 ? `Redeemed item ${i}` : "Performance bonus",
      timestamp: new Date(Date.now() - i * 86400000).toISOString()
    }));
    setTransactions(mockTransactions);
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch("/api/drivers");
      if (!response.ok) throw new Error("Failed to fetch drivers");
      const data = await response.json();
      const driverList = Array.isArray(data) ? data : data.drivers || [];
      setDrivers(driverList);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      setDrivers([]);
    }
  };

  const fetchSponsors = async () => {
    try {
      const response = await fetch("/api/sponsors");
      if (response.ok) {
        const data = await response.json();
        setSponsors(data.sponsors);
      }
    } catch (error) {
      console.error("Error fetching sponsors:", error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admins");
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const fetchUserDetails = async (username) => {
    setLoadingUserDetails(true);
    setEditUserError("");
    setEditUserSuccess("");
    setShowEditUserModal(true); // Show modal immediately
    try {
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to fetch user details");
      }
      const userData = await response.json();
      setEditingUser(userData);
      setEditUserForm({
        email: userData.email || "",
        newPassword: "",
        point_alerts_enabled: userData.point_alerts_enabled !== undefined ? userData.point_alerts_enabled : true,
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      setEditUserError(error.message || "Failed to load user details");
      // Set a minimal user object so the modal can display
      setEditingUser({
        username: username,
        role: "unknown",
        email: "",
      });
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    setEditUserError("");
    setEditUserSuccess("");
    setLoading(true);

    try {
      const updateData = {};
      if (editUserForm.email && editUserForm.email !== editingUser.email) {
        updateData.email = editUserForm.email;
      }
      if (editUserForm.newPassword) {
        if (editUserForm.newPassword.length < 8) {
          setEditUserError("Password must be at least 8 characters");
          setLoading(false);
          return;
        }
        updateData.newPassword = editUserForm.newPassword;
      }
      if (editUserForm.point_alerts_enabled !== editingUser.point_alerts_enabled) {
        updateData.point_alerts_enabled = editUserForm.point_alerts_enabled;
      }

      if (Object.keys(updateData).length === 0) {
        setEditUserError("No changes to save");
        setLoading(false);
        return;
      }

      console.log("Sending update request:", updateData);
      const response = await fetch(`/api/users/${editingUser.username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers.get("content-type"));
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text.substring(0, 200));
        throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Update response:", data);

      if (response.ok) {
        setEditUserSuccess("User updated successfully!");
        // Refresh the appropriate list
        if (editingUser.role === "driver") {
          fetchDrivers();
        } else if (editingUser.role === "sponsor") {
          fetchSponsors();
        } else if (editingUser.role === "admin") {
          fetchAdmins();
        }
        // Update editing user with new data
        setEditingUser({ ...editingUser, ...data.user });
        setTimeout(() => {
          setShowEditUserModal(false);
          setEditUserForm({ email: "", newPassword: "", point_alerts_enabled: true });
          setEditingUser(null);
        }, 1500);
      } else {
        const errorMessage = data.error || "Failed to update user";
        const errorDetails = data.details ? `: ${data.details}` : "";
        setEditUserError(`${errorMessage}${errorDetails}`);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setEditUserError(`Server error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockAccount = async () => {
    if (!editingUser) return;
    
    setEditUserError("");
    setEditUserSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`/api/users/${editingUser.username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlock_account: true }),
      });

      const data = await response.json();

      if (response.ok) {
        setEditUserSuccess("Account unlocked successfully!");
        fetchUserDetails(editingUser.username);
      } else {
        setEditUserError(data.error || "Failed to unlock account");
      }
    } catch (error) {
      console.error("Error unlocking account:", error);
      setEditUserError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async (query) => {
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
  };

  const loadSalesBySponsor = async () => {
    setLoadingSalesBySponsor(true);
    try {
      const params = new URLSearchParams({
        view: salesBySponsorFilter.view,
      });
      
      if (salesBySponsorFilter.sponsor_username && salesBySponsorFilter.sponsor_username !== "all") {
        params.append("sponsor_username", salesBySponsorFilter.sponsor_username);
      }
      if (salesBySponsorFilter.startDate) {
        params.append("startDate", salesBySponsorFilter.startDate);
      }
      if (salesBySponsorFilter.endDate) {
        params.append("endDate", salesBySponsorFilter.endDate);
      }

      const res = await fetch(`/api/reports/sales-by-sponsor?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load sales by sponsor report");
      const data = await res.json();
      setSalesBySponsorData(data);
    } catch (err) {
      console.error("Error loading sales by sponsor report:", err);
      setSalesBySponsorData([]);
    } finally {
      setLoadingSalesBySponsor(false);
    }
  };

  const loadSalesByDriver = async () => {
    setLoadingSalesByDriver(true);
    try {
      const params = new URLSearchParams({
        view: salesByDriverFilter.view,
      });
      
      if (salesByDriverFilter.sponsor_username && salesByDriverFilter.sponsor_username !== "all") {
        params.append("sponsor_username", salesByDriverFilter.sponsor_username);
      }
      if (salesByDriverFilter.driver_username && salesByDriverFilter.driver_username !== "all") {
        params.append("driver_username", salesByDriverFilter.driver_username);
      }
      if (salesByDriverFilter.startDate) {
        params.append("startDate", salesByDriverFilter.startDate);
      }
      if (salesByDriverFilter.endDate) {
        params.append("endDate", salesByDriverFilter.endDate);
      }

      const res = await fetch(`/api/reports/sales-by-driver?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load sales by driver report");
      const data = await res.json();
      setSalesByDriverData(data);
    } catch (err) {
      console.error("Error loading sales by driver report:", err);
      setSalesByDriverData([]);
    } finally {
      setLoadingSalesByDriver(false);
    }
  };

  const loadInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const params = new URLSearchParams();
      
      if (invoiceFilter.sponsor_username && invoiceFilter.sponsor_username !== "all") {
        params.append("sponsor_username", invoiceFilter.sponsor_username);
      }
      if (invoiceFilter.startDate) {
        params.append("startDate", invoiceFilter.startDate);
      }
      if (invoiceFilter.endDate) {
        params.append("endDate", invoiceFilter.endDate);
      }

      const res = await fetch(`/api/reports/invoices?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoiceData(data);
    } catch (err) {
      console.error("Error loading invoices:", err);
      setInvoiceData([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const params = new URLSearchParams();
      
      if (auditLogFilter.event_type && auditLogFilter.event_type !== "all") {
        params.append("event_type", auditLogFilter.event_type);
      }
      if (auditLogFilter.startDate) {
        params.append("startDate", auditLogFilter.startDate);
      }
      if (auditLogFilter.endDate) {
        params.append("endDate", auditLogFilter.endDate);
      }

      const res = await fetch(`/api/reports/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load audit logs");
      const data = await res.json();
      setAuditLogData(data);
    } catch (err) {
      console.error("Error loading audit logs:", err);
      setAuditLogData([]);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  // ===== User Management =====
  const handleDeleteUser = async (username, role) => {
    if (!confirm(`Are you sure you want to delete ${role} '${username}'? This action cannot be undone.`)) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${username}`, { method: "DELETE" });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }
      
      // Update local state
      if (role === "driver") {
        setDrivers((prev) => prev.filter((u) => u.username !== username));
      } else if (role === "sponsor") {
        setSponsors((prev) => prev.filter((u) => u.username !== username));
      } else if (role === "admin") {
        setAdmins((prev) => prev.filter((u) => u.username !== username));
      }
      
      alert(`✅ ${data.message || `${role} '${username}' deleted successfully.`}`);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(`❌ ${err.message || "Failed to delete user. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    setFormError("");
    setFormSuccess("");
    if (!newUser.username || !newUser.email || !newUser.password) {
      setFormError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newUser, role: "driver" }),
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess(`Driver '${data.user?.username || newUser.username}' created!`);
        fetchDrivers();
        setTimeout(() => {
          setShowAddUserModal(false);
          setNewUser({ username: "", email: "", password: "" });
        }, 1200);
      } else {
        setFormError(data.error || "Failed to create driver");
      }
    } catch (err) {
      setFormError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSponsor = async () => {
    setSponsorFormError("");
    setSponsorFormSuccess("");
    if (!newSponsor.username || !newSponsor.email || !newSponsor.password) {
      setSponsorFormError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newSponsor, role: "sponsor" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSponsorFormSuccess(`Sponsor '${data.user?.username || newSponsor.username}' created!`);
        fetchSponsors();
        setTimeout(() => {
          setShowAddSponsorModal(false);
          setNewSponsor({ username: "", email: "", password: "" });
        }, 1200);
      } else {
        setSponsorFormError(data.error || "Failed to create sponsor");
      }
    } catch (err) {
      setSponsorFormError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    setAdminFormError("");
    setAdminFormSuccess("");
    if (!newAdmin.username || !newAdmin.email || !newAdmin.password) {
      setAdminFormError("All fields are required.");
      return;
    }
    if (newAdmin.password.length < 8) {
      setAdminFormError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAdmin, role: "admin" }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminFormSuccess(`Admin '${data.user?.username || newAdmin.username}' created!`);
        fetchAdmins();
        setTimeout(() => {
          setShowAddAdminModal(false);
          setNewAdmin({ username: "", email: "", password: "" });
        }, 1200);
      } else {
        setAdminFormError(data.error || "Failed to create admin");
      }
    } catch (err) {
      setAdminFormError("Server error");
    } finally {
      setLoading(false);
    }
  };

  // ===== Report Generation =====
  const generateCSVReport = () => {
    const filteredTransactions = filterTransactions();
    
    const headers = ["ID", "Type", "Driver", "Sponsor", "Points", "Reason/Item", "Timestamp"];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.type,
      t.driver,
      t.sponsor,
      t.points,
      t.reason || t.item || "",
      new Date(t.timestamp).toLocaleString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaction-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDFReport = () => {
    alert("PDF generation would be implemented with a library like jsPDF");
  };

  const filterTransactions = () => {
    return transactions.filter(t => {
      const matchesType = reportFilter.type === "all" || t.type === reportFilter.type;
      const matchesUsername = !reportFilter.username || 
        t.driver.includes(reportFilter.username) || 
        t.sponsor.includes(reportFilter.username);
      
      const transDate = new Date(t.timestamp);
      const matchesStartDate = !reportFilter.startDate || 
        transDate >= new Date(reportFilter.startDate);
      const matchesEndDate = !reportFilter.endDate || 
        transDate <= new Date(reportFilter.endDate);

      return matchesType && matchesUsername && matchesStartDate && matchesEndDate;
    });
  };

  // ===== Account Management =====
  async function updateEmail() {
    if (!editEmail || editEmail === user?.email) {
      setAccountMessage("✗ Please enter a new email address.");
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
        const updatedUser = { ...user, email: editEmail };
        localStorage.setItem("user", JSON.stringify(updatedUser));
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

  // ===== Render Functions =====
  const renderOverview = () => {
    const filteredTrans = filterTransactions();
    const totalPointsAwarded = filteredTrans
      .filter(t => t.type === "award")
      .reduce((sum, t) => sum + t.points, 0);
    const totalRedemptions = filteredTrans
      .filter(t => t.type === "redeem")
      .length;

    return (
      <div className="content-area">
        <div className="stats-grid">
          <StatsCard
            icon={Users}
            title="Total Drivers"
            value={stats.totalDrivers}
            trend="+12% from last month"
            trendUp={true}
          />
          <StatsCard
            icon={Package}
            title="Total Sponsors"
            value={stats.totalSponsors}
            trend="+5% from last month"
            trendUp={true}
          />
          <StatsCard
            icon={Award}
            title="Points Awarded"
            value={totalPointsAwarded.toLocaleString()}
            trend="+23% from last month"
            trendUp={true}
          />
          <StatsCard
            icon={ShoppingCart}
            title="Redemptions"
            value={totalRedemptions}
            trend="+8% from last month"
            trendUp={true}
          />
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Recent Activity</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab("reports")}>
              <FileText className="w-4 h-4" /> View All Reports
            </button>
          </div>
          <div className="transaction-list">
            {transactions.map(t => (
              <div key={t.id} className="transaction-item">
                <div className={`transaction-icon ${t.type}`}>
                  {t.type === "award" ? <Award className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                </div>
                <div className="transaction-details">
                  <p className="transaction-title">
                    {t.type === "award" 
                      ? `${t.sponsor} awarded ${t.points} points to ${t.driver}`
                      : `${t.driver} redeemed ${Math.abs(t.points)} points`
                    }
                  </p>
                  <p className="transaction-meta">
                    {t.reason || t.item} • {new Date(t.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className={`transaction-badge ${t.type}`}>
                  {t.type === "award" ? `+${t.points}` : t.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDrivers = () => (
    <div className="content-area">
      <div className="panel">
        <div className="panel-header">
          <h2>Drivers Management</h2>
          <button onClick={() => setShowAddUserModal(true)} className="btn btn-primary">
            <UserPlus className="w-5 h-5" /> Add Driver
          </button>
        </div>
        {drivers.length === 0 ? (
          <div className="empty-state">
            <Users className="w-12 h-12" />
            <p>No drivers found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.username}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{d.username.charAt(0).toUpperCase()}</div>
                        <span className="user-name">{d.username}</span>
                      </div>
                    </td>
                    <td>{d.email}</td>
                    <td>{new Date(d.created_at).toLocaleDateString()}</td>
                    <td>{d.last_login ? new Date(d.last_login).toLocaleDateString() : "Never"}</td>
                    <td>
                      <div className="action-group">
                        <button
                          onClick={() => fetchUserDetails(d.username)}
                          className="btn btn-secondary btn-sm"
                          disabled={loadingUserDetails}
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(d.username, "driver")}
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
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
    </div>
  );

  const renderSponsors = () => (
    <div className="content-area">
      <div className="panel">
        <div className="panel-header">
          <h2>Sponsors Management</h2>
          <button onClick={() => setShowAddSponsorModal(true)} className="btn btn-primary">
            <UserPlus className="w-5 h-5" /> Add Sponsor
          </button>
        </div>
        {sponsors.length === 0 ? (
          <div className="empty-state">
            <Package className="w-12 h-12" />
            <p>No sponsors found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((s) => (
                  <tr key={s.username}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar sponsor">{s.username.charAt(0).toUpperCase()}</div>
                        <span className="user-name">{s.username}</span>
                      </div>
                    </td>
                    <td>{s.email}</td>
                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td>{s.last_login ? new Date(s.last_login).toLocaleDateString() : "Never"}</td>
                    <td>
                      <div className="action-group">
                        <button
                          onClick={() => fetchUserDetails(s.username)}
                          className="btn btn-secondary btn-sm"
                          disabled={loadingUserDetails}
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(s.username, "sponsor")}
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
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
    </div>
  );

  const renderAdmins = () => (
    <div className="content-area">
      <div className="panel">
        <div className="panel-header">
          <h2>Admins Management</h2>
          <button onClick={() => setShowAddAdminModal(true)} className="btn btn-primary">
            <UserPlus className="w-5 h-5" /> Add Admin
          </button>
        </div>
        {admins.length === 0 ? (
          <div className="empty-state">
            <Shield className="w-12 h-12" />
            <p>No admins found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.username}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" }}>
                          {a.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="user-name">{a.username}</span>
                      </div>
                    </td>
                    <td>{a.email}</td>
                    <td>{new Date(a.created_at).toLocaleDateString()}</td>
                    <td>{a.last_login ? new Date(a.last_login).toLocaleDateString() : "Never"}</td>
                    <td>
                      <div className="action-group">
                        <button
                          onClick={() => fetchUserDetails(a.username)}
                          className="btn btn-secondary btn-sm"
                          disabled={loadingUserDetails}
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        {a.username !== user?.username && (
                          <button
                            onClick={() => handleDeleteUser(a.username, "admin")}
                            className="btn btn-danger btn-sm"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderReports = () => {
    const filteredTrans = filterTransactions();

    return (
      <div className="content-area">
        {/* Report Type Tabs */}
        <div className="report-tabs">
          <button
            className={`report-tab ${reportView === "transactions" ? "active" : ""}`}
            onClick={() => setReportView("transactions")}
          >
            Transaction Reports
          </button>
          <button
            className={`report-tab ${reportView === "salesBySponsor" ? "active" : ""}`}
            onClick={() => {
              setReportView("salesBySponsor");
              loadSalesBySponsor();
            }}
          >
            Sales by Sponsor
          </button>
          <button
            className={`report-tab ${reportView === "salesByDriver" ? "active" : ""}`}
            onClick={() => {
              setReportView("salesByDriver");
              loadSalesByDriver();
            }}
          >
            Sales by Driver
          </button>
          <button
            className={`report-tab ${reportView === "invoices" ? "active" : ""}`}
            onClick={() => {
              setReportView("invoices");
              loadInvoices();
            }}
          >
            Invoices
          </button>
          <button
            className={`report-tab ${reportView === "auditLogs" ? "active" : ""}`}
            onClick={() => {
              setReportView("auditLogs");
              loadAuditLogs();
            }}
          >
            Audit Logs
          </button>
        </div>

        {reportView === "transactions" && (
          <div className="panel">
            <div className="panel-header">
              <h2>Transaction Reports</h2>
              <div className="action-group">
                <button onClick={generateCSVReport} className="btn btn-secondary">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={generatePDFReport} className="btn btn-secondary">
                  <Download className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>

          <div className="filter-section">
            <div className="filter-grid">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-input"
                  value={reportFilter.type}
                  onChange={(e) => setReportFilter({...reportFilter, type: e.target.value})}
                >
                  <option value="all">All Transactions</option>
                  <option value="award">Awards Only</option>
                  <option value="redeem">Redemptions Only</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Filter by username"
                  value={reportFilter.username}
                  onChange={(e) => setReportFilter({...reportFilter, username: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={reportFilter.startDate}
                  onChange={(e) => setReportFilter({...reportFilter, startDate: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={reportFilter.endDate}
                  onChange={(e) => setReportFilter({...reportFilter, endDate: e.target.value})}
                />
              </div>
            </div>

            <button
              className="btn btn-ghost"
              onClick={() => setReportFilter({ startDate: "", endDate: "", type: "all", username: "" })}
            >
              Clear Filters
            </button>
          </div>

          <div className="report-summary">
            <div className="summary-item">
              <span>Total Transactions:</span>
              <strong>{filteredTrans.length}</strong>
            </div>
            <div className="summary-item">
              <span>Total Points Awarded:</span>
              <strong>
                {filteredTrans
                  .filter(t => t.type === "award")
                  .reduce((sum, t) => sum + t.points, 0)
                  .toLocaleString()}
              </strong>
            </div>
            <div className="summary-item">
              <span>Total Points Redeemed:</span>
              <strong>
                {Math.abs(
                  filteredTrans
                    .filter(t => t.type === "redeem")
                    .reduce((sum, t) => sum + t.points, 0)
                ).toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Driver</th>
                  <th>Sponsor</th>
                  <th>Points</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrans.map((t) => (
                  <tr key={t.id}>
                    <td>#{t.id}</td>
                    <td>
                      <span className={`badge ${t.type}`}>
                        {t.type === "award" ? "Award" : "Redemption"}
                      </span>
                    </td>
                    <td>{t.driver}</td>
                    <td>{t.sponsor}</td>
                    <td className={t.type === "award" ? "text-green" : "text-red"}>
                      {t.type === "award" ? `+${t.points}` : t.points}
                    </td>
                    <td>{t.reason || t.item}</td>
                    <td>{new Date(t.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {reportView === "salesBySponsor" && renderSalesBySponsor()}
        {reportView === "salesByDriver" && renderSalesByDriver()}
        {reportView === "invoices" && renderInvoices()}
        {reportView === "auditLogs" && renderAuditLogs()}
      </div>
    );
  };

  const renderSalesBySponsor = () => {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2>Sales by Sponsor Report</h2>
          <div className="action-group">
            <button
              onClick={loadSalesBySponsor}
              className="btn btn-primary"
              disabled={loadingSalesBySponsor}
            >
              {loadingSalesBySponsor ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={() => {
                const csvContent = generateSalesBySponsorCSV();
                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `sales-by-sponsor-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn btn-secondary"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-grid">
            <div className="form-group">
              <label className="form-label">Sponsor</label>
              <select
                className="form-input"
                value={salesBySponsorFilter.sponsor_username}
                onChange={(e) =>
                  setSalesBySponsorFilter({
                    ...salesBySponsorFilter,
                    sponsor_username: e.target.value,
                  })
                }
              >
                <option value="all">All Sponsors</option>
                {sponsors.map((s) => (
                  <option key={s.username} value={s.username}>
                    {s.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={salesBySponsorFilter.startDate}
                onChange={(e) =>
                  setSalesBySponsorFilter({
                    ...salesBySponsorFilter,
                    startDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={salesBySponsorFilter.endDate}
                onChange={(e) =>
                  setSalesBySponsorFilter({
                    ...salesBySponsorFilter,
                    endDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">View</label>
              <select
                className="form-input"
                value={salesBySponsorFilter.view}
                onChange={(e) =>
                  setSalesBySponsorFilter({
                    ...salesBySponsorFilter,
                    view: e.target.value,
                  })
                }
              >
                <option value="summary">Summary</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={loadSalesBySponsor}
            disabled={loadingSalesBySponsor}
          >
            {loadingSalesBySponsor ? "Loading..." : "Generate Report"}
          </button>
        </div>

        {loadingSalesBySponsor ? (
          <div className="loading-state">
            <Activity className="w-8 h-8 animate-spin" />
            <p>Loading report...</p>
          </div>
        ) : salesBySponsorData.length === 0 ? (
          <div className="empty-state">
            <Package className="w-12 h-12" />
            <p>No data found. Adjust filters and try again.</p>
          </div>
        ) : salesBySponsorFilter.view === "summary" ? (
          <>
            <div className="report-summary">
              <div className="summary-item">
                <span>Total Sponsors:</span>
                <strong>{salesBySponsorData.length}</strong>
              </div>
              <div className="summary-item">
                <span>Total Points Redeemed:</span>
                <strong>
                  {salesBySponsorData
                    .reduce((sum, item) => sum + item.total_points_redeemed, 0)
                    .toLocaleString()}
                </strong>
              </div>
              <div className="summary-item">
                <span>Total Redemptions:</span>
                <strong>
                  {salesBySponsorData
                    .reduce((sum, item) => sum + item.total_redemptions, 0)
                    .toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sponsor</th>
                    <th>Total Points Redeemed</th>
                    <th>Total Redemptions</th>
                    <th>Unique Drivers</th>
                  </tr>
                </thead>
                <tbody>
                  {salesBySponsorData.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar sponsor">
                            {item.sponsor_username.charAt(0).toUpperCase()}
                          </div>
                          <span className="user-name">{item.sponsor_username}</span>
                        </div>
                      </td>
                      <td className="text-red">
                        {item.total_points_redeemed.toLocaleString()}
                      </td>
                      <td>{item.total_redemptions.toLocaleString()}</td>
                      <td>{item.unique_drivers.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="report-summary">
              <div className="summary-item">
                <span>Total Redemptions:</span>
                <strong>{salesBySponsorData.length}</strong>
              </div>
              <div className="summary-item">
                <span>Total Points Redeemed:</span>
                <strong>
                  {salesBySponsorData
                    .reduce((sum, item) => sum + item.points_redeemed, 0)
                    .toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Driver</th>
                    <th>Sponsor</th>
                    <th>Item</th>
                    <th>Points Redeemed</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {salesBySponsorData.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.driver_username}</td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar sponsor">
                            {item.sponsor_username.charAt(0).toUpperCase()}
                          </div>
                          <span className="user-name">{item.sponsor_username}</span>
                        </div>
                      </td>
                      <td>{item.item_title}</td>
                      <td className="text-red">
                        {item.points_redeemed.toLocaleString()}
                      </td>
                      <td>{new Date(item.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  const generateSalesBySponsorCSV = () => {
    if (salesBySponsorFilter.view === "summary") {
      const headers = ["Sponsor", "Total Points Redeemed", "Total Redemptions", "Unique Drivers"];
      const rows = salesBySponsorData.map((item) => [
        item.sponsor_username,
        item.total_points_redeemed,
        item.total_redemptions,
        item.unique_drivers,
      ]);
      return [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");
    } else {
      const headers = ["ID", "Driver", "Sponsor", "Item", "Points Redeemed", "Date"];
      const rows = salesBySponsorData.map((item) => [
        item.id,
        item.driver_username,
        item.sponsor_username,
        item.item_title,
        item.points_redeemed,
        new Date(item.date).toLocaleString(),
      ]);
      return [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");
    }
  };

  const renderSalesByDriver = () => {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2>Sales by Driver Report</h2>
          <div className="action-group">
            <button
              onClick={loadSalesByDriver}
              className="btn btn-primary"
              disabled={loadingSalesByDriver}
            >
              {loadingSalesByDriver ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={() => {
                const csvContent = generateSalesByDriverCSV();
                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `sales-by-driver-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn btn-secondary"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-grid">
            <div className="form-group">
              <label className="form-label">Sponsor</label>
              <select
                className="form-input"
                value={salesByDriverFilter.sponsor_username}
                onChange={(e) =>
                  setSalesByDriverFilter({
                    ...salesByDriverFilter,
                    sponsor_username: e.target.value,
                  })
                }
              >
                <option value="all">All Sponsors</option>
                {sponsors.map((s) => (
                  <option key={s.username} value={s.username}>
                    {s.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Driver</label>
              <select
                className="form-input"
                value={salesByDriverFilter.driver_username}
                onChange={(e) =>
                  setSalesByDriverFilter({
                    ...salesByDriverFilter,
                    driver_username: e.target.value,
                  })
                }
              >
                <option value="all">All Drivers</option>
                {drivers.map((d) => (
                  <option key={d.username} value={d.username}>
                    {d.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={salesByDriverFilter.startDate}
                onChange={(e) =>
                  setSalesByDriverFilter({
                    ...salesByDriverFilter,
                    startDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={salesByDriverFilter.endDate}
                onChange={(e) =>
                  setSalesByDriverFilter({
                    ...salesByDriverFilter,
                    endDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">View</label>
              <select
                className="form-input"
                value={salesByDriverFilter.view}
                onChange={(e) =>
                  setSalesByDriverFilter({
                    ...salesByDriverFilter,
                    view: e.target.value,
                  })
                }
              >
                <option value="summary">Summary</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={loadSalesByDriver}
            disabled={loadingSalesByDriver}
          >
            {loadingSalesByDriver ? "Loading..." : "Generate Report"}
          </button>
        </div>

        {loadingSalesByDriver ? (
          <div className="loading-state">
            <Activity className="w-8 h-8 animate-spin" />
            <p>Loading report...</p>
          </div>
        ) : salesByDriverData.length === 0 ? (
          <div className="empty-state">
            <Users className="w-12 h-12" />
            <p>No data found. Adjust filters and try again.</p>
          </div>
        ) : salesByDriverFilter.view === "summary" ? (
          <>
            <div className="report-summary">
              <div className="summary-item">
                <span>Total Drivers:</span>
                <strong>{salesByDriverData.length}</strong>
              </div>
              <div className="summary-item">
                <span>Total Points Redeemed:</span>
                <strong>
                  {salesByDriverData
                    .reduce((sum, item) => sum + item.total_points_redeemed, 0)
                    .toLocaleString()}
                </strong>
              </div>
              <div className="summary-item">
                <span>Total Redemptions:</span>
                <strong>
                  {salesByDriverData
                    .reduce((sum, item) => sum + item.total_redemptions, 0)
                    .toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Total Points Redeemed</th>
                    <th>Total Redemptions</th>
                    <th>Unique Sponsors</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByDriverData.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {item.driver_username.charAt(0).toUpperCase()}
                          </div>
                          <span className="user-name">{item.driver_username}</span>
                        </div>
                      </td>
                      <td className="text-red">
                        {item.total_points_redeemed.toLocaleString()}
                      </td>
                      <td>{item.total_redemptions.toLocaleString()}</td>
                      <td>{item.unique_sponsors.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="report-summary">
              <div className="summary-item">
                <span>Total Redemptions:</span>
                <strong>{salesByDriverData.length}</strong>
              </div>
              <div className="summary-item">
                <span>Total Points Redeemed:</span>
                <strong>
                  {salesByDriverData
                    .reduce((sum, item) => sum + item.points_redeemed, 0)
                    .toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Driver</th>
                    <th>Sponsor</th>
                    <th>Item</th>
                    <th>Points Redeemed</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByDriverData.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {item.driver_username.charAt(0).toUpperCase()}
                          </div>
                          <span className="user-name">{item.driver_username}</span>
                        </div>
                      </td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar sponsor">
                            {item.sponsor_username.charAt(0).toUpperCase()}
                          </div>
                          <span className="user-name">{item.sponsor_username}</span>
                        </div>
                      </td>
                      <td>{item.item_title}</td>
                      <td className="text-red">
                        {item.points_redeemed.toLocaleString()}
                      </td>
                      <td>{new Date(item.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderAuditLogs = () => {
    const formatAuditLog = (log) => {
      switch (log.event_type) {
        case "driver_application":
          // Get status display
          const getStatusDisplay = (status) => {
            if (status === "accept" || status === "accepted") return "Accepted";
            if (status === "reject" || status === "denied" || status === "rejected") return "Rejected";
            if (status === "pending") return "Pending";
            return status || "N/A";
          };
          return {
            type: "Driver Application",
            details: `${log.driver_username} - ${getStatusDisplay(log.status)}`,
            sponsor: log.sponsor_username || "N/A",
            driver: log.driver_username,
            status: log.status,
            reason: log.reason || "N/A",
          };
        case "point_change":
          // Show "Redeemed" if sponsor is null (driver redemption)
          const sponsorDisplay = log.sponsor_username ? log.sponsor_username : "Redeemed";
          return {
            type: "Point Change",
            details: `${log.points > 0 ? "+" : ""}${log.points} points`,
            sponsor: sponsorDisplay,
            driver: log.driver_username,
            points: log.points,
            reason: log.reason || "N/A",
          };
        case "password_change":
          // Get user type (driver/sponsor/admin) from log if available
          const userType = log.user_role || "User";
          return {
            type: "Password Change",
            details: `${log.change_type || "update"}`,
            user: log.username,
            changeType: log.change_type || "update",
            userType: userType,
          };
        case "login_attempt":
          return {
            type: "Login Attempt",
            details: log.status === "success" ? "Success" : "Failure",
            user: log.username,
            status: log.status,
          };
        default:
          return {
            type: log.event_type,
            details: "N/A",
          };
      }
    };

    return (
      <div className="panel">
        <div className="panel-header">
          <h2>Audit Log Reports</h2>
          <div className="action-group">
            <button
              onClick={loadAuditLogs}
              className="btn btn-primary"
              disabled={loadingAuditLogs}
            >
              {loadingAuditLogs ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={() => {
                const headers = ["Date", "Event Type", "User/Driver", "Sponsor", "Status/Points", "Reason/Details"];
                const rows = auditLogData.map((log) => {
                  const formatted = formatAuditLog(log);
                  return [
                    new Date(log.date).toLocaleString(),
                    formatted.type,
                    formatted.user || formatted.driver || "N/A",
                    formatted.sponsor || "N/A",
                    formatted.status || formatted.points || formatted.changeType || formatted.details,
                    formatted.reason || formatted.details || "N/A",
                  ];
                });
                const csvContent = [
                  headers.join(","),
                  ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
                ].join("\n");
                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn btn-secondary"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-grid">
            <div className="form-group">
              <label className="form-label">Event Type</label>
              <select
                className="form-input"
                value={auditLogFilter.event_type}
                onChange={(e) =>
                  setAuditLogFilter({
                    ...auditLogFilter,
                    event_type: e.target.value,
                  })
                }
              >
                <option value="all">All Events</option>
                <option value="driver_application">Driver Applications</option>
                <option value="point_change">Point Changes</option>
                <option value="password_change">Password Changes</option>
                <option value="login_attempt">Login Attempts</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={auditLogFilter.startDate}
                onChange={(e) =>
                  setAuditLogFilter({
                    ...auditLogFilter,
                    startDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={auditLogFilter.endDate}
                onChange={(e) =>
                  setAuditLogFilter({
                    ...auditLogFilter,
                    endDate: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={loadAuditLogs}
            disabled={loadingAuditLogs}
          >
            {loadingAuditLogs ? "Loading..." : "Generate Report"}
          </button>
        </div>

        {loadingAuditLogs ? (
          <div className="loading-state">
            <Activity className="w-8 h-8 animate-spin" />
            <p>Loading audit logs...</p>
          </div>
        ) : auditLogData.length === 0 ? (
          <div className="empty-state">
            <FileText className="w-12 h-12" />
            <p>No audit logs found. Adjust filters and try again.</p>
          </div>
        ) : (
          <>
            <div className="report-summary">
              <div className="summary-item">
                <span>Total Events:</span>
                <strong>{auditLogData.length}</strong>
              </div>
              <div className="summary-item">
                <span>Driver Applications:</span>
                <strong>
                  {auditLogData.filter((log) => log.event_type === "driver_application").length}
                </strong>
              </div>
              <div className="summary-item">
                <span>Point Changes:</span>
                <strong>
                  {auditLogData.filter((log) => log.event_type === "point_change").length}
                </strong>
              </div>
              <div className="summary-item">
                <span>Login Attempts:</span>
                <strong>
                  {auditLogData.filter((log) => log.event_type === "login_attempt").length}
                </strong>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event Type</th>
                    <th>User/Driver</th>
                    <th>Sponsor</th>
                    <th>Status/Points</th>
                    <th>Reason/Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogData.map((log) => {
                    const formatted = formatAuditLog(log);
                    return (
                      <tr key={log.id}>
                        <td>{new Date(log.date).toLocaleString()}</td>
                        <td>
                          <span className={`badge ${log.event_type}`}>
                            {formatted.type}
                          </span>
                        </td>
                        <td>{formatted.user || formatted.driver || "N/A"}</td>
                        <td>{formatted.sponsor || "N/A"}</td>
                        <td>
                          {formatted.status ? (
                            <span className={`badge ${formatted.status === "success" || formatted.status === "accept" || formatted.status === "accepted" ? "success" : formatted.status === "pending" ? "pending" : "failure"}`}>
                              {formatted.status === "accept" || formatted.status === "accepted" ? "Accepted" : formatted.status === "reject" || formatted.status === "rejected" || formatted.status === "denied" ? "Rejected" : formatted.status === "pending" ? "Pending" : formatted.status === "success" ? "Success" : "Failure"}
                            </span>
                          ) : formatted.points ? (
                            <span className={formatted.points > 0 ? "text-green" : "text-red"}>
                              {formatted.points > 0 ? "+" : ""}{formatted.points}
                            </span>
                          ) : formatted.changeType ? (
                            <span>
                              {formatted.changeType}
                              {formatted.userType && ` (${formatted.userType})`}
                            </span>
                          ) : (
                            formatted.details
                          )}
                        </td>
                        <td>{formatted.reason || formatted.details || "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  const generateSalesByDriverCSV = () => {
    if (salesByDriverFilter.view === "summary") {
      const headers = ["Driver", "Total Points Redeemed", "Total Redemptions", "Unique Sponsors"];
      const rows = salesByDriverData.map((item) => [
        item.driver_username,
        item.total_points_redeemed,
        item.total_redemptions,
        item.unique_sponsors,
      ]);
      return [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");
    } else {
      const headers = ["ID", "Driver", "Sponsor", "Item", "Points Redeemed", "Date"];
      const rows = salesByDriverData.map((item) => [
        item.id,
        item.driver_username,
        item.sponsor_username,
        item.item_title,
        item.points_redeemed,
        new Date(item.date).toLocaleString(),
      ]);
      return [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");
    }
  };

  const renderInvoices = () => {
    const generateInvoiceCSV = (invoice) => {
      const headers = ["Driver", "Points Redeemed", "Redemptions", "Fee"];
      const rows = invoice.drivers.map((driver) => [
        driver.driver_username,
        driver.pointsRedeemed,
        driver.redemptions,
        driver.fee.toFixed(2),
      ]);
      rows.push(["", "", "Total Fee:", invoice.totalFee.toFixed(2)]);
      return [
        `Invoice for ${invoice.sponsor_username}`,
        `Date Range: ${invoice.startDate || "All"} to ${invoice.endDate || "All"}`,
        "",
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");
    };

    return (
      <div className="content-area">
        <div className="panel">
          <div className="panel-header">
            <h2>Invoice Generation</h2>
            <div className="action-group">
              <button
                onClick={loadInvoices}
                className="btn btn-primary"
                disabled={loadingInvoices}
              >
                {loadingInvoices ? "Loading..." : "Generate Invoices"}
              </button>
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-grid">
              <div className="form-group">
                <label className="form-label">Sponsor</label>
                <select
                  className="form-input"
                  value={invoiceFilter.sponsor_username}
                  onChange={(e) =>
                    setInvoiceFilter({
                      ...invoiceFilter,
                      sponsor_username: e.target.value,
                    })
                  }
                >
                  <option value="all">All Sponsors</option>
                  {sponsors.map((s) => (
                    <option key={s.username} value={s.username}>
                      {s.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={invoiceFilter.startDate}
                  onChange={(e) =>
                    setInvoiceFilter({
                      ...invoiceFilter,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={invoiceFilter.endDate}
                  onChange={(e) =>
                    setInvoiceFilter({
                      ...invoiceFilter,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {loadingInvoices ? (
            <div className="loading-state">
              <Activity className="w-8 h-8 animate-spin" />
              <p>Generating invoices...</p>
            </div>
          ) : invoiceData.length === 0 ? (
            <div className="empty-state">
              <FileText className="w-12 h-12" />
              <p>No invoices found. Adjust filters and try again.</p>
            </div>
          ) : (
            <div className="invoice-list">
              {invoiceData.map((invoice, idx) => (
                <div key={idx} className="invoice-card">
                  <div className="invoice-header">
                    <div>
                      <h3>Invoice for {invoice.sponsor_username}</h3>
                      <p className="invoice-date-range">
                        {invoice.startDate && invoice.endDate
                          ? `${new Date(invoice.startDate).toLocaleDateString()} - ${new Date(invoice.endDate).toLocaleDateString()}`
                          : invoice.startDate
                          ? `From ${new Date(invoice.startDate).toLocaleDateString()}`
                          : invoice.endDate
                          ? `Until ${new Date(invoice.endDate).toLocaleDateString()}`
                          : "All Time"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const csvContent = generateInvoiceCSV(invoice);
                        const blob = new Blob([csvContent], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `invoice-${invoice.sponsor_username}-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      <Download className="w-4 h-4" /> Export CSV
                    </button>
                  </div>

                  <div className="invoice-summary">
                    <div className="summary-item">
                      <span>Total Points Redeemed:</span>
                      <strong>{invoice.totalPointsRedeemed.toLocaleString()}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Total Redemptions:</span>
                      <strong>{invoice.totalRedemptions.toLocaleString()}</strong>
                    </div>
                    <div className="summary-item highlight">
                      <span>Total Fee Due:</span>
                      <strong>${invoice.totalFee.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Driver</th>
                          <th>Points Redeemed</th>
                          <th>Redemptions</th>
                          <th>Fee Generated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.drivers.map((driver, driverIdx) => (
                          <tr key={driverIdx}>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar">
                                  {driver.driver_username.charAt(0).toUpperCase()}
                                </div>
                                <span className="user-name">{driver.driver_username}</span>
                              </div>
                            </td>
                            <td>{driver.pointsRedeemed.toLocaleString()}</td>
                            <td>{driver.redemptions.toLocaleString()}</td>
                            <td className="text-green">${driver.fee.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="invoice-total-row">
                          <td colSpan="3" style={{ textAlign: "right", fontWeight: 700 }}>
                            Total Fee Due:
                          </td>
                          <td className="text-green" style={{ fontWeight: 700 }}>
                            ${invoice.totalFee.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCatalog = () => (
    <div className="content-area">
      <div className="panel">
        <h2>eBay Catalog Preview</h2>
        <div className="search-bar">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search eBay..."
            className="form-input"
          />
          <button onClick={() => loadCatalog(searchTerm)} className="btn btn-primary">
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
                <a href={item.itemWebUrl} target="_blank" rel="noopener noreferrer" className="catalog-link">
                  View on eBay →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ===== Main Render =====
  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          {sidebarOpen && <h1>Admin Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "drivers", label: "Drivers", icon: Users },
            { id: "sponsors", label: "Sponsors", icon: Package },
            { id: "admins", label: "Admins", icon: Shield },
            { id: "reports", label: "Reports", icon: FileText },
            { id: "catalog", label: "Catalog", icon: ShoppingCart },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
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
            <h1 className="page-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p className="page-subtitle">Welcome back, {user?.username || "Admin"}</p>
          </div>
          <div className="header-actions">
            <button className="icon-btn">
              <AlertCircle className="w-6 h-6" />
              <span className="notification-dot"></span>
            </button>
            <div className="user-avatar large">
              {user?.username?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {activeTab === "overview" && renderOverview()}
        {activeTab === "drivers" && renderDrivers()}
        {activeTab === "sponsors" && renderSponsors()}
        {activeTab === "admins" && renderAdmins()}
        {activeTab === "reports" && renderReports()}
        {activeTab === "catalog" && renderCatalog()}
        {activeTab === "settings" && (
          <div className="content-area">
            <div className="panel">
              <h2><User className="w-5 h-5" style={{ display: "inline", marginRight: "8px" }} /> Personal Information</h2>
              
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.username || ""}
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
                  value={user?.role || ""}
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
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => {
            setShowAddUserModal(false);
            setFormError("");
            setFormSuccess("");
          }}
          newUser={newUser}
          handleInputChange={(e) => setNewUser({ ...newUser, [e.target.name]: e.target.value })}
          handleAddUser={handleAddUser}
          loading={loading}
          formError={formError}
          formSuccess={formSuccess}
          roleLabel="Driver"
        />
      )}

      {showAddSponsorModal && (
        <AddUserModal
          onClose={() => {
            setShowAddSponsorModal(false);
            setSponsorFormError("");
            setSponsorFormSuccess("");
          }}
          newUser={newSponsor}
          handleInputChange={(e) => setNewSponsor({ ...newSponsor, [e.target.name]: e.target.value })}
          handleAddUser={handleAddSponsor}
          loading={loading}
          formError={sponsorFormError}
          formSuccess={sponsorFormSuccess}
          roleLabel="Sponsor"
        />
      )}

      {showAddAdminModal && (
        <AddUserModal
          onClose={() => {
            setShowAddAdminModal(false);
            setAdminFormError("");
            setAdminFormSuccess("");
          }}
          newUser={newAdmin}
          handleInputChange={(e) => setNewAdmin({ ...newAdmin, [e.target.name]: e.target.value })}
          handleAddUser={handleAddAdmin}
          loading={loading}
          formError={adminFormError}
          formSuccess={adminFormSuccess}
          roleLabel="Admin"
        />
      )}

      {showEditUserModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit User: {editingUser?.username || "Loading..."}</h3>
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                  setEditUserForm({ email: "", newPassword: "", point_alerts_enabled: true });
                  setEditUserError("");
                  setEditUserSuccess("");
                }}
                className="modal-close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="modal-body">
              {loadingUserDetails ? (
                <div className="loading-state">
                  <Activity className="w-8 h-8 animate-spin" />
                  <p>Loading user details...</p>
                </div>
              ) : !editingUser ? (
                <div className="empty-state">
                  <p>No user data available</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingUser.username || ""}
                      disabled
                      style={{ background: "#f5f5f5", cursor: "not-allowed" }}
                    />
                    <p className="form-help">Username cannot be changed</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingUser.role || ""}
                      disabled
                      style={{ background: "#f5f5f5", cursor: "not-allowed" }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editUserForm.email}
                      onChange={(e) =>
                        setEditUserForm({ ...editUserForm, email: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      className="form-input"
                      value={editUserForm.newPassword}
                      onChange={(e) =>
                        setEditUserForm({ ...editUserForm, newPassword: e.target.value })
                      }
                      disabled={loading}
                      placeholder="Enter new password (min 8 characters)"
                    />
                    <p className="form-help">Only enter if you want to reset the password</p>
                  </div>

                  {editingUser.role === "driver" && (
                    <div className="form-group">
                      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="checkbox"
                          checked={editUserForm.point_alerts_enabled}
                          onChange={(e) =>
                            setEditUserForm({ ...editUserForm, point_alerts_enabled: e.target.checked })
                          }
                          disabled={loading}
                        />
                        Point Alerts Enabled
                      </label>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Account Information</label>
                    <div style={{ background: "#f9fafb", padding: "12px", borderRadius: "8px", fontSize: "14px" }}>
                      <p><strong>Created:</strong> {editingUser.created_at ? new Date(editingUser.created_at).toLocaleString() : "N/A"}</p>
                      <p><strong>Last Login:</strong> {editingUser.last_login ? new Date(editingUser.last_login).toLocaleString() : "Never"}</p>
                      {editingUser.failed_attempts > 0 && (
                        <p style={{ color: "#dc2626" }}>
                          <strong>Failed Attempts:</strong> {editingUser.failed_attempts}
                        </p>
                      )}
                      {editingUser.locked_until && new Date(editingUser.locked_until) > new Date() && (
                        <div style={{ marginTop: "8px" }}>
                          <p style={{ color: "#dc2626" }}>
                            <strong>Account Locked Until:</strong> {new Date(editingUser.locked_until).toLocaleString()}
                          </p>
                          <button
                            onClick={handleUnlockAccount}
                            className="btn btn-secondary btn-sm"
                            style={{ marginTop: "8px" }}
                            disabled={loading}
                          >
                            Unlock Account
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {editUserError && (
                    <div className="alert alert-error">
                      <XCircle className="w-5 h-5" />
                      <p>{editUserError}</p>
                    </div>
                  )}

                  {editUserSuccess && (
                    <div className="alert alert-success">
                      <CheckCircle className="w-5 h-5" />
                      <p>{editUserSuccess}</p>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button
                      onClick={() => {
                        setShowEditUserModal(false);
                        setEditingUser(null);
                        setEditUserForm({ email: "", newPassword: "", point_alerts_enabled: true });
                        setEditUserError("");
                        setEditUserSuccess("");
                      }}
                      className="btn btn-secondary"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateUser}
                      className="btn btn-primary"
                      disabled={loading || !editingUser}
                    >
                      {loading ? "Updating..." : "Update User"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .admin-dashboard {
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
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 15px;
          font-weight: 500;
          white-space: nowrap;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-item.active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .sidebar-footer {
          padding: 20px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          width: 100%;
          background: rgba(239, 68, 68, 0.1);
          border: none;
          color: #fca5a5;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 15px;
          font-weight: 500;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          flex: 1;
          overflow-y: auto;
        }

        .page-header {
          background: white;
          padding: 24px 32px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-btn {
          background: #f3f4f6;
          border: none;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: #e5e7eb;
        }

        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 16px;
        }

        .user-avatar.large {
          width: 44px;
          height: 44px;
        }

        .user-avatar.sponsor {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        /* ===== CONTENT AREA ===== */
        .content-area {
          padding: 32px;
          max-width: 1400px;
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
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          color: #3b82f6;
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
          margin-bottom: 4px;
        }

        .stats-trend {
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stats-trend.trend-up { color: #10b981; }
        .stats-trend.trend-down { color: #ef4444; }

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

        .btn-ghost {
          background: transparent;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .btn-ghost:hover:not(:disabled) {
          background: #f9fafb;
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
        }

        .data-table th {
          background: #f9fafb;
          padding: 14px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .data-table td {
          padding: 16px;
          border-top: 1px solid #f3f4f6;
          color: #374151;
        }

        .data-table tbody tr {
          transition: background 0.15s;
        }

        .data-table tbody tr:hover {
          background: #f9fafb;
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
        }

        /* ===== TRANSACTION LIST ===== */
        .transaction-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .transaction-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .transaction-item:hover {
          background: #f3f4f6;
        }

        .transaction-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .transaction-icon.award {
          background: #dcfce7;
          color: #16a34a;
        }

        .transaction-icon.redeem {
          background: #dbeafe;
          color: #2563eb;
        }

        .transaction-details {
          flex: 1;
        }

        .transaction-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .transaction-meta {
          font-size: 13px;
          color: #6b7280;
        }

        .transaction-badge {
          padding: 6px 14px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
        }

        .transaction-badge.award {
          background: #dcfce7;
          color: #16a34a;
        }

        .transaction-badge.redeem {
          background: #fee2e2;
          color: #dc2626;
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
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-help {
          font-size: 12px;
          color: #6b7280;
          margin-top: 6px;
        }

        .search-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .search-bar .form-input {
          flex: 1;
        }

        /* ===== REPORT TABS ===== */
        .report-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e5e7eb;
        }

        .report-tab {
          padding: 12px 24px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #6b7280;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: -2px;
        }

        .report-tab:hover {
          color: #3b82f6;
        }

        .report-tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        /* ===== INVOICES ===== */
        .invoice-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .invoice-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }

        .invoice-header h3 {
          font-size: 22px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .invoice-date-range {
          color: #6b7280;
          font-size: 14px;
        }

        .invoice-summary {
          display: flex;
          gap: 32px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .invoice-summary .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .invoice-summary .summary-item.highlight {
          margin-left: auto;
          padding-left: 32px;
          border-left: 2px solid #3b82f6;
        }

        .invoice-summary .summary-item.highlight strong {
          font-size: 24px;
          color: #3b82f6;
        }

        .invoice-total-row {
          background: #f9fafb;
          border-top: 2px solid #e5e7eb;
        }

        /* ===== FILTERS ===== */
        .filter-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .report-summary {
          display: flex;
          gap: 32px;
          padding: 20px;
          background: #eff6ff;
          border-radius: 12px;
          margin-bottom: 24px;
          border: 1px solid #dbeafe;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-item span {
          color: #6b7280;
          font-size: 13px;
        }

        .summary-item strong {
          font-size: 20px;
          color: #1f2937;
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

        .badge.award {
          background: #dcfce7;
          color: #16a34a;
        }

        .badge.redeem {
          background: #dbeafe;
          color: #2563eb;
        }

        .badge.driver_application {
          background: #fef3c7;
          color: #d97706;
        }

        .badge.point_change {
          background: #dbeafe;
          color: #2563eb;
        }

        .badge.password_change {
          background: #e0e7ff;
          color: #6366f1;
        }

        .badge.login_attempt {
          background: #f3e8ff;
          color: #9333ea;
        }

        .badge.success {
          background: #dcfce7;
          color: #16a34a;
        }

        .badge.failure {
          background: #fee2e2;
          color: #dc2626;
        }

        .text-green { color: #16a34a; font-weight: 600; }
        .text-red { color: #dc2626; font-weight: 600; }

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

        .catalog-link {
          display: block;
          text-align: center;
          color: #3b82f6;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
        }

        .catalog-link:hover {
          text-decoration: underline;
        }

        /* ===== MODALS ===== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }

        .modal-close {
          background: #f3f4f6;
          border: none;
          color: #6b7280;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #e5e7eb;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-actions .btn {
          flex: 1;
        }

        /* ===== ALERTS ===== */
        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          margin-top: 16px;
        }

        .alert p {
          font-size: 14px;
          font-weight: 500;
        }

        .alert-error {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .alert-success {
          background: #dcfce7;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        /* ===== EMPTY & LOADING STATES ===== */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #9ca3af;
        }

        .empty-state svg {
          margin: 0 auto 16px;
          opacity: 0.5;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .loading-state svg {
          margin: 0 auto 16px;
          color: #3b82f6;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .w-4 { width: 1rem; height: 1rem; }
        .w-5 { width: 1.25rem; height: 1.25rem; }
        .w-6 { width: 1.5rem; height: 1.5rem; }
        .w-8 { width: 2rem; height: 2rem; }
        .w-12 { width: 3rem; height: 3rem; }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .sidebar.open { width: 100%; position: fixed; z-index: 99; }
          .sidebar.closed { width: 0; }
          
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .content-area {
            padding: 20px 16px;
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .report-summary {
            flex-direction: column;
            gap: 16px;
          }

          .action-group {
            flex-direction: column;
            width: 100%;
          }

          .action-group .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}