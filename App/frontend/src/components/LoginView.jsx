// App/frontend/src/components/LoginView.jsx
import React, { useState } from "react";


console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

// Use environment variable for API URL, fallback to proxy for local dev
const API_URL = import.meta.env.VITE_API_URL || "";

export default function LoginView({ show, onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (isSignup) {
      // Registration validation
      if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        setMessage("Please fill in all fields.");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setMessage("Please enter a valid email address.");
        return;
      }

      // Password validation
      if (password.length < 8) {
        setMessage("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }

      setLoading(true);
      setMessage("Creating account...");

      try {
        // Call signup endpoint
        const response = await fetch(`${API_URL}/api/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            password: password.trim(),
            role: "driver",
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Signup successful! Now automatically log them in
          setMessage(`✓ Account created! Logging you in...`);
          
          // Automatically log in the new user
          setTimeout(async () => {
            try {
              const loginResponse = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  username: username.trim(),
                  password: password.trim(),
                }),
              });

              const loginData = await loginResponse.json();

              if (loginResponse.ok) {
                setMessage(`✓ Welcome, ${loginData.user.username}!`);
                setTimeout(() => {
                  onLoginSuccess(loginData.user);
                }, 800);
              } else {
                setMessage(`✓ Account created! Please sign in.`);
                setIsSignup(false);
                setPassword("");
                setConfirmPassword("");
              }
            } catch (loginErr) {
              console.error("Auto-login error:", loginErr);
              setMessage(`✓ Account created! Please sign in.`);
              setIsSignup(false);
              setPassword("");
              setConfirmPassword("");
            }
          }, 1000);
        } else {
          // Signup failed
          setMessage(`✗ ${data.error || "Registration failed"}`);
        }
      } catch (err) {
        console.error("Signup error:", err);
        setMessage("✗ Unable to connect to server. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      // Login validation
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
    }
  };

  return (
    <section id="loginView" aria-labelledby="loginHeading">
      <div className="login-shell">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2 id="loginHeading">{isSignup ? "Create Driver Account" : "Welcome back"}</h2>
          <p className="login-sub">
            {isSignup 
              ? <>Sign up to join <strong>Truck Points</strong> as a driver</>
              : <>Sign in to continue to <strong>Truck Points</strong></>
            }
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

          {isSignup && (
            <div className="field">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                className="input"
                type="email"
                id="email"
                name="email"
                placeholder="e.g. jdoe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              className="input"
              type="password"
              id="password"
              name="password"
              placeholder={isSignup ? "At least 8 characters" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
          </div>

          {isSignup && (
            <div className="field">
              <label className="label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                className="input"
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          )}

          {!isSignup && (
            <div className="row" style={{ margin: "6px 0 10px" }}>
              <label className="checkbox">
                <input type="checkbox" id="remember" /> Remember me
              </label>
              <a
                href="#"
                className="muted"
                onClick={(e) => {
                  e.preventDefault();
                  show("forgot"); // navigate to ForgotPasswordView
                }}
              >
                Forgot password?
              </a>
            </div>
          )}

          <div className="actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setIsSignup(false);
                setMessage("");
                setEmail("");
                setConfirmPassword("");
                show("about");
              }}
              disabled={loading}
            >
              ← Back to About
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-wide"
              disabled={loading}
            >
              {loading 
                ? (isSignup ? "Creating account..." : "Signing in...") 
                : (isSignup ? "Create Account" : "Sign In")
              }
            </button>
          </div>

          <div style={{ marginTop: "16px", textAlign: "center" }}>
            {isSignup ? (
              <p className="muted" style={{ fontSize: "14px" }}>
                Already have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSignup(false);
                    setMessage("");
                    setEmail("");
                    setConfirmPassword("");
                  }}
                  style={{ color: "#3b82f6", textDecoration: "underline" }}
                >
                  Sign in
                </a>
              </p>
            ) : (
              <p className="muted" style={{ fontSize: "14px" }}>
                Don't have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSignup(true);
                    setMessage("");
                    setEmail("");
                    setConfirmPassword("");
                  }}
                  style={{ color: "#3b82f6", textDecoration: "underline" }}
                >
                  Create driver account
                </a>
              </p>
            )}
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