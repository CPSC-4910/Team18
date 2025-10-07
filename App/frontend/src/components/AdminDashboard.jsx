import React, { useState, useEffect } from "react";
import { Users, Package, Award, Activity, Settings, LogOut, Menu, X, TrendingUp, AlertCircle, ShoppingCart, UserPlus, CheckCircle, XCircle } from "lucide-react";

// ✨ FINAL FIX 1 of 2: The AddUserModal component is now defined OUTSIDE of AdminDashboard.
// It is a standalone component that receives all the data it needs as props.
const AddUserModal = ({ 
  onClose, 
  newUser, 
  handleInputChange, 
  handleAddUser, 
  loading, 
  formError, 
  formSuccess 
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Add New Driver</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={newUser.email}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="driver@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={newUser.password}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Min. 8 characters"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
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
            {loading ? "Creating..." : "Create Driver"}
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
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    if (activeTab === "drivers") {
      fetchDrivers();
    }
  }, [activeTab]);

  const fetchDrivers = async () => {
    try {
      // 1. Correct URL
      const response = await fetch("/api/drivers");

      if (response.ok) {
        const data = await response.json();
        // 2. Correct data access
        setDrivers(data.drivers);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleAddUser = async () => {
    setFormError("");
    setFormSuccess("");

    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      setFormError("All fields are required");
      return;
    }
    if (newUser.password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      setFormError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (response.ok) {
        setFormSuccess(`User ${data.user.username} created successfully!`);
        setDrivers(prevDrivers => [...prevDrivers, data.user]);
        setNewUser({ username: "", email: "", password: "" });
        
        setTimeout(() => {
          setShowAddUserModal(false);
          setFormSuccess("");
        }, 1500);
      } else {
        setFormError(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setFormError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total Drivers", value: "1,234", change: "+12%", color: "bg-blue-500", icon: Users },
    { label: "Active Sponsors", value: "45", change: "+8%", color: "bg-green-500", icon: Package },
    { label: "Points Awarded", value: "892K", change: "+23%", color: "bg-purple-500", icon: Award },
    { label: "Redemptions", value: "3,421", change: "+15%", color: "bg-orange-500", icon: ShoppingCart }
  ];

  const recentActivity = [
    { id: 1, user: "John Doe", action: "Redeemed 5,000 points for Amazon Gift Card", time: "2 minutes ago", type: "redemption" },
    { id: 2, user: "Jane Smith", action: "Earned 1,200 points for safe driving", time: "15 minutes ago", type: "points" },
    { id: 3, user: "Mike Johnson", action: "New driver registration", time: "1 hour ago", type: "signup" }
  ];

  // The AddUserModal definition has been removed from here.

  const renderOverview = () => (
    <div className="space-y-6">
      {/* ... overview JSX is unchanged ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-green-600 font-medium mt-2">{stat.change} from last month</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'redemption' ? 'bg-orange-100' : activity.type === 'points' ? 'bg-purple-100' : 'bg-green-100'}`}>
                <Activity className={`w-5 h-5 ${activity.type === 'redemption' ? 'text-orange-600' : activity.type === 'points' ? 'text-purple-600' : 'text-green-600'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                <p className="text-sm text-gray-600">{activity.action}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDrivers = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Driver Management</h2>
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Driver
            </button>
          </div>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search drivers by name or email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.length > 0 ? (
                drivers.map((driver) => (
                  <tr key={driver.username} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {(driver.name?.charAt(0) || driver.username?.charAt(0) || 'U').toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{driver.name || driver.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{driver.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No drivers found. Add your first driver to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* ✨ FINAL FIX 2 of 2: The modal is now called here with all the necessary props passed to it. */}
      {showAddUserModal && (
        <AddUserModal 
          onClose={() => {
              setShowAddUserModal(false);
              setFormError("");
              setFormSuccess("");
              setNewUser({ username: "", email: "", password: "" });
            }}
          newUser={newUser}
          handleInputChange={handleInputChange}
          handleAddUser={handleAddUser}
          loading={loading}
          formError={formError}
          formSuccess={formSuccess}
        />
      )}
    </div>
  );

  const renderSponsors = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Sponsor Management</h2>
      <p className="text-gray-600">Sponsor management coming soon...</p>
    </div>
  );

  const renderReports = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Reports & Analytics</h2>
      <p className="text-gray-600">Reports coming soon...</p>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">System Settings</h2>
      <p className="text-gray-600">Settings coming soon...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* ... aside JSX is unchanged ... */}
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
            { id: "reports", label: "Reports", icon: TrendingUp },
            { id: "settings", label: "Settings", icon: Settings }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
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

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          {/* ... header JSX is unchanged ... */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {user?.username || 'Admin'}</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <AlertCircle className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold">{user?.username?.charAt(0).toUpperCase() || 'A'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "drivers" && renderDrivers()}
          {activeTab === "sponsors" && renderSponsors()}
          {activeTab === "reports" && renderReports()}
          {activeTab === "settings" && renderSettings()}
        </div>
      </main>
    </div>
  );
}