// App/frontend/src/components/DriverView.jsx

import React, { useEffect, useState } from "react";
import { Users, User, Lock, Archive, ShoppingCart, Package, Award, Menu, X, LogOut, Activity, TrendingUp, CheckCircle, XCircle, AlertCircle, Bell, Receipt, XCircle as XCircleIcon, Edit, Trash2, Shield } from "lucide-react";

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

export default function DriverView({ user, onLogout, isAssumedBySponsor = false, actualSponsor = null }) {
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

  // Cart Management
  const [cart, setCart] = useState([]); // [{item_id, quantity, item}]
  const [cartOrg, setCartOrg] = useState(null); // Organization for current cart

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

  // Order Alerts
  const [orderAlerts, setOrderAlerts] = useState([]);
  const [loadingOrderAlerts, setLoadingOrderAlerts] = useState(false);
  const [orderAlertsEnabled, setOrderAlertsEnabled] = useState(true);

  // Orders (purchases)
  const [purchases, setPurchases] = useState([]); // Now stores orders
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [showUpdateOrderModal, setShowUpdateOrderModal] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [orderUpdateItems, setOrderUpdateItems] = useState([]); // Items to add to order

  useEffect(() => {
    loadOrganizations();
    loadMyApplications();
    loadMyMemberships();
    loadAlerts();
    loadPointAlerts();
    loadPointAlertsPreference();
    loadOrderAlerts();
    loadOrderAlertsPreference();
    setEditEmail(user.email || "");
  }, [user?.username]);

  useEffect(() => {
    if (view === "purchases") {
      loadPurchases();
    }
  }, [view]);

  // Reload alerts when view changes to dashboard
  useEffect(() => {
    if (view === "dashboard") {
      loadAlerts();
      loadPointAlerts();
      loadOrderAlerts();
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

  // Load Order Alerts
  async function loadOrderAlerts() {
    setLoadingOrderAlerts(true);
    try {
      const res = await fetch(`/api/driver/order-alerts/${user.username}`);
      if (res.ok) {
        const data = await res.json();
        setOrderAlerts(data || []);
      }
    } catch (err) {
      console.error("Failed to load order alerts:", err);
    } finally {
      setLoadingOrderAlerts(false);
    }
  }

  // Load order alerts preference
  async function loadOrderAlertsPreference() {
    try {
      const res = await fetch(`/api/driver/order-alerts-preference/${user.username}`);
      if (res.ok) {
        const data = await res.json();
        setOrderAlertsEnabled(data.order_alerts_enabled ?? true);
      }
    } catch (err) {
      console.error("Failed to load order alerts preference:", err);
    }
  }

  // Mark order alert as read
  async function markOrderAlertAsRead(alertId) {
    try {
      const res = await fetch(`/api/driver/order-alerts/${alertId}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        setOrderAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        ));
      }
    } catch (err) {
      console.error("Failed to mark order alert as read:", err);
    }
  }

  // Toggle order alerts preference
  async function toggleOrderAlertsPreference() {
    const newValue = !orderAlertsEnabled;
    try {
      const res = await fetch(`/api/driver/order-alerts-preference/${user.username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_alerts_enabled: newValue }),
      });
      if (res.ok) {
        setOrderAlertsEnabled(newValue);
      } else {
        alert("Failed to update preference");
      }
    } catch (err) {
      console.error("Failed to update order alerts preference:", err);
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
  // Cart Management
  // ------------------------------------------------------------
  function addToCart(item) {
    if (!catalogOrg) {
      alert("Please select an organization first");
      return;
    }

    // If cart is for a different organization, clear it first
    if (cartOrg && cartOrg.id !== catalogOrg.id) {
      if (!confirm("Your cart contains items from a different organization. Clear cart and add this item?")) {
        return;
      }
      setCart([]);
      setCartOrg(null);
    }

    // Set cart organization if not set
    if (!cartOrg) {
      setCartOrg(catalogOrg);
    }

    // Check if item already in cart
    const existingIndex = cart.findIndex(cartItem => cartItem.item_id === item.id);
    
    if (existingIndex >= 0) {
      // Increase quantity
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      // Add new item - make sure to store a copy of the item object
      setCart([...cart, {
        item_id: item.id,
        quantity: 1,
        item: { ...item } // Create a copy to avoid reference issues
      }]);
    }
  }

  function removeFromCart(itemId) {
    setCart(cart.filter(item => item.item_id !== itemId));
    if (cart.length === 1) {
      setCartOrg(null);
    }
  }

  function updateCartQuantity(itemId, quantity) {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const newCart = cart.map(item => 
      item.item_id === itemId ? { ...item, quantity: quantity } : item
    );
    setCart(newCart);
  }

  function clearCart() {
    setCart([]);
    setCartOrg(null);
  }

  function getCartTotal() {
    if (!cart || cart.length === 0) return 0;
    try {
      return cart.reduce((total, cartItem) => {
        if (!cartItem || !cartItem.item) return total;
        const pointsCost = cartItem.item.points_cost || 0;
        const quantity = cartItem.quantity || 1;
        return total + (pointsCost * quantity);
      }, 0);
    } catch (err) {
      console.error("Error calculating cart total:", err);
      return 0;
    }
  }

  // ------------------------------------------------------------
  // Checkout Cart
  // ------------------------------------------------------------
  async function checkoutCart() {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const totalPoints = getCartTotal();
    const availablePoints = membershipPoints[cartOrg.id] || 0;

    if (availablePoints < totalPoints) {
      alert(`Insufficient points. You need ${totalPoints} points but only have ${availablePoints}.`);
      return;
    }

    if (!confirm(`Checkout ${cart.length} item(s) for ${totalPoints} points?`)) {
      return;
    }

    try {
      const res = await fetch("/api/points/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_username: user.username,
          organization_id: cartOrg.id,
          items: cart.map(cartItem => ({
            item_id: cartItem.item_id,
            quantity: cartItem.quantity
          }))
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✓ ${data.message || "Order placed successfully!"}`);
        clearCart();
        loadMyMemberships(); // Refresh points
        // Always reload purchases to show the new order
        loadPurchases();
        loadOrderAlerts(); // Reload order alerts to show the new alert
      } else {
        alert(`✗ ${data.error || "Failed to checkout order"}`);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("✗ Server error");
    }
  }

  // -------- PURCHASE MANAGEMENT --------
  async function loadPurchases() {
    setLoadingPurchases(true);
    setPurchaseMessage("");
    try {
      const res = await fetch(`/api/driver/orders/${user.username}`);
      
      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        setPurchaseMessage(`Server error: Received non-JSON response (${res.status})`);
        return;
      }
      
      const data = await res.json();
      if (res.ok) {
        setPurchases(data || []);
      } else {
        setPurchaseMessage(data.error || data.details || "Failed to load orders");
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      setPurchaseMessage(`Server error: ${err.message}`);
    } finally {
      setLoadingPurchases(false);
    }
  }

  async function cancelPurchase(orderId) {
    if (!confirm("Are you sure you want to cancel this order? Your points will be refunded.")) {
      return;
    }

    setLoadingPurchases(true);
    setPurchaseMessage("");
    try {
      const res = await fetch(`/api/driver/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setPurchaseMessage(`✓ ${data.message || "Purchase cancelled and points refunded"}`);
        await loadPurchases();
        await loadMyMemberships(); // Refresh points
      } else {
        setPurchaseMessage(`✗ ${data.error || "Failed to cancel purchase"}`);
      }
    } catch (err) {
      console.error("Failed to cancel purchase:", err);
      setPurchaseMessage("✗ Server error");
    } finally {
      setLoadingPurchases(false);
    }
  }

  // -------- ORDER UPDATE --------
  async function openUpdateOrderModal(order) {
    if (order.status === "cancelled") {
      setPurchaseMessage("✗ Cannot update a cancelled order");
      return;
    }

    setUpdatingOrder(order);
    setOrderUpdateItems([]);
    setPurchaseMessage("");

    // Load catalog items for the order's organization
    try {
      const res = await fetch(`/api/organizations/catalog/${order.organization_id}`);
      if (!res.ok) {
        throw new Error("Failed to load catalog items");
      }
      const data = await res.json();
      // Show all items in the catalog (not filtering out items already in the order)
      setOrderUpdateItems(data || []);
      setShowUpdateOrderModal(true);
    } catch (err) {
      console.error("Failed to load catalog for order update:", err);
      setPurchaseMessage(`✗ ${err.message || "Failed to load items"}`);
    }
  }

  async function updateOrder(itemsToAdd) {
    if (!updatingOrder || !itemsToAdd || itemsToAdd.length === 0) {
      setPurchaseMessage("✗ Please select at least one item to add");
      return;
    }

    setLoadingPurchases(true);
    setPurchaseMessage("");

    try {
      const res = await fetch(`/api/driver/orders/${updatingOrder.order_id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToAdd.map(item => ({
            item_id: item.id, // Catalog items use 'id' property
            quantity: item.quantity || 1
          }))
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPurchaseMessage(`✓ ${data.message || "Order updated successfully!"}`);
        setShowUpdateOrderModal(false);
        setUpdatingOrder(null);
        setOrderUpdateItems([]);
        await loadPurchases();
        await loadMyMemberships(); // Refresh points
      } else {
        setPurchaseMessage(`✗ ${data.error || "Failed to update order"}`);
      }
    } catch (err) {
      console.error("Failed to update order:", err);
      setPurchaseMessage("✗ Server error");
    } finally {
      setLoadingPurchases(false);
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
            { id: "cart", label: `Cart${cart.length > 0 ? ` (${cart.length})` : ""}`, icon: ShoppingCart },
            { id: "purchases", label: "My Purchases", icon: Receipt },
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
        {/* Sponsor Assumption Banner */}
        {isAssumedBySponsor && actualSponsor && (
          <div style={{
            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
            border: "2px solid #f59e0b",
            borderRadius: "12px",
            padding: "16px 24px",
            margin: "0 32px 24px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Shield className="w-6 h-6" style={{ color: "#d97706" }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: "#92400e", fontSize: "16px" }}>
                  Sponsor Control Active
                </p>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#78350f" }}>
                  You are viewing and controlling <strong>{user.username}</strong>'s account as sponsor <strong>{actualSponsor.username}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="btn btn-secondary"
              style={{ background: "white", border: "2px solid #f59e0b" }}
            >
              <X className="w-4 h-4" /> Stop Assuming
            </button>
          </div>
        )}
          <div>
            <h1 className="page-title">
              {view === "dashboard" ? "Dashboard" : 
               view === "history" ? "Application History" :
               view === "catalog" ? `${catalogOrg?.name || "Catalog"}` :
               view === "purchases" ? "My Purchases" :
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

              {/* Order Alerts Section - Only shown if enabled */}
              {orderAlertsEnabled && orderAlerts.filter(a => !a.is_read).length > 0 && (
                <div className="panel" style={{ 
                  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  border: "2px solid #f59e0b",
                  marginBottom: "24px"
                }}>
                  <div className="panel-header" style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Package className="w-5 h-5" style={{ color: "#d97706" }} />
                      <h2 style={{ color: "#92400e", margin: 0 }}>Order Placed</h2>
                      <span style={{ 
                        background: "#f59e0b", 
                        color: "white", 
                        padding: "2px 8px", 
                        borderRadius: "12px", 
                        fontSize: "12px",
                        fontWeight: 600,
                        marginLeft: "8px"
                      }}>
                        {orderAlerts.filter(a => !a.is_read).length}
                      </span>
                    </div>
                  </div>
                  <div className="alerts-list">
                    {orderAlerts.filter(a => !a.is_read).map((alert) => (
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
                              <Package className="w-5 h-5" style={{ color: "#f59e0b", flexShrink: 0 }} />
                              <h3 style={{ margin: 0, color: "#92400e", fontSize: "16px", fontWeight: 600 }}>
                                Order #{alert.order_id} - {alert.total_points} points
                              </h3>
                            </div>
                            <p style={{ margin: 0, color: "#78350f", fontSize: "14px", lineHeight: "1.5", marginLeft: "28px" }}>
                              <strong>Organization:</strong> {alert.organization_name}
                            </p>
                            <p style={{ margin: "4px 0 0 28px", color: "#78350f", fontSize: "14px", lineHeight: "1.5" }}>
                              <strong>Items ({alert.item_count}):</strong> {alert.order_summary || "N/A"}
                            </p>
                            <p style={{ margin: "8px 0 0 28px", color: "#f59e0b", fontSize: "12px" }}>
                              {new Date(alert.created_at).toLocaleString()}
                            </p>
                          </div>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => markOrderAlertAsRead(alert.id)}
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
                        onClick={() => addToCart(item)}
                        disabled={membershipPoints[catalogOrg?.id] < item.points_cost}
                      >
                        {membershipPoints[catalogOrg?.id] < item.points_cost ? "Insufficient Points" : "Add to Cart"}
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

          {view === "cart" && (
            <div className="panel">
              <h2>Shopping Cart</h2>
              {!cart || cart.length === 0 ? (
                <div className="empty-state">
                  <ShoppingCart className="w-12 h-12" />
                  <p>Your cart is empty. Add items from the catalog!</p>
                  <button
                    onClick={() => setView("catalog")}
                    className="btn btn-primary"
                    style={{ marginTop: "20px" }}
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: "24px" }}>
                    <p style={{ color: "#6b7280", marginBottom: "16px" }}>
                      Organization: <strong>{cartOrg?.name || "Unknown"}</strong>
                    </p>
                    <p style={{ color: "#6b7280" }}>
                      Available Points: <strong style={{ color: "#10b981" }}>
                        {membershipPoints[cartOrg?.id] || 0} pts
                      </strong>
                    </p>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Points Each</th>
                          <th>Quantity</th>
                          <th>Subtotal</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.filter(cartItem => cartItem && cartItem.item_id).map((cartItem) => {
                          if (!cartItem || !cartItem.item) {
                            return (
                              <tr key={cartItem?.item_id || Math.random()}>
                                <td colSpan={5} style={{ color: "#9ca3af", textAlign: "center" }}>
                                  Item no longer available
                                </td>
                              </tr>
                            );
                          }
                          const pointsCost = cartItem.item.points_cost || 0;
                          const quantity = cartItem.quantity || 1;
                          return (
                            <tr key={cartItem.item_id}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  {cartItem.item.image_url && (
                                    <img 
                                      src={cartItem.item.image_url} 
                                      alt={cartItem.item.title || "Item"}
                                      style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px" }}
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{cartItem.item.title || "Unknown Item"}</div>
                                    {cartItem.item.price && (
                                      <div style={{ fontSize: "14px", color: "#6b7280" }}>
                                        ${cartItem.item.price} {cartItem.item.currency || ""}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="text-green">{pointsCost} pts</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <button
                                    onClick={() => updateCartQuantity(cartItem.item_id, quantity - 1)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ minWidth: "32px", padding: "4px 8px" }}
                                  >
                                    -
                                  </button>
                                  <span style={{ minWidth: "40px", textAlign: "center", fontWeight: 600 }}>
                                    {quantity}
                                  </span>
                                  <button
                                    onClick={() => updateCartQuantity(cartItem.item_id, quantity + 1)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ minWidth: "32px", padding: "4px 8px" }}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="text-green" style={{ fontWeight: 600 }}>
                                {pointsCost * quantity} pts
                              </td>
                              <td>
                                <button
                                  onClick={() => removeFromCart(cartItem.item_id)}
                                  className="btn btn-danger btn-sm"
                                  title="Remove from cart"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ 
                    marginTop: "24px", 
                    padding: "20px", 
                    background: "#f3f4f6", 
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>Total</div>
                      <div style={{ fontSize: "24px", fontWeight: 700, color: "#1f2937" }}>
                        {getCartTotal()} points
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        onClick={clearCart}
                        className="btn btn-secondary"
                      >
                        Clear Cart
                      </button>
                      <button
                        onClick={checkoutCart}
                        className="btn btn-primary"
                        disabled={getCartTotal() > (membershipPoints[cartOrg?.id] || 0)}
                      >
                        Checkout
                      </button>
                    </div>
                  </div>
                  {getCartTotal() > (membershipPoints[cartOrg?.id] || 0) && (
                    <div className="alert alert-error" style={{ marginTop: "16px" }}>
                      <XCircle className="w-5 h-5" />
                      <p>Insufficient points. You need {getCartTotal()} points but only have {membershipPoints[cartOrg?.id] || 0}.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {view === "purchases" && (
            <div className="panel">
              <h2>My Orders</h2>
              {purchaseMessage && (
                <div className={`alert ${purchaseMessage.includes("✓") ? "alert-success" : "alert-error"}`}>
                  {purchaseMessage.includes("✓") ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  <p>{purchaseMessage}</p>
                </div>
              )}
              {loadingPurchases ? (
                <div className="loading-state">
                  <Activity className="w-8 h-8 animate-spin" />
                  <p>Loading orders...</p>
                </div>
              ) : purchases.length === 0 ? (
                <div className="empty-state">
                  <Package className="w-12 h-12" />
                  <p>No orders yet. Add items to your cart and checkout!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {purchases.map((order) => (
                    <div key={order.id} style={{ 
                      border: "1px solid #e5e7eb", 
                      borderRadius: "12px", 
                      padding: "20px",
                      background: "white"
                    }}>
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        marginBottom: "16px",
                        paddingBottom: "16px",
                        borderBottom: "1px solid #e5e7eb"
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "4px" }}>
                            Order #{order.order_id}
                          </div>
                          <div style={{ fontSize: "14px", color: "#6b7280" }}>
                            {order.organization_name || "Unknown Organization"} • {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>Total</div>
                          <div style={{ fontSize: "20px", fontWeight: 700, color: "#10b981" }}>
                            {order.total_points} pts
                          </div>
                          <span className={`badge ${
                            order.status === "completed" ? "accepted" :
                            order.status === "pending" ? "pending" :
                            "denied"
                          }`} style={{ marginTop: "8px", display: "inline-block" }}>
                            {order.status || "completed"}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
                          Items ({order.items?.length || 0}):
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {order.items && order.items.map((orderItem, idx) => (
                            <div key={orderItem.id || idx} style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "12px",
                              padding: "8px",
                              background: "#f9fafb",
                              borderRadius: "6px"
                            }}>
                              {orderItem.item?.image_url && (
                                <img 
                                  src={orderItem.item.image_url} 
                                  alt={orderItem.item.title}
                                  style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }}
                                />
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500 }}>
                                  {orderItem.item?.title || "Item no longer available"}
                                </div>
                                {orderItem.item?.price && (
                                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                    ${orderItem.item.price} {orderItem.item.currency}
                                  </div>
                                )}
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                  Qty: {orderItem.quantity} × {orderItem.points_cost} pts
                                </div>
                                <div style={{ fontWeight: 600, color: "#10b981" }}>
                                  {orderItem.quantity * orderItem.points_cost} pts
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {order.status !== "cancelled" && (
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "12px" }}>
                          <button
                            onClick={() => openUpdateOrderModal(order)}
                            className="btn btn-secondary btn-sm"
                            disabled={loadingPurchases}
                            title="Add more items to this order"
                          >
                            <Edit className="w-4 h-4" /> Add Items
                          </button>
                          <button
                            onClick={() => cancelPurchase(order.order_id)}
                            className="btn btn-danger btn-sm"
                            disabled={loadingPurchases}
                            title="Cancel order and refund points"
                          >
                            <XCircleIcon className="w-4 h-4" /> Cancel Order
                          </button>
                        </div>
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

                <div className="form-group">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
                    <div>
                      <label className="form-label" style={{ marginBottom: "4px" }}>Order Alerts</label>
                      <p className="form-help" style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                        Receive notifications when you place an order
                      </p>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={orderAlertsEnabled}
                        onChange={toggleOrderAlertsPreference}
                        style={{ width: "20px", height: "20px", cursor: "pointer", marginRight: "8px" }}
                      />
                      <span style={{ fontWeight: 600, color: orderAlertsEnabled ? "#10b981" : "#6b7280" }}>
                        {orderAlertsEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Update Order Modal */}
      {showUpdateOrderModal && updatingOrder && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowUpdateOrderModal(false);
            setUpdatingOrder(null);
            setOrderUpdateItems([]);
            setPurchaseMessage("");
          }
        }}>
          <div className="modal-content" style={{ maxWidth: "600px", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Items to Order #{updatingOrder.order_id}</h3>
              <button
                onClick={() => {
                  setShowUpdateOrderModal(false);
                  setUpdatingOrder(null);
                  setOrderUpdateItems([]);
                  setPurchaseMessage("");
                }}
                className="modal-close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: "20px", color: "#6b7280" }}>
                Select items to add to this order. Points will be deducted from your balance.
              </p>
              <div style={{ marginBottom: "16px", padding: "12px", background: "#f3f4f6", borderRadius: "8px" }}>
                <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>Current Order Total</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#1f2937" }}>
                  {updatingOrder.total_points} points
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>
                  Available Points: <strong style={{ color: "#10b981" }}>
                    {membershipPoints[updatingOrder.organization_id] || 0} pts
                  </strong>
                </div>
              </div>
              {orderUpdateItems.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px" }}>
                  <Package className="w-12 h-12" />
                  <p>No additional items available in this organization's catalog.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
                  {orderUpdateItems.map((item) => {
                    const selectedItem = orderUpdateItems.find(i => i.id === item.id && i.selected);
                    const quantity = selectedItem?.quantity || 0;
                    return (
                      <div
                        key={item.id}
                        style={{
                          border: quantity > 0 ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "12px",
                          background: quantity > 0 ? "#eff6ff" : "white",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px"
                        }}
                      >
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.title}
                            style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: "4px" }}>{item.title}</div>
                          <div style={{ fontSize: "14px", color: "#6b7280" }}>
                            {item.points_cost} points
                            {item.price && ` • $${item.price} ${item.currency}`}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            onClick={() => {
                              const newItems = orderUpdateItems.map(i => {
                                if (i.id === item.id) {
                                  return { ...i, selected: true, quantity: Math.max(0, (i.quantity || 0) - 1) };
                                }
                                return i;
                              });
                              setOrderUpdateItems(newItems);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ minWidth: "32px", padding: "4px 8px" }}
                            disabled={quantity === 0}
                          >
                            -
                          </button>
                          <span style={{ minWidth: "40px", textAlign: "center", fontWeight: 600 }}>
                            {quantity}
                          </span>
                          <button
                            onClick={() => {
                              const newItems = orderUpdateItems.map(i => {
                                if (i.id === item.id) {
                                  return { ...i, selected: true, quantity: (i.quantity || 0) + 1 };
                                }
                                return i;
                              });
                              setOrderUpdateItems(newItems);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ minWidth: "32px", padding: "4px 8px" }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {purchaseMessage && (
                <div className={`alert ${purchaseMessage.includes("✓") ? "alert-success" : "alert-error"}`} style={{ marginTop: "16px" }}>
                  {purchaseMessage.includes("✓") ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  <p>{purchaseMessage}</p>
                </div>
              )}
              <div className="modal-actions" style={{ marginTop: "20px" }}>
                <button
                  onClick={() => {
                    setShowUpdateOrderModal(false);
                    setUpdatingOrder(null);
                    setOrderUpdateItems([]);
                    setPurchaseMessage("");
                  }}
                  className="btn btn-secondary"
                  disabled={loadingPurchases}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const itemsToAdd = orderUpdateItems.filter(i => i.selected && i.quantity > 0);
                    if (itemsToAdd.length === 0) {
                      setPurchaseMessage("✗ Please select at least one item to add");
                      return;
                    }
                    updateOrder(itemsToAdd);
                  }}
                  className="btn btn-primary"
                  disabled={loadingPurchases || orderUpdateItems.filter(i => i.selected && i.quantity > 0).length === 0}
                >
                  {loadingPurchases ? "Adding..." : "Add Items to Order"}
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
  from { opacity: 0; }
  to { opacity: 1; }
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
`;