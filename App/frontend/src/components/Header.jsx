// App/frontend/src/components/Header.jsx
import React from "react";

export default function Header({ show, user, onLogout }) {
  return (
    <header>
      <div className="brand">
        <div className="logo" aria-hidden="true"></div>
        <div className="title">Team 18 • Good Driver Incentive Program</div>
      </div>

      <div className="nav-actions">
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => show("about")}
          aria-label="Go to About"
          title="About"
        >
          About
        </button>

        {user ? (
          <>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => show("dashboard")}
              aria-label="Go to Dashboard"
              title="Dashboard"
            >
              Dashboard
            </button>

            {/* 🕒 Display login and account info when logged in */}
            <div
              className="user-info"
              style={{
                display: "inline-block",
                textAlign: "left",
                marginRight: "16px",
                fontSize: "0.85rem",
                color: "#f0f0f0",
              }}
            >
              <div><strong>{user.username}</strong></div>
              <div style={{ opacity: 0.9 }}>
                <span>Last login:{" "}</span>
                {user.last_login
                  ? new Date(user.last_login).toLocaleString()
                  : "—"}
              </div>
              <div style={{ opacity: 0.9 }}>
                <span>Created:{" "}</span>
                {user.account_created_at
                  ? new Date(user.account_created_at).toLocaleDateString()
                  : "—"}
              </div>
            </div>

            <button
              className="btn btn-primary"
              type="button"
              onClick={onLogout}
              aria-label="Logout"
              title="Logout"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => show("login")}
            aria-label="Go to Login"
            title="Login"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}
