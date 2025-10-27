import React, { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function ForgotPasswordView({ show }) {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = request code, 2 = reset password

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✓ Check your email for the reset code.");
        setStep(2);
      } else {
        setMessage(`✗ ${data.error || "Failed to send code."}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("✗ Could not contact server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✓ Password reset successful! Redirecting to login...");
        setTimeout(() => show("login"), 2000);
      } else {
        setMessage(`✗ ${data.error || "Failed to reset password."}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("✗ Could not contact server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-shell">
      <form className="login-card" onSubmit={step === 1 ? handleRequestCode : handleResetPassword}>
        <h2>Reset Password</h2>

        {step === 1 && (
          <>
            <p className="login-sub">Enter your username to receive a reset code.</p>
            <div className="field">
              <label className="label" htmlFor="username">Username</label>
              <input
                className="input"
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="login-sub">Enter the code you received and choose a new password.</p>
            <div className="field">
              <label className="label" htmlFor="code">Reset Code</label>
              <input
                className="input"
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="newPassword">New Password</label>
              <input
                className="input"
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </>
        )}

        <div className="actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => show("login")}
            disabled={loading}
          >
            ← Back to Login
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Processing..." : step === 1 ? "Send Code" : "Reset Password"}
          </button>
        </div>

        {message && (
          <p
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
    </section>
  );
}
