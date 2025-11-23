// App/frontend/src/components/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { 
  Users, Package, Award, Activity, Settings, LogOut, Menu, X, 
  TrendingUp, AlertCircle, ShoppingCart, UserPlus, CheckCircle, 
  XCircle, Trash2, Download, FileText 
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
  
  // Data states
  const [drivers, setDrivers] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "" });
  const [newSponsor, setNewSponsor] = useState({ username: "", email: "", password: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [sponsorFormError, setSponsorFormError] = useState("");
  const [sponsorFormSuccess, setSponsorFormSuccess] = useState("");
  
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
    if (activeTab === "reports") loadAllTransactions();
    if (activeTab === "catalog") loadCatalog(searchTerm);
  }, [activeTab]);

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
      } else {
        setSponsors((prev) => prev.filter((u) => u.username !== username));
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
                      <button
                        onClick={() => handleDeleteUser(d.username, "driver")}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
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
                      <button
                        onClick={() => handleDeleteUser(s.username, "sponsor")}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
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
        {activeTab === "reports" && renderReports()}
        {activeTab === "catalog" && renderCatalog()}
        {activeTab === "settings" && (
          <div className="content-area">
            <div className="panel">
              <h2>Settings</h2>
              <p>Settings panel coming soon...</p>
            </div>
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