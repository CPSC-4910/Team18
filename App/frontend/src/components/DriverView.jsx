// App/frontend/src/components/DriverView.jsx
import React from "react";

export default function DriverView({ user, onLogout }) {
  const [health, setHealth] = React.useState({ ok: null, msg: "" });
  const [db, setDb] = React.useState({ ok: null, msg: "" });
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState("dashboard");
  const [catalog, setCatalog] = React.useState([]);
  const [loadingCatalog, setLoadingCatalog] = React.useState(false);
  const [search, setSearch] = React.useState("truck"); // new search state

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

  // Fetch eBay catalog
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

  // Automatically load when switching to catalog view
  React.useEffect(() => {
    if (view === "catalog") loadCatalog(search);
  }, [view]);

  // === DASHBOARD VIEW ===
  if (view === "dashboard") {
    return (
      <div className="driver-view">
        <header className="dv-header">
          <h1>
            Driver Dashboard
            {effectiveUser?.username ? ` — ${effectiveUser.username}` : ""}
          </h1>
          <p className="muted">
            Welcome back! Here’s the current system status.
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              className="btn catalog-btn"
              onClick={() => setView("catalog")}
            >
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
          {onLogout && (
            <button className="btn logout-btn" onClick={onLogout}>
              Log Out
            </button>
          )}
        </div>
      </header>

      <section className="panel">
        <h2 className="panel-title">eBay Catalog</h2>

        {/* 🔍 Search Box */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search eBay..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              <h3 style={{ fontSize: "1rem", marginTop: "8px" }}>
                {item.title}
              </h3>
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
            </div>
          ))}
        </div>
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

.kv { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 2fr; row-gap: 10px; column-gap: 12px; }
.kv li { display: contents; }
.kv span { color: #666; }
.kv strong { font-weight: 600; }

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

.input {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
}
`;
