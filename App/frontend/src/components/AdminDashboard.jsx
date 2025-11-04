import React, { useState, useEffect } from "react";
import {
  Users,
  Package,
  Award,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  AlertCircle,
  ShoppingCart,
  UserPlus,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";

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
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Add New {roleLabel}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={newUser.username}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g. jdoe"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={newUser.email}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`${roleLabel.toLowerCase()}@example.com`}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={newUser.password}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Min. 8 characters"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 8 characters long
          </p>
        </div>

        {formError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{formError}</p>
          </div>
        )}

        {formSuccess && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-600">{formSuccess}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleAddUser}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default function AdminDashboard({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "" });
  const [newSponsor, setNewSponsor] = useState({ username: "", email: "", password: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [sponsorFormError, setSponsorFormError] = useState("");
  const [sponsorFormSuccess, setSponsorFormSuccess] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("truck");

  // ===== Loaders =====
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

  // ===== Delete User =====
  const handleDeleteUser = async (username, role) => {
    if (!confirm(`Are you sure you want to delete ${role} '${username}'?`)) return;
    try {
      const response = await fetch(`/api/users/${username}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete user");
      if (role === "driver") {
        setDrivers((prev) => prev.filter((u) => u.username !== username));
      } else {
        setSponsors((prev) => prev.filter((u) => u.username !== username));
      }
      alert(`✅ ${role} '${username}' deleted successfully.`);
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  // ===== Create Driver =====
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
        setTimeout(() => setShowAddUserModal(false), 1200);
        setNewUser({ username: "", email: "", password: "" });
      } else {
        setFormError(data.error || "Failed to create driver");
      }
    } catch (err) {
      setFormError("Server error");
    } finally {
      setLoading(false);
    }
  };

  // ===== Create Sponsor =====
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
        setTimeout(() => setShowAddSponsorModal(false), 1200);
        setNewSponsor({ username: "", email: "", password: "" });
      } else {
        setSponsorFormError(data.error || "Failed to create sponsor");
      }
    } catch (err) {
      setSponsorFormError("Server error");
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

  useEffect(() => {
    if (activeTab === "catalog") loadCatalog(searchTerm);
    if (activeTab === "drivers") fetchDrivers();
    if (activeTab === "sponsors") fetchSponsors();
  }, [activeTab]);

  // ===== Drivers Tab =====
  const renderDrivers = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Drivers</h2>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5" /> Add Driver
        </button>
      </div>
      {drivers.length === 0 ? (
        <p className="text-gray-500">No drivers found.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {drivers.map((d) => (
            <li key={d.username} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">{d.username}</p>
                <p className="text-sm text-gray-500">{d.email}</p>
              </div>
              <button
                onClick={() => handleDeleteUser(d.username, "driver")}
                className="text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // ===== Sponsors Tab =====
  const renderSponsors = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Sponsors</h2>
        <button
          onClick={() => setShowAddSponsorModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <UserPlus className="w-5 h-5" /> Add Sponsor
        </button>
      </div>
      {sponsors.length === 0 ? (
        <p className="text-gray-500">No sponsors found.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {sponsors.map((s) => (
            <li key={s.username} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">{s.username}</p>
                <p className="text-sm text-gray-500">{s.email}</p>
              </div>
              <button
                onClick={() => handleDeleteUser(s.username, "sponsor")}
                className="text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // ===== Catalog Tab =====
  const renderCatalog = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">eBay Catalog</h2>
        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search eBay..."
            className="flex-grow border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => loadCatalog(searchTerm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Search
          </button>
        </div>
        {loadingCatalog ? (
          <p>Loading eBay items...</p>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
            {catalog.map((item) => (
              <div key={item.itemId} className="card border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                <img src={item.image?.imageUrl} alt={item.title} className="w-full h-48 object-cover rounded-lg" />
                <h3 className="text-md font-semibold mt-2 line-clamp-2">{item.title}</h3>
                <p className="text-gray-700 font-medium">${item.price?.value} {item.price?.currency}</p>
                <a href={item.itemWebUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View on eBay →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ===== Layout =====
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && <h1 className="font-bold text-xl text-gray-900">Admin Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "drivers", label: "Drivers", icon: Users },
            { id: "sponsors", label: "Sponsors", icon: Package },
            { id: "catalog", label: "Catalog", icon: ShoppingCart },
            { id: "reports", label: "Reports", icon: TrendingUp },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {user?.username || "Admin"}</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <AlertCircle className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.username?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === "overview" && <p>Overview content here</p>}
          {activeTab === "drivers" && renderDrivers()}
          {activeTab === "sponsors" && renderSponsors()}
          {activeTab === "catalog" && renderCatalog()}
          {activeTab === "reports" && <p>Reports coming soon...</p>}
          {activeTab === "settings" && <p>Settings coming soon...</p>}
        </div>
      </main>

      {/* Modals */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
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
          onClose={() => setShowAddSponsorModal(false)}
          newUser={newSponsor}
          handleInputChange={(e) => setNewSponsor({ ...newSponsor, [e.target.name]: e.target.value })}
          handleAddUser={handleAddSponsor}
          loading={loading}
          formError={sponsorFormError}
          formSuccess={sponsorFormSuccess}
          roleLabel="Sponsor"
        />
      )}
    </div>
  );
}
