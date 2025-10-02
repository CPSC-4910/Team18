// App/frontend/src/components/LoginView.jsx
import React, { useState } from "react";


console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

// Use environment variable for API URL, fallback to proxy for local dev
const API_URL = import.meta.env.VITE_API_URL || "";

export default function LoginView({ show, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validation
    if (!username.trim() || !password.trim()) {
      setMessage("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setMessage("Signing in...");

    try {
      // Use API_URL prefix for deployed environment
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful!
        setMessage(`✓ Success! Welcome back, ${data.user.username}!`);
        
        // Call the success callback to switch to dashboard
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 800);
      } else {
        // Login failed
        setMessage(`✗ ${data.error || "Login failed"}`);
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("✗ Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="loginView" aria-labelledby="loginHeading">
      <div className="login-shell">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2 id="loginHeading">Welcome back</h2>
          <p className="login-sub">
            Sign in to continue to <strong>Truck Points</strong>
          </p>

          <div className="field">
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              className="input"
              type="text"
              id="username"
              name="username"
              placeholder="e.g. jdoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              className="input"
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <div className="row" style={{ margin: "6px 0 10px" }}>
            <label className="checkbox">
              <input type="checkbox" id="remember" /> Remember me
            </label>
            <a href="#" className="muted">
              Forgot password?
            </a>
          </div>

          <div className="actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => show("about")}
              disabled={loading}
            >
              ← Back to About
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-wide"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          {message && (
            <p
              id="formMsg"
              className="muted"
              role="status"
              style={{
                marginTop: "12px",
                color: message.includes("✓") ? "#16a34a" : "#dc2626",
                fontWeight: "600",
              }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}