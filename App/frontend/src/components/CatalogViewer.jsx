// App/frontend/src/components/CatalogViewer.jsx
import React, { useState, useEffect } from "react";
import { Activity, Package } from "lucide-react";

export default function CatalogViewer() {
  // eBay Catalog states
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("truck");
  
  // Organization Catalog states
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgForCatalog, setSelectedOrgForCatalog] = useState(null);
  const [orgCatalog, setOrgCatalog] = useState([]);
  const [loadingOrgCatalog, setLoadingOrgCatalog] = useState(false);
  const [catalogView, setCatalogView] = useState("ebay"); // "ebay" or "organization"

  // Load organizations when component mounts
  useEffect(() => {
    loadAllOrganizations();
  }, []);

  // Load eBay catalog
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

  // Load all organizations for catalog viewing
  const loadAllOrganizations = async () => {
    try {
      const res = await fetch("/api/organizations/all");
      if (!res.ok) throw new Error("Failed to load organizations");
      const data = await res.json();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load organizations:", err);
      setOrganizations([]);
    }
  };

  // Load organization catalog
  const loadOrgCatalog = async (orgId) => {
    setLoadingOrgCatalog(true);
    try {
      const res = await fetch(`/api/organizations/catalog/${orgId}`);
      if (!res.ok) throw new Error("Failed to load organization catalog");
      const data = await res.json();
      setOrgCatalog(data || []);
    } catch (err) {
      console.error("Failed to load organization catalog:", err);
      setOrgCatalog([]);
    } finally {
      setLoadingOrgCatalog(false);
    }
  };

  // Handle organization selection for catalog
  const handleOrgCatalogSelect = async (orgId) => {
    const org = organizations.find(o => o.id === parseInt(orgId));
    setSelectedOrgForCatalog(org);
    if (org) {
      await loadOrgCatalog(org.id);
    }
  };

  return (
    <div className="catalog-viewer">
      {/* Catalog Type Tabs */}
      <div className="report-tabs" style={{ marginBottom: "24px" }}>
        <button
          className={`report-tab ${catalogView === "ebay" ? "active" : ""}`}
          onClick={() => setCatalogView("ebay")}
        >
          eBay Search
        </button>
        <button
          className={`report-tab ${catalogView === "organization" ? "active" : ""}`}
          onClick={() => setCatalogView("organization")}
        >
          Organization Catalogs
        </button>
      </div>

      {catalogView === "ebay" ? (
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
          ) : catalog.length === 0 ? (
            <div className="empty-state">
              <Package className="w-12 h-12" />
              <p>Search for items on eBay</p>
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
      ) : (
        <div className="panel">
          <div className="panel-header">
            <h2>Organization Catalogs</h2>
          </div>
          
          <div className="form-group" style={{ maxWidth: "400px", marginBottom: "24px" }}>
            <label className="form-label">Select Organization</label>
            <select
              className="form-input"
              value={selectedOrgForCatalog?.id || ""}
              onChange={(e) => handleOrgCatalogSelect(e.target.value)}
            >
              <option value="">-- Select Organization --</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {!selectedOrgForCatalog ? (
            <div className="empty-state">
              <Package className="w-12 h-12" />
              <p>Select an organization to view its catalog</p>
            </div>
          ) : loadingOrgCatalog ? (
            <div className="loading-state">
              <Activity className="w-8 h-8 animate-spin" />
              <p>Loading {selectedOrgForCatalog.name} catalog...</p>
            </div>
          ) : orgCatalog.length === 0 ? (
            <div className="empty-state">
              <Package className="w-12 h-12" />
              <p>No items in {selectedOrgForCatalog.name}'s catalog yet</p>
            </div>
          ) : (
            <>
              <div style={{ 
                marginBottom: "20px", 
                padding: "16px", 
                background: "#f0f9ff", 
                borderRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1e40af" }}>
                    {selectedOrgForCatalog.name}
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#3b82f6" }}>
                    {orgCatalog.length} item{orgCatalog.length !== 1 ? 's' : ''} in catalog
                  </p>
                </div>
              </div>

              <div className="catalog-grid">
                {orgCatalog.map((item) => (
                  <div key={item.id} className="catalog-card">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.title} />
                    )}
                    <h3>{item.title}</h3>
                    <div style={{ marginBottom: "12px" }}>
                      <p className="price">${item.price} {item.currency}</p>
                      <p style={{ color: "#10b981", fontWeight: 600, fontSize: "16px" }}>
                        {item.points_cost} points
                      </p>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
                      <strong>Added by:</strong> {item.sponsor_username}
                    </div>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}