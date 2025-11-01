// App/frontend/src/components/DriverView.jsx
import React from "react";

export default function DriverView({ user, onLogout }) {
  const [health, setHealth] = React.useState({ ok: null, msg: "" });
  const [db, setDb] = React.useState({ ok: null, msg: "" });
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState("dashboard");
  const [catalog, setCatalog] = React.useState([]);
  const [loadingCatalog, setLoadingCatalog] = React.useState(false);
  const [search, setSearch] = React.useState("truck");

  // 🛒 Cart state (frontend only)
  const [cart, setCart] = React.useState([]);
  const [showCart, setShowCart] = React.useState(false);

  // Optional persistence between refreshes
  React.useEffect(() => {
    const saved = localStorage.getItem("driverCart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  React.useEffect(() => {
    localStorage.setItem("driverCart", JSON.stringify(cart));
  }, [cart]);

  const effectiveUser = React.useMemo(() => {
    if (user) return user;
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [user]);

  React.useEffect(() => {
    let ignore = false;
    async function check() {
      setLoading(true);
      try {
        const h = await fetch("/api/health").catch(() => null);
        if (!ignore) {
          if (h && h.ok) {
            const j = await h.json().catch(() => ({}));
            setHealth({ ok: true, msg: j?.message || "Server is running" });
          } else {
            setHealth({ ok: false, msg: "Unable to reach backend" });
          }
        }

        const d = await fetch("/api/test-db").catch(() => null);
        if (!ignore) {
          if (d && d.ok) {
            const j = await d.json().catch(() => ({}));
            setDb({
              ok: true,
              msg: j?.message || "Database connection successful",
            });
          } else {
            let errMsg = "Database connection failed";
            if (d) {
              try {
                const j = await d.json();
                errMsg = j?.error || errMsg;
              } catch {}
            }
            setDb({ ok: false, msg: errMsg });
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    check();
    return () => {
      ignore = true;
    };
  }, []);

  // 🔍 eBay Catalog Fetch
  async function loadCatalog(query) {
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
  }

  React.useEffect(() => {
    if (view === "catalog") loadCatalog(search);
  }, [view]);

  // 🛒 Cart Logic
  function addToCart(item) {
    setCart((prev) => {
      if (prev.some((i) => i.itemId === item.itemId)) return prev; // avoid duplicates
      return [...prev, item];
    });
  }

  function removeFromCart(itemId) {
    setCart((prev) => prev.filter((i) => i.itemId !== itemId));
  }

  // === DASHBOARD ===
  if (view === "dashboard") {
    return (
      <div className="driver-view">
        <header className="dv-header">
          <h1>
            Driver Dashboard
            {effectiveUser?.username ? ` — ${effectiveUser.username}` : ""}
          </h1>
          <p className="muted">Welcome back! Here’s the current system status.</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button className="btn catalog-btn" onClick={() => setView("catalog")}>
              Catalog
            </button>
            {onLogout && (
              <button className="btn logout-btn" onClick={onLogout}>
                Log Out
              </button>
            )}
          </div>
        </header>

        {loading && <div className="panel">Loading…</div>}

        <section className="grid grid-3">
          <StatCard
            label="Backend"
            value={
              health.ok === null ? "…" : health.ok ? "Online" : "Offline"
            }
            good={health.ok === true}
          />
          <StatCard
            label="Database"
            value={db.ok === null ? "…" : db.ok ? "Connected" : "Error"}
            good={db.ok === true}
          />
          <StatCard label="Account" value={effectiveUser?.email || "Not set"} />
        </section>

        <section className="panel">
          <h2 className="panel-title">Details</h2>
          <ul className="kv">
            <li>
              <span>Username</span>
              <strong>{effectiveUser?.username ?? "—"}</strong>
            </li>
            <li>
              <span>Email</span>
              <strong>{effectiveUser?.email ?? "—"}</strong>
            </li>
            <li>
              <span>Backend</span>
              <strong>{health.ok === null ? "…" : health.msg}</strong>
            </li>
            <li>
              <span>Database</span>
              <strong>{db.ok === null ? "…" : db.msg}</strong>
            </li>
          </ul>
        </section>

        <style>{css}</style>
      </div>
    );
  }

  // === CATALOG VIEW ===
  return (
    <div className="driver-view">
      <header className="dv-header">
        <h1>
          eBay Catalog
          {effectiveUser?.username ? ` — ${effectiveUser.username}` : ""}
        </h1>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button className="btn catalog-btn" onClick={() => setView("dashboard")}>
            Back
          </button>
          <button
            className="btn catalog-btn"
            onClick={() => setShowCart((prev) => !prev)}
          >
            {showCart ? "Hide Cart" : `View Cart (${cart.length})`}
          </button>
          {onLogout && (
            <button className="btn logout-btn" onClick={onLogout}>
              Log Out
            </button>
          )}
        </div>
      </header>

      <section className="panel">
        <h2 className="panel-title">eBay Catalog</h2>

        {/* 🔍 Search */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search eBay..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadCatalog(search)}
            className="input"
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />
          <button
            className="btn catalog-btn"
            onClick={() => loadCatalog(search)}
          >
            Search
          </button>
        </div>

        {loadingCatalog && <p>Loading items...</p>}

        <div className="grid grid-3">
          {catalog.map((item) => (
            <div key={item.itemId} className="panel">
              <img
                src={item.image?.imageUrl}
                alt={item.title}
                style={{
                  width: "100%",
                  height: "160px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <h3 style={{ fontSize: "1rem", marginTop: "8px" }}>{item.title}</h3>
              <p>
                <strong>${item.price?.value}</strong> {item.price?.currency}
              </p>
              <a
                href={item.itemWebUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on eBay →
              </a>

              {/* 🛒 Add to Cart */}
              <button
                onClick={() => addToCart(item)}
                className="mt-2 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>

        {/* 🧺 Cart Section */}
        {showCart && (
          <section className="mt-8 panel">
            <h2 className="panel-title">Your Shopping Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <div className="grid grid-3">
                {cart.map((item) => (
                  <div key={item.itemId} className="panel">
                    <img
                      src={item.image?.imageUrl}
                      alt={item.title}
                      style={{
                        width: "100%",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                    <h3 style={{ fontSize: "0.9rem", marginTop: "6px" }}>
                      {item.title}
                    </h3>
                    <p>
                      <strong>${item.price?.value}</strong>{" "}
                      {item.price?.currency}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.itemId)}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </section>

      <style>{css}</style>
    </div>
  );
}

function StatCard({ label, value, good }) {
  return (
    <div
      className={`panel stat ${
        good === true ? "ok" : good === false ? "bad" : ""
      }`}
    >
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const css = `
.driver-view { display: grid; gap: 16px; }
.dv-header h1 { margin: 0; }
.dv-header .muted { color: #666; }

.grid { display: grid; gap: 16px; }
.grid-3 { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }

.panel { background: #fff; border: 1px solid #eee; border-radius: 16px; padding: 16px; }
.panel-title { margin: 0 0 12px; }

.stat { text-align: center; }
.stat-value { font-size: 24px; font-weight: 700; }
.stat-label { color: #666; }

.muted { color: #777; }
.stat.ok .stat-value { color: #0a8f3d; }
.stat.bad .stat-value { color: #b00020; }

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 600;
}
.logout-btn:hover { background: #c0392b; }

.catalog-btn {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 600;
}
.catalog-btn:hover { background: #2980b9; }
`;
